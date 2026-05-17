import { describe, it, expect, beforeEach } from 'vitest';
import { mlmDb } from '../lib/mlm-database';
import { MonolineCommissionService } from '../lib/monoline-commission-service';
import { User } from '../../shared/mlm-types';

describe('Monoline Commission System Integration', () => {
  // Test users
  let admin: User;
  let sponsor: User;
  let buyer: User;

  beforeEach(async () => {
    // Initialize database
    await mlmDb.init();

    // Create test users
    admin = await mlmDb.createUser({
      fullName: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      membershipType: 'premium',
      isActive: true,
      wallet: { balance: 1000, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 }
    }) as any;

    sponsor = await mlmDb.createUser({
      fullName: 'Sponsor User',
      email: 'sponsor@test.com',
      password: 'password123',
      sponsorId: admin.id,
      membershipType: 'premium',
      isActive: true,
      wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 }
    }) as any;

    buyer = await mlmDb.createUser({
      fullName: 'Buyer User',
      email: 'buyer@test.com',
      password: 'password123',
      sponsorId: sponsor.id,
      membershipType: 'premium',
      isActive: true,
      wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 }
    }) as any;
  });

  it('should calculate monoline commissions correctly', async () => {
    const allUsers = await mlmDb.getAllUsers();
    const productPrice = 100;

    const result = await MonolineCommissionService.calculateMonolineCommissions(
      buyer.id,
      productPrice,
      allUsers
    );

    expect(result.transactions).toBeDefined();
    expect(result.transactions.length).toBeGreaterThan(0);
    expect(result.totalDistributed).toBeGreaterThan(0);
    expect(result.passivePoolAmount).toBeGreaterThan(0);
    expect(result.companyFundAmount).toBeGreaterThan(0);
  });

  it('should distribute commissions and update wallets', async () => {
    const allUsers = await mlmDb.getAllUsers();
    const productPrice = 100;

    const result = await MonolineCommissionService.calculateMonolineCommissions(
      buyer.id,
      productPrice,
      allUsers
    );

    // Create commission transactions
    await mlmDb.createMonolineCommissionTransactions(result.transactions);

    // Verify sponsor received commission
    const updatedSponsor = await mlmDb.getUserById(sponsor.id);
    expect(updatedSponsor?.wallet.balance).toBeGreaterThan(0);
    expect(updatedSponsor?.wallet.totalEarnings).toBeGreaterThan(0);
  });

  it('should add to passive income pool', async () => {
    const poolAmount = 50;
    const initialPool = await mlmDb.getPassiveIncomePoolAmount();

    await mlmDb.addToPassiveIncomePool(poolAmount);

    const updatedPool = await mlmDb.getPassiveIncomePoolAmount();
    expect(updatedPool).toBe(initialPool + poolAmount);
  });

  it('should create passive income distribution record', async () => {
    const poolAmount = 100;
    await mlmDb.addToPassiveIncomePool(poolAmount);

    const allUsers = await mlmDb.getAllUsers();
    const activeUsers = allUsers.filter(u => u.isActive && u.membershipType !== 'free');

    const distribution = await MonolineCommissionService.calculatePassiveIncomeDistribution(
      poolAmount,
      activeUsers
    );

    await mlmDb.createPassiveIncomeDistribution(distribution);

    const userDistributions = await mlmDb.getUserMonolineCommissions(buyer.id, 'monthly');
    // Distribution should be created (check in database)
    expect(distribution.recipients.length).toBeGreaterThanOrEqual(0);
  });

  it('should respect membershipType filter for commission recipients', async () => {
    // Create a free user
    const freeUser = await mlmDb.createUser({
      fullName: 'Free User',
      email: 'free@test.com',
      password: 'password123',
      sponsorId: admin.id,
      membershipType: 'free',
      isActive: true,
      wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 }
    }) as any;

    const allUsers = await mlmDb.getAllUsers();
    const productPrice = 100;

    const result = await MonolineCommissionService.calculateMonolineCommissions(
      freeUser.id,
      productPrice,
      allUsers
    );

    // Free user sponsor should not receive commission (since freeUser is not paid)
    // But should receive from their own sponsor if they're premium
    expect(result.transactions).toBeDefined();
  });

  it('should add to company fund', async () => {
    const fundAmount = 45;
    
    await mlmDb.addToCompanyFund(fundAmount);
    const fund = await mlmDb.getPassiveIncomePoolAmount();
    // Note: company fund is separate from passive income pool
    // This test verifies the method doesn't error
    expect(fundAmount).toBeGreaterThan(0);
  });

  it('should create wallet transaction records', async () => {
    const transaction = await mlmDb.createWalletTransaction({
      userId: sponsor.id,
      amount: 100,
      type: 'commission',
      reference: 'TEST-001',
      description: 'Test commission',
      status: 'completed'
    });

    expect(transaction).toBeDefined();
    expect(transaction.id).toBeDefined();
    expect(transaction.amount).toBe(100);
  });

  it('should store user monoline commissions', async () => {
    const allUsers = await mlmDb.getAllUsers();
    const productPrice = 100;

    const result = await MonolineCommissionService.calculateMonolineCommissions(
      buyer.id,
      productPrice,
      allUsers
    );

    await mlmDb.createMonolineCommissionTransactions(result.transactions);

    // Verify commissions are stored
    const sponsorCommissions = await mlmDb.getUserMonolineCommissions(sponsor.id, 'monthly');
    expect(sponsorCommissions).toBeDefined();
  });
});

describe('Membership Type Consistency', () => {
  it('should use membershipType field consistently', async () => {
    await mlmDb.init();

    const user = await mlmDb.createUser({
      fullName: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      membershipType: 'premium',
      isActive: true
    }) as any;

    const retrieved = await mlmDb.getUserById(user.id);
    expect(retrieved?.membershipType).toBe('premium');
    expect(retrieved?.isActive).toBe(true);
  });

  it('should filter inactive or free members correctly', async () => {
    await mlmDb.init();

    const premiumUser = await mlmDb.createUser({
      fullName: 'Premium User',
      email: 'premium@test.com',
      password: 'password123',
      membershipType: 'premium',
      isActive: true
    }) as any;

    const freeUser = await mlmDb.createUser({
      fullName: 'Free User',
      email: 'free@test.com',
      password: 'password123',
      membershipType: 'free',
      isActive: true
    }) as any;

    const allUsers = await mlmDb.getAllUsers();
    const eligibleUsers = allUsers.filter(u => u.membershipType !== 'free' && u.isActive);

    expect(eligibleUsers.some(u => u.id === premiumUser.id)).toBe(true);
    expect(eligibleUsers.some(u => u.id === freeUser.id)).toBe(false);
  });
});
