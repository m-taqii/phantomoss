import { Lead } from "../../models/lead.model";
import { Campaign } from "../../models/campaign.model";
import { getQueue } from "../queue";
import { startHunterWorker } from "./hunter.worker";

/**
 * Evaluates the current stock of un-contacted leads for a campaign.
 * If the stock drops below the threshold (dailyLimit), triggers the Hunter 
 * to fetch enough leads to rebuild a 3-day buffer.
 */
export async function evaluateLeadStock(campaignId: string) {
    try {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign || campaign.status !== "active") return;

        const dailyLimit = campaign.schedule?.dailyLimit || 30;
        
        // Stock consists of leads that have been found but not yet contacted
        const currentStock = await Lead.countDocuments({
            campaignId,
            status: { $in: ["discovered", "researched"] }
        });

        console.log(`[Stock Manager] Campaign ${campaignId} current stock: ${currentStock}, Threshold: ${dailyLimit}`);

        // If stock drops to 1 day's worth (or below), replenish
        if (currentStock <= dailyLimit) {
            const targetStock = dailyLimit * 3;
            const deficit = targetStock - currentStock;
            
            console.log(`[Stock Manager] Stock critical! Enqueueing Hunter to fetch ${deficit} leads.`);
            
            const huntQueue = getQueue("hunt");
            await huntQueue.add("hunt", { 
                campaignId,
                targetCount: deficit
            });
            
            startHunterWorker();
        }
    } catch (err) {
        console.error(`[Stock Manager] Failed to evaluate stock for campaign ${campaignId}:`, err);
    }
}
