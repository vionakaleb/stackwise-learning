import type { Concept } from "@/types/content";

export const systemsConcepts: Concept[] = [
  {
    slug: "surviving-the-spike",
    trackId: "systems",
    title: "Surviving the spike",
    blurb: "A read-heavy service gets a traffic spike. You have a budget and four things you can buy.",
    syllabusRef: "DDIA 2e, Ch 2 Defining Nonfunctional Requirements and Ch 6 Replication",
    minutes: 14,
    prerequisites: [],
    phases: [
      {
        kind: "predict",
        prompt:
          "Traffic quadruples for three ticks. Ninety percent of it is reads. If you could buy only one thing, which keeps the most requests alive?",
        options: ["More app servers", "A cache", "A read replica", "A queue"],
        correctIndex: 1,
        afterword:
          "A cache wins here because it removes work rather than moving it. The other three all still send every request down the chain to the database.",
      },
      {
        kind: "play",
        brief:
          "Place components under the budget. Traffic runs for ten ticks with a spike in the middle. Keep the drop rate under two percent without overspending.",
        puzzleId: "read-scaling-spike",
      },
      {
        kind: "reveal",
        heading: "Capacity is a chain, not a number",
        body: [
          "The thing that trips people up in this puzzle is stacking app servers. Four app servers give you a thousand requests a tick of app capacity, and the drop rate does not move at all. The database behind them still caps out much lower, so the extra servers just queue up in front of the same wall.",
          "A system's throughput is set by its narrowest link. Adding capacity anywhere else just moves the queue. So the first question on any scaling problem is not 'what should I add' but 'where is the wall'.",
          "The three tools do genuinely different jobs. A cache removes work from the chain entirely. A read replica widens the database link, but only for reads, because writes still land on the single leader. A queue does not add capacity at all. It borrows capacity from the future by holding overflow until a quieter tick.",
          "That last one matters. A queue turns dropped requests into delayed requests. Whether that is a win depends on whether your users would rather wait or see an error, which is a product decision and not a technical one.",
          "There is a cost to replicas that this simulation does not model. A follower is behind the leader by some amount of replication lag, so a user who writes and then immediately reads from a replica can fail to see their own write.",
        ],
      },
      {
        kind: "implement",
        heading: "Routing reads and writes",
        language: "typescript",
        code: `interface DatabasePool {
  leader: Connection;
  followers: Connection[];
}

type QueryIntent = "read" | "write";

export function pickConnection(
  pool: DatabasePool,
  intent: QueryIntent,
  hasRecentWrite: boolean,
): Connection {
  if (intent === "write") return pool.leader;
  if (hasRecentWrite) return pool.leader;
  if (pool.followers.length === 0) return pool.leader;

  const index = Math.floor(Math.random() * pool.followers.length);
  return pool.followers[index];
}`,
        notes: [
          "The hasRecentWrite check is read-your-writes consistency. A user who just posted something reads from the leader for a short window so they see their own change.",
          "Everything else spreads across followers. Random choice is crude but it is stateless, which makes it easy to run on many app servers at once.",
          "Falling back to the leader when there are no followers keeps the function honest during a deployment where replicas are still coming up.",
        ],
      },
      {
        kind: "case",
        heading: "Why read replicas are the default first move",
        body: [
          "Single-leader replication with read-only followers is a standard, well-supported feature in PostgreSQL, MySQL, and the managed database services built on them. It is usually the first scaling step teams reach for on a read-heavy workload.",
          "The appeal is that it needs almost no application change. Point read queries at a follower and you have widened your read capacity without touching your data model.",
          "The cost arrives with replication lag. Followers apply the leader's changes asynchronously by default, so there is a window where a follower is stale. Applications work around this with read-your-writes routing, monotonic read guarantees, or by accepting the staleness where it does not matter.",
          "Notice what replicas do not fix. Write capacity is unchanged, because every write still goes through one leader. When writes are the wall, the answer is sharding, which is a much bigger commitment.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "Single-leader replication, replication lag, and read-your-writes consistency are covered in DDIA 2e Ch 6. Support in PostgreSQL and MySQL is standard and documented in their manuals. I have not benchmarked lag figures, so no numbers are claimed here.",
      },
    ],
  },
  {
    slug: "when-writes-are-the-wall",
    trackId: "systems",
    title: "When writes are the wall",
    blurb: "Same simulator, flipped workload. The tools that saved you last time will not save you here.",
    syllabusRef: "DDIA 2e, Ch 6 Replication and Ch 7 Sharding",
    minutes: 12,
    prerequisites: ["surviving-the-spike"],
    phases: [
      {
        kind: "predict",
        prompt:
          "This workload is eighty percent writes and the read path already has spare capacity. You add two read replicas. What happens to the drop rate during the spike?",
        options: [
          "It falls by roughly two thirds",
          "It falls a little",
          "It does not move at all",
          "It gets worse",
        ],
        correctIndex: 2,
        afterword:
          "Replicas add read capacity, and the read path was never the constraint. Widening a link that already had slack changes nothing, so the drop rate comes out identical to the decimal.",
      },
      {
        kind: "play",
        brief:
          "Write-heavy workload, smaller budget, tighter SLA. Find the placement that actually moves the drop rate.",
        puzzleId: "write-bottleneck",
      },
      {
        kind: "reveal",
        heading: "The single leader is the ceiling",
        body: [
          "In single-leader replication every write goes through one node. That node is a hard ceiling on write throughput and no amount of followers changes it. Followers make reads cheaper. They do nothing for the write path.",
          "So in this level the replicas are pure waste, and the cache barely helps either, because only a fifth of the traffic is reads. What moves the number is enough app capacity to reach the write ceiling, plus a queue to spread the spike across more ticks.",
          "The queue is worth understanding properly, because it is the honest answer more often than people expect. If writes can tolerate a second or two of delay, a durable log in front of the database converts a spike that would drop requests into a spike that adds latency. That is usually the better failure.",
          "When the queue is not enough and writes genuinely exceed one machine, you are out of easy moves. The real answer is sharding: splitting the data by key across several leaders so each one carries part of the write load.",
          "Sharding is a big commitment. Cross-shard queries get harder, transactions across shards need coordination, and you inherit the problem of picking a key that spreads load evenly instead of creating a hot shard.",
        ],
      },
      {
        kind: "implement",
        heading: "Picking a shard",
        language: "typescript",
        code: `import { createHash } from "node:crypto";

export function shardIndexForKey(key: string, shardCount: number): number {
  if (!Number.isInteger(shardCount) || shardCount < 1) {
    throw new RangeError("shardCount must be a whole number of one or more.");
  }

  const digest = createHash("sha256").update(key).digest();
  return digest.readUInt32BE(0) % shardCount;
}`,
        notes: [
          "Hashing the key spreads writes evenly even when the raw keys are clustered, which is what stops one shard becoming a hot spot.",
          "The cost of hashing is that range queries no longer work. Keys that are adjacent in value land on unrelated shards.",
          "Changing shardCount remaps almost every key. Production systems use consistent hashing or a fixed set of logical partitions to avoid a full reshuffle when they grow.",
        ],
      },
      {
        kind: "case",
        heading: "The hot shard problem",
        body: [
          "Hash-based sharding spreads keys evenly, which sounds like it settles the matter. It does not, because traffic is not evenly spread across keys.",
          "A social platform sharding by user id will still put one celebrity's entire write volume on one shard. Every reply, like, and mention for that account hashes to the same place. That shard becomes the wall while the rest sit idle.",
          "DDIA 2e covers this directly under skewed workloads and hot spots in the sharding chapter. The usual mitigations are to split the hot key artificially by appending a random suffix, or to handle celebrity accounts on a separate path entirely.",
          "The general shape is worth carrying with you. An even split of keys is not an even split of load, and the difference between those two is where a lot of production incidents live.",
        ],
        confidence: "widely-documented",
        sourceNote:
          "Skewed workloads and hot spots appear in DDIA 2e Ch 7 (Sharding), per the chapter's section listing. The celebrity account example is a common illustration of the pattern rather than a claim about a specific named company's architecture.",
      },
    ],
  },
];
