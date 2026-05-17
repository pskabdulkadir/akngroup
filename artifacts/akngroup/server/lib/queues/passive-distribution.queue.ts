import Queue from 'bull';
import { PassiveIncomePool, User, WalletTransaction, CommissionAudit } from '../models';
import { applyWalletTransactions } from '../wallet-transaction.service';
import { MonolineCommissionService } from '../monoline-commission-service';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Redis connection configuration with better error handling
const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // Critical for Bull to handle retries internally
  enableReadyCheck: false,
  retryStrategy(times: number) {
    if (times > 5) {
      console.warn(`⚠️ Redis connection retried ${times} times, giving up to avoid crash.`);
      return null; // Stop retrying
    }
    return Math.min(times * 100, 3000);
  }
};

let passiveDistributionQueueInstance: any = null;

try {
  if (process.env.USE_REDIS === 'true') {
    passiveDistributionQueueInstance = new Queue('passive-distribution', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });
  } else {
    throw new Error('Redis disabled via USE_REDIS env');
  }
} catch (error) {
  // console.log('ℹ️ Redis queue disabled, using mock queue');
  // Create a mock queue if Redis fails entirely (e.g. library load error)
  passiveDistributionQueueInstance = {
    add: async () => ({ id: 'mock-job' }),
    process: () => { },
    on: () => { },
    getRepeatableCount: async () => 0,
    getRepeatableJobs: async () => [],
    removeRepeatableByKey: async () => { },
    getActiveCount: async () => 0,
    getCompletedCount: async () => 0,
    getFailedCount: async () => 0,
    getWaitingCount: async () => 0,
    getDelayedCount: async () => 0,
    getPausedCount: async () => 0,
    clean: async () => { }
  };
}

export const passiveDistributionQueue = passiveDistributionQueueInstance;

interface PassiveDistributionJobData {
  method?: 'equal' | 'weighted_by_career' | 'weighted_by_activity';
  timestamp: number;
}

// Process the job
passiveDistributionQueue.process(async (job) => {
  console.log(`🌊 Processing passive distribution job ${job.id}...`);

  const { method = 'equal', timestamp } = job.data as PassiveDistributionJobData;

  try {
    // Get current pool amount
    const poolDoc = await PassiveIncomePool.findOne();
    if (!poolDoc || poolDoc.totalAmount <= 0) {
      console.log('ℹ️ Passive income pool is empty, skipping distribution');
      return {
        distributed: 0,
        recipients: 0,
        reason: 'Pool empty'
      };
    }

    const poolAmount = poolDoc.totalAmount;

    // Get active members
    const activeMembers = await User.find({
      isActive: true,
      membershipType: { $nin: ['free', 'NONE'] }
    });

    if (activeMembers.length === 0) {
      console.log('ℹ️ No active members, skipping distribution');
      return {
        distributed: 0,
        recipients: 0,
        reason: 'No active members'
      };
    }

    console.log(`📊 Distributing $${poolAmount.toFixed(2)} to ${activeMembers.length} members using ${method} method`);

    // Calculate distribution based on method
    const distribution = await MonolineCommissionService.calculatePassiveIncomeDistribution(
      poolAmount,
      activeMembers as any,
      method
    );

    // Create transactions
    const transactions = distribution.recipients
      .filter(r => r.amount > 0)
      .map(r => ({
        userId: r.userId,
        amount: r.amount,
        type: 'PASSIVE',
        reference: `PASSIVE-${timestamp}-${r.userId}`,
        description: `Passive income distribution (${method})`
      }));

    if (transactions.length === 0) {
      console.warn('⚠️ No valid transactions created');
      return {
        distributed: 0,
        recipients: 0,
        reason: 'No valid transactions'
      };
    }

    // Apply transactions
    console.log(`💰 Applying ${transactions.length} transactions...`);
    await applyWalletTransactions(transactions);

    // Deduct from pool
    const totalDistributed = transactions.reduce((sum, t) => sum + t.amount, 0);

    await PassiveIncomePool.updateOne(
      { _id: poolDoc._id },
      {
        totalAmount: 0,
        lastDistributedAt: new Date(),
        $push: {
          distributionHistory: {
            distributedAt: new Date(),
            amount: totalDistributed,
            recipients: activeMembers.length,
            method
          }
        }
      }
    );

    // Audit log
    await CommissionAudit.create({
      userId: 'system',
      action: 'DISTRIBUTED',
      amount: totalDistributed,
      reason: `Scheduled passive income distribution to ${activeMembers.length} members`,
      performedBy: 'passive-distribution-queue',
      timestamp: new Date(),
      metadata: {
        method,
        recipients: activeMembers.length,
        originalPoolAmount: poolAmount,
        jobId: job.id,
        queueTime: timestamp
      }
    });

    console.log(`✅ Passive distribution completed`);
    console.log(`   - Total distributed: $${totalDistributed.toFixed(2)}`);
    console.log(`   - Recipients: ${activeMembers.length}`);
    console.log(`   - Method: ${method}`);

    return {
      success: true,
      distributed: totalDistributed,
      recipients: activeMembers.length,
      method,
      transactionCount: transactions.length
    };

  } catch (error) {
    console.error('❌ Passive distribution error:', error);
    throw error;
  }
});

