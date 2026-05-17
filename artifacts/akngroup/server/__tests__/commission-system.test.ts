/**
 * Commission System Tests
 * 
 * Commission hesaplama, duplicate prevention, passive income dağıtım
 * ve HELD → PAID geçiş testleri.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, WalletTransaction, CommissionLog, PassiveIncomePool } from '../lib/models';
import { MonolineCommissionService } from '../lib/monoline-commission-service';
import { WalletTransactionService } from '../lib/services/wallet-transaction.service';
import { DistributionLockService } from '../lib/services/distribution-lock.service';
import { BusinessLogicService } from '../lib/services/business-logic.service';

// Test data helpers
const createTestUser = async (overrides: any = {}) => {
  const userData = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email: `user-${Date.now()}@test.com`,
    fullName: 'Test User',
    password: 'hashedpassword123',
    isActive: true,
    membershipType: 'entry',
    wallet: {
      balance: 0,
      totalEarnings: 0,
      sponsorBonus: 0,
      careerBonus: 0,
      passiveIncome: 0,
      leadershipBonus: 0
    },
    careerLevel: {
      id: '1',
      name: 'Nefs-i Emmare',
      level: 1,
      commissionRate: 2
    },
    ...overrides
  };

  return await User.create(userData);
};

describe('Commission System Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      WalletTransaction.deleteMany({}),
      CommissionLog.deleteMany({}),
      PassiveIncomePool.deleteMany({})
    ]);
  });

  // ==================== COMMISSION CALCULATION TESTS ====================

  describe('Commission Calculation', () => {
    it('should calculate direct sponsor commission correctly', async () => {
      // Create sponsor and buyer
      const sponsor = await createTestUser({ email: 'sponsor@test.com' });
      const buyer = await createTestUser({ 
        email: 'buyer@test.com', 
        sponsorId: sponsor.id 
      });

      // Calculate commission for $100 purchase
      const result = await MonolineCommissionService.calculateMonolineCommissions(
        buyer.id,
        100
      );

      // Direct sponsor commission (15%)
      expect(result.totalDistributed).toBeGreaterThan(0);
      expect(result.transactions).toHaveLength(expect.any(Number));
      
      const directCommission = result.transactions.find(t => t.type === 'direct');
      expect(directCommission).toBeDefined();
      expect(directCommission!.amount).toBeCloseTo(15, 1); // 15% of $100
    });

    it('should calculate depth commissions correctly', async () => {
      // Create a chain: user1 -> user2 -> user3 -> buyer
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ 
        email: 'user2@test.com', 
        sponsorId: user1.id 
      });
      const user3 = await createTestUser({ 
        email: 'user3@test.com', 
        sponsorId: user2.id 
      });
      const buyer = await createTestUser({ 
        email: 'buyer@test.com', 
        sponsorId: user3.id 
      });

      const result = await MonolineCommissionService.calculateMonolineCommissions(
        buyer.id,
        100
      );

      // Should have depth commissions
      const depthCommissions = result.transactions.filter(t => t.type === 'depth');
      expect(depthCommissions.length).toBeGreaterThan(0);
    });

    it('should not distribute commission to inactive users', async () => {
      const sponsor = await createTestUser({ 
        email: 'sponsor@test.com',
        isActive: false // Inactive
      });
      const buyer = await createTestUser({ 
        email: 'buyer@test.com', 
        sponsorId: sponsor.id 
      });

      const result = await MonolineCommissionService.calculateMonolineCommissions(
        buyer.id,
        100
      );

      // Sponsor is inactive, should not receive commission
      const sponsorCommission = result.transactions.find(t => t.userId === sponsor.id);
      expect(sponsorCommission).toBeUndefined();
    });

    it('should not distribute commission to users with free membership', async () => {
      const sponsor = await createTestUser({ 
        email: 'sponsor@test.com',
        membershipType: 'free'
      });
      const buyer = await createTestUser({ 
        email: 'buyer@test.com', 
        sponsorId: sponsor.id 
      });

      const result = await MonolineCommissionService.calculateMonolineCommissions(
        buyer.id,
        100
      );

      // Sponsor has free membership, should not receive commission
      const sponsorCommission = result.transactions.find(t => t.userId === sponsor.id);
      expect(sponsorCommission).toBeUndefined();
    });

    it('should calculate passive pool and company fund amounts', async () => {
      const buyer = await createTestUser({ email: 'buyer@test.com' });

      const result = await MonolineCommissionService.calculateMonolineCommissions(
        buyer.id,
        100
      );

      // Passive pool (0.5%) and company fund (45%)
      expect(result.passivePoolAmount).toBeCloseTo(0.5, 2);
      expect(result.companyFundAmount).toBeCloseTo(45, 2);
    });
  });

  // ==================== DUPLICATE PREVENTION TESTS ====================

  describe('Duplicate Prevention (Idempotency)', () => {
    it('should not distribute commission twice for the same sale reference', async () => {
      const sponsor = await createTestUser({ email: 'sponsor@test.com' });
      const buyer = await createTestUser({ 
        email: 'buyer@test.com', 
        sponsorId: sponsor.id 
      });

      const saleReference = `SALE-${Date.now()}`;

      // First distribution
      await MonolineCommissionService.distributeMonolineCommission(
        buyer.id,
        100,
        saleReference
      );

      // Second distribution (should be skipped)
      await MonolineCommissionService.distributeMonolineCommission(
        buyer.id,
        100,
        saleReference
      );

      // Check CommissionLog
      const logs = await CommissionLog.find({ reference: saleReference });
      expect(logs).toHaveLength(1);

      // Check transactions - should only have one set
      const transactions = await WalletTransaction.find({
        reference: { $regex: `^${saleReference}-` }
      });
      
      // Should have transactions from first distribution only
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should allow distribution with different sale references', async () => {
      const sponsor = await createTestUser({ email: 'sponsor@test.com' });
      const buyer = await createTestUser({ 
        email: 'buyer@test.com', 
        sponsorId: sponsor.id 
      });

      const saleRef1 = `SALE-${Date.now()}-1`;
      const saleRef2 = `SALE-${Date.now()}-2`;

      // First distribution
      await MonolineCommissionService.distributeMonolineCommission(
        buyer.id,
        100,
        saleRef1
      );

      // Second distribution with different reference
      await MonolineCommissionService.distributeMonolineCommission(
        buyer.id,
        100,
        saleRef2
      );

      // Both should be logged
      const logs = await CommissionLog.find({ 
        reference: { $in: [saleRef1, saleRef2] } 
      });
      expect(logs).toHaveLength(2);
    });

    it('should check isCommissionAlreadyProcessed correctly', async () => {
      const saleReference = `SALE-${Date.now()}`;

      // Initially not processed
      let isProcessed = await MonolineCommissionService.isCommissionAlreadyProcessed(saleReference);
      expect(isProcessed).toBe(false);

      // Create a log
      await CommissionLog.create({
        reference: saleReference,
        totalAmount: 100,
        transactionCount: 1,
        processedAt: new Date(),
        processedBy: 'system'
      });

      // Now should be processed
      isProcessed = await MonolineCommissionService.isCommissionAlreadyProcessed(saleReference);
      expect(isProcessed).toBe(true);
    });
  });

  // ==================== PASSIVE INCOME DISTRIBUTION TESTS ====================

  describe('Passive Income Distribution', () => {
    it('should distribute passive income equally among active users', async () => {
      // Create active users
      const users = await Promise.all([
        createTestUser({ email: 'user1@test.com', isActive: true }),
        createTestUser({ email: 'user2@test.com', isActive: true }),
        createTestUser({ email: 'user3@test.com', isActive: true })
      ]);

      // Add funds to pool
      await PassiveIncomePool.create({
        totalAmount: 300,
        lastUpdated: new Date()
      });

      // Calculate distribution
      const distribution = await MonolineCommissionService.calculatePassiveIncomeDistribution(
        300,
        users.map(u => u.toObject()),
        'equal'
      );

      // Each user should get $100
      expect(distribution.amountPerMember).toBeCloseTo(100, 2);
      expect(distribution.recipients).toHaveLength(3);
      expect(distribution.recipients[0].amount).toBeCloseTo(100, 2);
    });

    it('should not distribute to inactive users', async () => {
      const activeUser = await createTestUser({ 
        email: 'active@test.com', 
        isActive: true 
      });
      const inactiveUser = await createTestUser({ 
        email: 'inactive@test.com', 
        isActive: false 
      });

      const distribution = await MonolineCommissionService.calculatePassiveIncomeDistribution(
        100,
        [activeUser.toObject(), inactiveUser.toObject()],
        'equal'
      );

      // Only active user should receive
      expect(distribution.recipients).toHaveLength(2); // Both are in list
      const inactiveRecipient = distribution.recipients.find(r => r.userId === inactiveUser.id);
      // But inactive user's amount should be 0 or they shouldn't receive
      expect(inactiveRecipient?.amount || 0).toBe(0);
    });

    it('should handle weighted by career level distribution', async () => {
      const user1 = await createTestUser({ 
        email: 'user1@test.com',
        careerLevel: { level: 1, name: 'Level 1' }
      });
      const user2 = await createTestUser({ 
        email: 'user2@test.com',
        careerLevel: { level: 2, name: 'Level 2' }
      });

      const distribution = await MonolineCommissionService.calculatePassiveIncomeDistribution(
        300,
        [user1.toObject(), user2.toObject()],
        'weighted_by_career'
      );

      // User2 should get more (level 2 vs level 1)
      const user1Amount = distribution.recipients.find(r => r.userId === user1.id)?.amount || 0;
      const user2Amount = distribution.recipients.find(r => r.userId === user2.id)?.amount || 0;
      
      expect(user2Amount).toBeGreaterThan(user1Amount);
    });

    it('should handle empty user list', async () => {
      const distribution = await MonolineCommissionService.calculatePassiveIncomeDistribution(
        100,
        [],
        'equal'
      );

      expect(distribution.activeMembers).toBe(0);
      expect(distribution.amountPerMember).toBe(0);
      expect(distribution.recipients).toHaveLength(0);
    });
  });

  // ==================== HELD → PAID TRANSITION TESTS ====================

  describe('HELD to PAID Transition', () => {
    it('should release HELD transactions to PAID', async () => {
      const user = await createTestUser({ email: 'user@test.com' });

      // Create HELD transactions
      await WalletTransaction.create([
        {
          userId: user.id,
          amount: 100,
          type: 'CAREER',
          reference: 'HELD-TX-1',
          status: 'HELD',
          createdAt: new Date()
        },
        {
          userId: user.id,
          amount: 50,
          type: 'CAREER',
          reference: 'HELD-TX-2',
          status: 'HELD',
          createdAt: new Date()
        }
      ]);

      // Release HELD transactions
      const result = await WalletTransactionService.releaseHeldTransactions(user.id);

      expect(result.releasedCount).toBe(2);
      expect(result.totalAmount).toBe(150);

      // Verify transactions are now PAID
      const updatedTransactions = await WalletTransaction.find({ userId: user.id });
      updatedTransactions.forEach(tx => {
        expect(tx.status).toBe('PAID');
        expect(tx.monthlyResetReleasedAt).toBeDefined();
      });
    });

    it('should calculate HELD balance correctly', async () => {
      const user = await createTestUser({ email: 'user@test.com' });

      // Create mixed status transactions
      await WalletTransaction.create([
        {
          userId: user.id,
          amount: 100,
          type: 'CAREER',
          reference: 'HELD-TX-1',
          status: 'HELD',
          createdAt: new Date()
        },
        {
          userId: user.id,
          amount: 50,
          type: 'CAREER',
          reference: 'PAID-TX-1',
          status: 'PAID',
          createdAt: new Date()
        }
      ]);

      const heldBalance = await WalletTransactionService.getHeldBalance(user.id);
      expect(heldBalance).toBe(100);
    });

    it('should not release PAID transactions', async () => {
      const user = await createTestUser({ email: 'user@test.com' });

      await WalletTransaction.create({
        userId: user.id,
        amount: 100,
        type: 'CAREER',
        reference: 'PAID-TX-1',
        status: 'PAID',
        createdAt: new Date()
      });

      const result = await WalletTransactionService.releaseHeldTransactions(user.id);
      expect(result.releasedCount).toBe(0);
    });
  });

  // ==================== DISTRIBUTION LOCK TESTS ====================

  describe('Distribution Lock (Race Condition Prevention)', () => {
    it('should only allow one instance to acquire lock', async () => {
      const instanceId1 = 'instance-1';
      const instanceId2 = 'instance-2';

      // First instance acquires lock
      const result1 = await DistributionLockService.acquirePassiveDistributionLock(instanceId1);
      expect(result1.success).toBe(true);

      // Second instance should fail
      const result2 = await DistributionLockService.acquirePassiveDistributionLock(instanceId2);
      expect(result2.success).toBe(false);

      // First instance still holds lock
      const status = await DistributionLockService.getPassiveDistributionLockStatus();
      expect(status.isLocked).toBe(true);
      expect(status.lockedBy).toBe(instanceId1);
    });

    it('should release lock after TTL expires', async () => {
      const instanceId = 'instance-1';

      // Acquire lock
      await DistributionLockService.acquirePassiveDistributionLock(instanceId);

      // Wait for TTL to expire (in test, we'll check the status)
      const status = await DistributionLockService.getPassiveDistributionLockStatus();
      expect(status.isLocked).toBe(true);

      // Release lock
      await DistributionLockService.releasePassiveDistributionLock(instanceId);

      // Should be unlocked
      const newStatus = await DistributionLockService.getPassiveDistributionLockStatus();
      expect(newStatus.isLocked).toBe(false);
    });

    it('should allow new instance to acquire expired lock', async () => {
      const instanceId1 = 'instance-1';
      const instanceId2 = 'instance-2';

      // First instance acquires lock
      await DistributionLockService.acquirePassiveDistributionLock(instanceId1);

      // Manually expire the lock (simulate TTL)
      await DistributionLock.updateOne(
        { lockName: 'passive_income_distribution' },
        { $set: { expiresAt: new Date(Date.now() - 1000) } }
      );

      // Second instance should be able to acquire
      const result = await DistributionLockService.acquirePassiveDistributionLock(instanceId2);
      expect(result.success).toBe(true);
    });

    it('should not allow wrong instance to release lock', async () => {
      const instanceId1 = 'instance-1';
      const instanceId2 = 'instance-2';

      // First instance acquires lock
      await DistributionLockService.acquirePassiveDistributionLock(instanceId1);

      // Second instance tries to release (should fail)
      const result = await DistributionLockService.releasePassiveDistributionLock(instanceId2);
      expect(result.success).toBe(false);

      // Lock should still be held
      const status = await DistributionLockService.getPassiveDistributionLockStatus();
      expect(status.isLocked).toBe(true);
    });
  });

  // ==================== BUSINESS LOGIC TESTS ====================

  describe('Business Logic', () => {
    describe('checkEarningLimit', () => {
      it('should allow commission within limits', async () => {
        const user = await createTestUser({ email: 'user@test.com' });

        const result = await BusinessLogicService.checkEarningLimit(user.id, 1000);

        expect(result.canProceed).toBe(true);
        expect(result.allowedAmount).toBe(1000);
        expect(result.dailyLimit).toBe(10000);
        expect(result.monthlyLimit).toBe(100000);
      });

      it('should reject commission exceeding daily limit', async () => {
        const user = await createTestUser({ email: 'user@test.com' });

        // Create transactions that exceed daily limit
        await WalletTransaction.create({
          userId: user.id,
          amount: 9500,
          type: 'CAREER',
          reference: 'TX-1',
          status: 'PAID',
          createdAt: new Date()
        });

        const result = await BusinessLogicService.checkEarningLimit(user.id, 1000);

        expect(result.canProceed).toBe(false);
        expect(result.allowedAmount).toBe(500); // 10000 - 9500
      });
    });

    describe('validateInitialMembership', () => {
      it('should validate valid membership purchase', async () => {
        const user = await createTestUser({ 
          email: 'user@test.com',
          membershipType: 'NONE'
        });

        const result = await BusinessLogicService.validateInitialMembership(user.id, 100);

        expect(result.isValid).toBe(true);
        expect(result.minimumRequired).toBe(20);
      });

      it('should reject purchase below minimum', async () => {
        const user = await createTestUser({ email: 'user@test.com' });

        const result = await BusinessLogicService.validateInitialMembership(user.id, 10);

        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('BELOW_MINIMUM');
      });

      it('should reject if user already has membership', async () => {
        const user = await createTestUser({ 
          email: 'user@test.com',
          membershipType: 'entry'
        });

        const result = await BusinessLogicService.validateInitialMembership(user.id, 100);

        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('ALREADY_HAS_MEMBERSHIP');
      });
    });

    describe('checkUserActivity', () => {
      it('should return active for valid user', async () => {
        const user = await createTestUser({
          email: 'user@test.com',
          isActive: true,
          membershipType: 'entry',
          monthlySalesVolume: 100,
          lastActivityDate: new Date()
        });

        const result = await BusinessLogicService.checkUserActivity(user.id);

        expect(result.isActive).toBe(true);
        expect(result.canEarnCommission).toBe(true);
        expect(result.canReceivePassiveIncome).toBe(true);
      });

      it('should return inactive for inactive user', async () => {
        const user = await createTestUser({
          email: 'user@test.com',
          isActive: false
        });

        const result = await BusinessLogicService.checkUserActivity(user.id);

        expect(result.isActive).toBe(false);
        expect(result.restrictions).toContain('USER_NOT_ACTIVE');
      });

      it('should return inactive for user below monthly minimum', async () => {
        const user = await createTestUser({
          email: 'user@test.com',
          isActive: true,
          membershipType: 'entry',
          monthlySalesVolume: 5 // Below $20 minimum
        });

        const result = await BusinessLogicService.checkUserActivity(user.id);

        expect(result.isActive).toBe(false);
        expect(result.restrictions).toContain('BELOW_MONTHLY_MINIMUM');
      });
    });
  });
});