import Bull, { Queue, Job } from 'bull';

/**
 * Bull Queue Configuration - For Async Tasks
 * 
 * Background Jobs:
 * - Commission distribution
 * - Passive income calculation
 * - Email notifications
 * - Blockchain transactions
 * - Webhook calls
 * - Data aggregation
 */

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    maxRetriesPerRequest: null;
    enableReadyCheck: false;
    enableOfflineQueue: false;
    retryStrategy?: (times: number) => number;
  };
  settings: {
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;
    };
    removeOnComplete: boolean;
    removeOnFail: boolean;
  };
}

const queueConfig: QueueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '1'),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    // Add custom retry strategy
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  },
  settings: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
};

import { MockQueue } from '../lib/mock-queue';

// ... (existing imports)

// Determine if we should use Redis or Mock Queue
// Default to Mock Queue if USE_REDIS is not explicitly 'true' to ensure immediate stability
const USE_REDIS = process.env.USE_REDIS === 'true';

function createQueue(name: string): any {
  if (USE_REDIS) {
    return new Bull(name, queueConfig as any);
  } else {
    return new MockQueue(name);
  }
}

/**
 * Queue instances
 */
export const queues = {
  // Commission distribution
  commissions: createQueue('commissions'),

  // Passive income distribution
  passiveIncome: createQueue('passive-income'),

  // Email notifications
  email: createQueue('email'),

  // SMS notifications
  sms: createQueue('sms'),

  // Webhook events
  webhooks: createQueue('webhooks'),

  // Payment processing
  payments: createQueue('payments'),

  // Data aggregation and reporting
  reports: createQueue('reports'),

  // Cache warming
  cacheWarmup: createQueue('cache-warmup'),

  // Cleanup tasks
  cleanup: createQueue('cleanup')
};

/**
 * Initialize all queues
 */
export async function initializeQueues(): Promise<void> {
  console.log('📦 Initializing Bull Queues...');

  for (const [name, queue] of Object.entries(queues)) {
    // Setup event listeners
    queue.on('completed', (job: Job) => {
      console.log(`✅ ${name} queue: Job ${job.id} completed`);
    });

    queue.on('failed', (job: Job, err: Error) => {
      console.error(`❌ ${name} queue: Job ${job.id} failed - ${err.message}`);
    });

    queue.on('error', (err: Error) => {
      console.error(`⚠️ ${name} queue error:`, err);
    });

    // Setup queue processing
    await setupQueueProcessors(name, queue);

    console.log(`✓ ${name} queue initialized`);
  }

  console.log('🎯 All Bull Queues ready');
}

/**
 * Setup processors for each queue
 */
async function setupQueueProcessors(name: string, queue: Queue): Promise<void> {
  const concurrency = getConcurrency(name);

  queue.process(concurrency, async (job: Job) => {
    console.log(`▶️ Processing ${name} job:`, job.id);

    try {
      switch (name) {
        case 'commissions':
          return await processCommissionJob(job);
        case 'passive-income':
          return await processPassiveIncomeJob(job);
        case 'email':
          return await processEmailJob(job);
        case 'sms':
          return await processSmsJob(job);
        case 'webhooks':
          return await processWebhookJob(job);
        case 'payments':
          return await processPaymentJob(job);
        case 'reports':
          return await processReportJob(job);
        case 'cache-warmup':
          return await processCacheWarmupJob(job);
        case 'cleanup':
          return await processCleanupJob(job);
        default:
          throw new Error(`Unknown queue: ${name}`);
      }
    } catch (error) {
      console.error(`Error processing ${name} job:`, error);
      throw error;
    }
  });
}

/**
 * Get concurrency for each queue type
 */
function getConcurrency(queueName: string): number {
  const concurrencyMap: Record<string, number> = {
    'commissions': 50,      // High priority, process many in parallel
    'passive-income': 20,
    'email': 10,
    'sms': 10,
    'webhooks': 25,
    'payments': 15,         // Be conservative with payments
    'reports': 5,           // Heavy processing
    'cache-warmup': 30,
    'cleanup': 2
  };
  return concurrencyMap[queueName] || 10;
}

/**
 * Job processors
 */

async function processCommissionJob(job: Job): Promise<any> {
  // Implementation for commission distribution
  console.log('Processing commission:', job.data);
  return { processed: true };
}

async function processPassiveIncomeJob(job: Job): Promise<any> {
  // Implementation for passive income distribution
  console.log('Processing passive income:', job.data);
  return { processed: true };
}

async function processEmailJob(job: Job): Promise<any> {
  // Send email notification
  console.log('Sending email:', job.data.to);
  return { sent: true };
}

async function processSmsJob(job: Job): Promise<any> {
  // Send SMS notification
  console.log('Sending SMS:', job.data.phone);
  return { sent: true };
}

async function processWebhookJob(job: Job): Promise<any> {
  // Trigger webhook
  console.log('Triggering webhook:', job.data.url);
  return { triggered: true };
}

async function processPaymentJob(job: Job): Promise<any> {
  // Process payment
  console.log('Processing payment:', job.data.paymentId);
  return { processed: true };
}

async function processReportJob(job: Job): Promise<any> {
  // Generate report
  console.log('Generating report:', job.data.reportType);
  return { generated: true };
}

async function processCacheWarmupJob(job: Job): Promise<any> {
  // Warm up cache with frequently accessed data
  console.log('Warming cache:', job.data.key);
  return { warmed: true };
}

async function processCleanupJob(job: Job): Promise<any> {
  // Cleanup old data
  console.log('Running cleanup:', job.data.task);
  return { cleaned: true };
}

/**
 * Queue management utilities
 */

export async function enqueueCommissionJob(data: any, priority?: number): Promise<Job> {
  return queues.commissions.add(data, {
    priority: priority || 5,
    delay: 0
  });
}

export async function enqueuePassiveIncomeJob(data: any): Promise<Job> {
  return queues.passiveIncome.add(data, {
    repeat: {
      cron: '0 0 1 * *' // First day of every month
    }
  });
}

export async function enqueueEmailJob(data: any): Promise<Job> {
  return queues.email.add(data, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<Record<string, any>> {
  const stats: Record<string, any> = {};

  for (const [name, queue] of Object.entries(queues)) {
    const counts = await queue.getJobCounts();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();

    stats[name] = {
      ...counts,
      completed,
      failed,
      isPaused: queue.isPaused()
    };
  }

  return stats;
}

/**
 * Cleanup function
 */
export async function closeQueues(): Promise<void> {
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
  console.log('🔌 All Bull Queues closed');
}

export default queueConfig;
