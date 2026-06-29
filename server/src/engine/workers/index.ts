export * from "./hunter.worker";
export * from "./outreacher.worker";
export * from "./researcher.worker";
export * from "./scheduler.worker";
export * from "./strategist.worker";
export * from "./inbox.worker";

import { startHunterWorker } from "./hunter.worker";
import { startOutreacherWorker } from "./outreacher.worker";
import { startResearcherWorker } from "./researcher.worker";
import { startSchedulerWorker } from "./scheduler.worker";
import { startStrategistWorker } from "./strategist.worker";
import { startLearnerWorker } from "./learner.worker";
import { setupInboxHeartbeat } from "./inbox.worker";

export async function initializeWorkers() {
    console.log("[System] Initializing all background workers...");
    startHunterWorker();
    startOutreacherWorker();
    startResearcherWorker();
    startSchedulerWorker();
    startStrategistWorker();
    startLearnerWorker();
    await setupInboxHeartbeat();
    console.log("[System] All background workers initialized.");
}