import { Job, JobOptions, ProcessCallbackFunction, Queue } from 'bull';
import { EventEmitter } from 'events';

/**
 * In-Memory Mock Queue System
 * Redis bağlantısı olmadığında uygulamanın çalışmaya devam etmesini sağlar.
 * Production ortamında Redis kullanılmalıdır, bu sadece development/fallback içindir.
 */
export class MockQueue extends EventEmitter {
    private jobs: any[] = [];
    private processingCallback: Function | null = null;
    private isProcessing = false;

    constructor(public name: string, public options?: any) {
        super();
        console.log(`⚠️ Using In-Memory Mock Queue for: ${name}`);
    }

    async add(data: any, options?: JobOptions): Promise<any> {
        const job = {
            id: Math.random().toString(36).substr(2, 9),
            data,
            opts: options || {},
            progress: 0,
            timestamp: Date.now(),
            finishedOn: null,
            processedOn: null,
            returnvalue: null,
            failedReason: null,
            update: async (progress: any) => { job.progress = progress; },
        };

        this.jobs.push(job);

        // Simulate async processing
        if (this.processingCallback) {
            setTimeout(() => this.processNext(), 100);
        }

        return job;
    }

    process(concurrency: number | ProcessCallbackFunction<any>, callback?: ProcessCallbackFunction<any>): Promise<any> {
        if (typeof concurrency === 'function') {
            callback = concurrency;
        }
        this.processingCallback = callback as Function;
        this.isProcessing = true;
        this.processNext();
        return Promise.resolve();
    }

    private async processNext() {
        if (this.jobs.length === 0 || !this.processingCallback) return;

        const job = this.jobs.shift();
        if (!job) return;

        try {
            job.processedOn = Date.now();
            await this.processingCallback(job);
            job.finishedOn = Date.now();
            this.emit('completed', job);
        } catch (error) {
            job.finishedOn = Date.now();
            job.failedReason = error instanceof Error ? error.message : 'Unknown error';
            this.emit('failed', job, error);
        }

        // Process next job if existing
        if (this.jobs.length > 0) {
            setTimeout(() => this.processNext(), 100);
        }
    }

    async close(): Promise<void> {
        this.isProcessing = false;
        this.jobs = [];
        return Promise.resolve();
    }

    async getJobCounts(): Promise<any> {
        return {
            waiting: this.jobs.length,
            active: this.isProcessing ? 1 : 0,
            completed: 0,
            failed: 0,
            delayed: 0
        };
    }

    async getCompletedCount(): Promise<number> {
        return 0;
    }

    async getFailedCount(): Promise<number> {
        return 0;
    }

    isPaused(): boolean {
        return !this.isProcessing;
    }
}