// Job event handlers
passiveDistributionQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed:`, job.returnvalue);
});

passiveDistributionQueue.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} failed:`, error.message);
});

passiveDistributionQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} stalled, will be retried`);
});

// Initialize scheduled job
export async function initializePassiveDistributionScheduler() {
  try {
    // Remove old repeating jobs
    const repeatableJobs = await passiveDistributionQueue.getRepeatableCount();
    console.log(`Found ${repeatableJobs} repeating jobs`);

    if (repeatableJobs > 0) {
      const jobs = await passiveDistributionQueue.getRepeatableJobs();
      for (const job of jobs) {
        await passiveDistributionQueue.removeRepeatableByKey(job.key);
        console.log(`Removed old repeating job: ${job.key}`);
      }
    }

    // Add new repeating job (every hour)
    const frequency = parseInt(process.env.PASSIVE_DISTRIBUTION_INTERVAL_MS || '3600000', 10); // 1 hour default

    await passiveDistributionQueue.add(
      { method: 'equal', timestamp: Date.now() },
      {
        repeat: { every: frequency },
        jobId: `passive-distribution-${Date.now()}`,
        removeOnComplete: {
          age: 3600 // Keep completed jobs for 1 hour
        }
      }
    );

    console.log(`⏰ Passive distribution scheduler initialized`);
    console.log(`   - Interval: ${frequency}ms (${(frequency / 1000 / 60).toFixed(0)} minutes)`);
    console.log(`   - Default method: equal`);
    console.log(`   - Max retries: 3`);

  } catch (error) {
    console.error('❌ Error initializing passive distribution scheduler:', error);
    throw error;
  }
}

// Manual trigger for immediate distribution
export async function triggerPassiveDistributionNow(method: 'equal' | 'weighted_by_career' | 'weighted_by_activity' = 'equal') {
  try {
    console.log(`🔨 Manually triggering passive distribution (method: ${method})...`);

    const job = await passiveDistributionQueue.add(
      { method, timestamp: Date.now() },
      {
        priority: 10, // High priority for manual trigger
        removeOnComplete: true
      }
    );

    console.log(`✅ Distribution job created with ID: ${job.id}`);
    return job;

  } catch (error) {
    console.error('❌ Error triggering distribution:', error);
    throw error;
  }
}

// Get queue status
export async function getPassiveDistributionQueueStatus() {
  try {
    const activeCount = await passiveDistributionQueue.getActiveCount();
    const completedCount = await passiveDistributionQueue.getCompletedCount();
    const failedCount = await passiveDistributionQueue.getFailedCount();
    const pendingCount = await passiveDistributionQueue.getWaitingCount();
    const delayedCount = await passiveDistributionQueue.getDelayedCount();
    const pausedCount = await passiveDistributionQueue.getPausedCount();

    return {
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      pending: pendingCount,
      delayed: delayedCount,
      paused: pausedCount,
      total: activeCount + completedCount + failedCount + pendingCount + delayedCount
    };
  } catch (error) {
    console.error('Error getting queue status:', error);
    return null;
  }
}

// Cleanup old jobs
export async function cleanupPassiveDistributionQueue() {
  try {
    console.log('🧹 Cleaning up passive distribution queue...');

    // Clean completed jobs older than 7 days
    await passiveDistributionQueue.clean(7 * 24 * 3600 * 1000, 'completed');

    // Clean failed jobs older than 30 days
    await passiveDistributionQueue.clean(30 * 24 * 3600 * 1000, 'failed');

    console.log('✅ Queue cleanup completed');
  } catch (error) {
    console.error('Error cleaning up queue:', error);
  }
}

// Export queue for monitoring
export { passiveDistributionQueue as queue };
