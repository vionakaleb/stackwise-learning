import { describe, expect, it } from "vitest";
import { CapacityError, Placement, TrafficLevel, evaluate, simulate, totalCost } from "@/engines/traffic/engine";

const level: TrafficLevel = {
  id: "traffic-test",
  arrivalsPerTick: [100, 100, 400, 400, 100],
  readShare: 0.9,
  appCapacityPerServer: 120,
  databaseWriteCapacity: 60,
  databaseReadCapacity: 60,
  replicaReadCapacity: 120,
  cacheHitRate: 0.8,
  queueDepthPerUnit: 150,
  budget: 10,
  maxDropRate: 0.02,
  baseline: { appServer: 1, cache: 0, readReplica: 0, queue: 0 },
  available: [
    { kind: "appServer", label: "App server", description: "", costPerUnit: 2, maxUnits: 4 },
    { kind: "cache", label: "Cache", description: "", costPerUnit: 2, maxUnits: 1 },
    { kind: "readReplica", label: "Read replica", description: "", costPerUnit: 3, maxUnits: 2 },
    { kind: "queue", label: "Queue", description: "", costPerUnit: 1, maxUnits: 2 },
  ],
};

const bare: Placement = { appServer: 1, cache: 0, readReplica: 0, queue: 0 };

describe("traffic simulation", () => {
  it("drops requests when the spike passes the capacity chain", () => {
    const result = simulate(bare, level);
    expect(result.totalDropped).toBeGreaterThan(0);
  });

  it("is deterministic across runs", () => {
    expect(simulate(bare, level)).toEqual(simulate(bare, level));
  });

  it("conserves every request across cache, app, queue and drops", () => {
    const result = simulate(bare, level);
    const accountedFor = result.ticks.reduce(
      (total, tick) => total + tick.servedByCache + tick.servedByApp + tick.dropped,
      0,
    );
    const stillQueued = result.ticks[result.ticks.length - 1].queued;
    expect(accountedFor + stillQueued).toBe(result.totalArrivals);
  });

  it("absorbs read traffic once a cache is placed", () => {
    const cached = simulate({ ...bare, cache: 1 }, level);
    expect(cached.totalDropped).toBeLessThan(simulate(bare, level).totalDropped);
  });

  it("stays capped by the database even with many app servers", () => {
    const overProvisioned = simulate({ ...bare, appServer: 4 }, level);
    const oneReplicaAdded = simulate({ ...bare, appServer: 4, readReplica: 1 }, level);
    expect(oneReplicaAdded.totalDropped).toBeLessThan(overProvisioned.totalDropped);
  });

  it("adds up the cost of every placed unit", () => {
    expect(totalCost({ appServer: 2, cache: 1, readReplica: 1, queue: 1 }, level)).toBe(10);
  });

  it("fails a design that meets the SLA but overspends", () => {
    const verdict = evaluate({ appServer: 4, cache: 1, readReplica: 2, queue: 2 }, level);
    expect(verdict.withinBudget).toBe(false);
    expect(verdict.cleared).toBe(false);
  });

  it("rejects a unit count above the level cap", () => {
    expect(() => simulate({ ...bare, cache: 9 }, level)).toThrow(CapacityError);
  });
});
