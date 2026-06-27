import { Queue, QueueEvents } from "bullmq";
import { redisConnection } from "../lib/redis";

const connection = redisConnection as any;

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: true, // Auto-cleanup successful jobs to save memory
  removeOnFail: false,    // Keep failed jobs for inspection/retries
};

export function GetQueueName(agentType: string) {
  return `${agentType}-Queue`;
}

const queuesCache = new Map<string, Queue>();
const queueEventsCache = new Map<string, QueueEvents>();

// Returns a cached BullMQ Queue instance for a specific agent and agency.
export function getQueue(agentType: string): Queue {
  if (agentType === "scheduler") {
    if (!queuesCache.has("scheduler-jobs")) {
      queuesCache.set("scheduler-jobs", new Queue("scheduler-jobs", { connection, defaultJobOptions }));
    }
    return queuesCache.get("scheduler-jobs")!;
  }

  const name = GetQueueName(agentType);
  if (!queuesCache.has(name)) {
    queuesCache.set(name, new Queue(name, { connection, defaultJobOptions }));
  }
  return queuesCache.get(name)!;
}

// Returns a cached BullMQ QueueEvents instance for a specific agent and agency.
export function getQueueEvents(agentType: string): QueueEvents {
  const name = GetQueueName(agentType);
  if (!queueEventsCache.has(name)) {
    queueEventsCache.set(name, new QueueEvents(name, { connection }));
  }
  return queueEventsCache.get(name)!;
}
