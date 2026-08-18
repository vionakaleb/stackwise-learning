export type ComponentKind = "appServer" | "cache" | "readReplica" | "queue";

export interface ComponentSpec {
  kind: ComponentKind;
  label: string;
  description: string;
  costPerUnit: number;
  maxUnits: number;
}

export interface TrafficLevel {
  id: string;
  arrivalsPerTick: number[];
  readShare: number;
  appCapacityPerServer: number;
  databaseWriteCapacity: number;
  databaseReadCapacity: number;
  replicaReadCapacity: number;
  cacheHitRate: number;
  queueDepthPerUnit: number;
  budget: number;
  maxDropRate: number;
  baseline: Record<ComponentKind, number>;
  available: ComponentSpec[];
}

export type Placement = Record<ComponentKind, number>;

export interface TickResult {
  tick: number;
  arrivals: number;
  servedByCache: number;
  servedByApp: number;
  queued: number;
  dropped: number;
}

export interface SimulationResult {
  ticks: TickResult[];
  totalArrivals: number;
  totalDropped: number;
  dropRate: number;
  peakQueue: number;
}

export class CapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapacityError";
  }
}

export function totalCost(placement: Placement, level: TrafficLevel): number {
  return level.available.reduce(
    (cost, spec) => cost + spec.costPerUnit * (placement[spec.kind] ?? 0),
    0,
  );
}

function assertPlacementValid(placement: Placement, level: TrafficLevel) {
  for (const spec of level.available) {
    const units = placement[spec.kind] ?? 0;
    if (!Number.isInteger(units) || units < 0) {
      throw new CapacityError(`Unit count for ${spec.label} must be a whole number of zero or more.`);
    }
    if (units > spec.maxUnits) {
      throw new CapacityError(`${spec.label} is capped at ${spec.maxUnits} units on this level.`);
    }
  }
}

interface Capacities {
  read: number;
  write: number;
  app: number;
}

function capacitiesFor(placement: Placement, level: TrafficLevel): Capacities {
  return {
    read: level.databaseReadCapacity + (placement.readReplica ?? 0) * level.replicaReadCapacity,
    write: level.databaseWriteCapacity,
    app: (placement.appServer ?? 0) * level.appCapacityPerServer,
  };
}

interface Backlog {
  reads: number;
  writes: number;
}

interface TickOutcome {
  servedByCache: number;
  servedByApp: number;
  backlog: Backlog;
  dropped: number;
}

function runTick(
  arrivals: number,
  backlog: Backlog,
  placement: Placement,
  level: TrafficLevel,
  capacities: Capacities,
  queueCapacity: number,
): TickOutcome {
  const reads = Math.floor(arrivals * level.readShare);
  const writes = arrivals - reads;

  const servedByCache = (placement.cache ?? 0) > 0 ? Math.floor(reads * level.cacheHitRate) : 0;
  const pendingReads = reads - servedByCache + backlog.reads;
  const pendingWrites = writes + backlog.writes;

  const readsDatabaseAllows = Math.min(pendingReads, capacities.read);
  const writesDatabaseAllows = Math.min(pendingWrites, capacities.write);
  const requested = readsDatabaseAllows + writesDatabaseAllows;

  const appShare = requested === 0 ? 1 : Math.min(1, capacities.app / requested);
  const servedReads = Math.floor(readsDatabaseAllows * appShare);
  const servedWrites = Math.floor(writesDatabaseAllows * appShare);

  const leftoverReads = pendingReads - servedReads;
  const leftoverWrites = pendingWrites - servedWrites;
  const overflow = leftoverReads + leftoverWrites;

  const queued = Math.min(overflow, queueCapacity);
  const queuedReads = overflow === 0 ? 0 : Math.floor((leftoverReads / overflow) * queued);

  return {
    servedByCache,
    servedByApp: servedReads + servedWrites,
    backlog: { reads: queuedReads, writes: queued - queuedReads },
    dropped: overflow - queued,
  };
}

export function simulate(placement: Placement, level: TrafficLevel): SimulationResult {
  assertPlacementValid(placement, level);

  const capacities = capacitiesFor(placement, level);
  const queueCapacity = (placement.queue ?? 0) * level.queueDepthPerUnit;

  let backlog: Backlog = { reads: 0, writes: 0 };
  let peakQueue = 0;
  let totalArrivals = 0;
  let totalDropped = 0;

  const ticks = level.arrivalsPerTick.map((arrivals, tick) => {
    totalArrivals += arrivals;

    const outcome = runTick(arrivals, backlog, placement, level, capacities, queueCapacity);
    const queued = outcome.backlog.reads + outcome.backlog.writes;

    backlog = outcome.backlog;
    peakQueue = Math.max(peakQueue, queued);
    totalDropped += outcome.dropped;

    return {
      tick,
      arrivals,
      servedByCache: outcome.servedByCache,
      servedByApp: outcome.servedByApp,
      queued,
      dropped: outcome.dropped,
    };
  });

  return {
    ticks,
    totalArrivals,
    totalDropped,
    dropRate: totalArrivals === 0 ? 0 : totalDropped / totalArrivals,
    peakQueue,
  };
}

export interface TrafficVerdict {
  result: SimulationResult;
  spend: number;
  budget: number;
  withinBudget: boolean;
  meetsSla: boolean;
  cleared: boolean;
}

export function evaluate(placement: Placement, level: TrafficLevel): TrafficVerdict {
  const result = simulate(placement, level);
  const spend = totalCost(placement, level);
  const withinBudget = spend <= level.budget;
  const meetsSla = result.dropRate <= level.maxDropRate;

  return {
    result,
    spend,
    budget: level.budget,
    withinBudget,
    meetsSla,
    cleared: withinBudget && meetsSla,
  };
}
