import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis";
import learnerGraph from "../agents/learner/graph";
import { GetQueueName, getQueue } from "../queue";
import { Learning } from "../../models/learning.model";
import { startStrategistWorker } from "./strategist.worker";

const workersCache = new Map<string, Worker>();

export function startLearnerWorker(): Worker {
    const queueName = GetQueueName("learner");

    if (!workersCache.has(queueName)) {
        const worker = new Worker(queueName, async (job) => {
            console.log(`[Learner Worker | ${queueName}] Processing job ${job.id}`);
            const { campaignId } = job.data;

            try {
                const finalState = await learnerGraph.invoke({ campaignId });

                if (finalState.error || !finalState.learningId) {
                    console.error(`[Learner Worker] Analysis failed for campaign ${campaignId}:`, finalState.error);
                    return;
                }

                console.log(`[Learner Worker] Learning saved: ${finalState.learningId}`);

                // Fetch the learning to build the strategist input
                const learning = await Learning.findById(finalState.learningId);
                if (!learning) return;

                // Build learnings array from the insights
                const learnings: string[] = [];
                for (const angle of learning.insights.workingAngles) {
                    learnings.push(`[WORKING] ${angle}`);
                }
                for (const angle of learning.insights.failingAngles) {
                    learnings.push(`[FAILING] ${angle}`);
                }
                for (const objection of learning.insights.commonObjections) {
                    learnings.push(`[OBJECTION] ${objection}`);
                }
                for (const rebuttal of learning.insights.successfulRebuttals) {
                    learnings.push(`[REBUTTAL] ${rebuttal}`);
                }
                for (const refinement of learning.insights.icpRefinements) {
                    learnings.push(`[ICP] ${refinement}`);
                }

                // Re-trigger the Strategist with learnings
                const strategyQ = getQueue("strategy");
                await strategyQ.add("refine-strategy", {
                    campaignId,
                    learnings,
                    isRefinement: true,
                });

                // Wake the Strategist worker
                startStrategistWorker();

                console.log(`[Learner Worker] Triggered Strategist re-run for campaign ${campaignId}`);
            } catch (err) {
                console.error(`[Learner Worker Error]`, err);
                throw err;
            }
        }, {
            connection: createRedisConnection() as any,
            concurrency: 2,
        });

        worker.on("error", (err) => {
            console.error(`[Learner Worker Error | ${queueName}]`, err);
        });

        worker.on("drained", async () => {
            console.log(`[Learner Worker | ${queueName}] Queue drained. Shutting down.`);
            await worker.close();
            workersCache.delete(queueName);
        });

        workersCache.set(queueName, worker);
    }

    return workersCache.get(queueName)!;
}
