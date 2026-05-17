import mongoose from 'mongoose';
import { User } from '../models';
import { mlmDb } from '../mlm-database';
import { FeatureFlags, shouldUseMongoose } from '../feature-flags';
import { hashPassword, comparePassword, generateReferralCode } from '../utils';

/**
 * User Service
 * 
 * Kullanıcı işlemleri için servis katmanı.
 * Feature flag'e göre file-based veya Mongoose kullanır.
 */
export class UserService {
  
  /**
   * Yeni kullanıcı oluştur
   */
  static async createUser(userData: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    sponsorId?: string;
    role?: string;
    membershipType?: string;
  }): Promise<any> {
    const { fullName, email, phone, password, sponsorId, role = 'user', membershipType = 'entry' } = userData;

    // Validation
    if (!fullName || !email || !password) {
      throw new Error('Ad, email ve şifre zorunludur');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Geçerli bir email adresi girin');
    }

    // Email kontrolü
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Bu email adresi zaten kullanılıyor');
    }

    // Şifreyi hash'le
    const hashedPassword = await hashPassword(password);

    // Referral code and Member ID will be handled by the database layer if set to sequential format
    // or we can generate them here to be explicit
    
    // Member ID format: ak000001
    const lastUser = await User.findOne({ memberId: /^ak\d{6}$/ }).sort({ memberId: -1 }).lean();
    let nextNum = 1;
    if (lastUser && lastUser.memberId) {
      const match = lastUser.memberId.match(/ak(\d{6})/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    } else {
      const totalCount = await User.countDocuments();
      nextNum = totalCount + 1;
    }
    const memberId = `ak${nextNum.toString().padStart(6, '0')}`;
    const referralCode = memberId;

    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fullName,
      email: email.toLowerCase(),
      phone: phone || '',
      password: hashedPassword,
      role,
      membershipType,
      referralCode,
      memberId,
      sponsorId: sponsorId || null,
      isActive: false, // İlk başta aktif değil, onay bekliyor
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
        displayName: 'Nefs-i Emmare',
        description: 'Başlangıç seviyesi',
        level: 1,
        commissionRate: 2,
        passiveIncomeRate: 0,
        bonus: 0,
        requirements: {
          personalSalesPoints: 0,
          teamSalesPoints: 0,
          directReferrals: 0,
          minimumMonthlyPoints: 0
        },
        benefits: {
          directSalesCommission: 0,
          teamBonusRate: 0,
          monthlyBonus: 0,
          rankBonus: 0
        }
      },
      registrationDate: new Date(),
      totalInvestment: 0,
      directReferrals: 0,
      totalTeamSize: 0,
      monthlySalesVolume: 0,
      annualSalesVolume: 0,
      kycStatus: 'pending',
      twoFactorEnabled: false
    };

    if (shouldUseMongoose('users')) {
      // Mongoose ile oluştur
      const user = await User.create(newUser);
      console.log(`✅ Kullanıcı oluşturuldu (Mongoose): ${user.email} (${user.id})`);
      return user;
    } else {
      // File-based ile oluştur
      const user = await mlmDb.addUser(newUser);
      console.log(`✅ Kullanıcı oluşturuldu (File): ${user.email} (${user.id})`);
      return user;
    }
  }

  /**
   * Kullanıcı girişi
   */
  static async login(email: string, password: string): Promise<{
    user: any;
    token: string;
  } | null> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Last login date güncelle
    await this.updateUser(user.id, { lastLoginDate: new Date() });

    // Basit token oluştur (production'da JWT kullanılmalı)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        memberId: user.memberId,
        referralCode: user.referralCode
      },
      token
    };
  }

  /**
   * ID ile kullanıcı bul
   */
  static async getUserById(id: string): Promise<any> {
    if (shouldUseMongoose('users')) {
      return await User.findOne({ id });
    } else {
      return await mlmDb.getUserById(id);
    }
  }

  /**
   * Email ile kullanıcı bul
   */
  static async getUserByEmail(email: string): Promise<any> {
    if (shouldUseMongoose('users')) {
      return await User.findOne({ email: email.toLowerCase() });
    } else {
      return await mlmDb.getUserByEmail(email);
    }
  }

  /**
   * Referral code ile kullanıcı bul
   */
  static async getUserByReferralCode(code: string): Promise<any> {
    if (shouldUseMongoose('users')) {
      return await User.findOne({ referralCode: code });
    } else {
      return await mlmDb.getUserByReferralCode(code);
    }
  }

  /**
   * Tüm kullanıcıları getir
   */
  static async getAllUsers(limit: number = 100, skip: number = 0): Promise<{
    users: any[];
    total: number;
  }> {
    if (shouldUseMongoose('users')) {
      const [users, total] = await Promise.all([
        User.find().limit(limit).skip(skip).sort({ createdAt: -1 }),
        User.countDocuments()
      ]);
      return { users, total };
    } else {
      const allUsers = await mlmDb.getAllUsers();
      const paginatedUsers = allUsers.slice(skip, skip + limit);
      return { users: paginatedUsers, total: allUsers.length };
    }
  }

  /**
   * Kullanıcı güncelle
   */
  static async updateUser(id: string, updates: any): Promise<any> {
    if (shouldUseMongoose('users')) {
      return await User.findOneAndUpdate(
        { id },
        { $set: { ...updates, updatedAt: new Date() } },
        { new: true }
      );
    } else {
      return await mlmDb.updateUser(id, updates);
    }
  }

  /**
   * Kullanıcı sil
   */
  static async deleteUser(id: string): Promise<boolean> {
    if (shouldUseMongoose('users')) {
      const result = await User.deleteOne({ id });
      return result.deletedCount > 0;
    } else {
      return await mlmDb.deleteUser(id);
    }
  }

  /**
   * Kullanıcı ara
   */
  static async searchUsers(query: string, limit: number = 50): Promise<any[]> {
    if (shouldUseMongoose('users')) {
      return await User.find({
        $or: [
          { fullName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { memberId: { $regex: query, $options: 'i' } },
          { phone: { $regex: query } }
        ]
      }).limit(limit);
    } else {
      const allUsers = await mlmDb.getAllUsers();
      const q = query.toLowerCase();
      return allUsers.filter(u => 
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.memberId?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      ).slice(0, limit);
    }
  }

  /**
   * Sponsor'un direct referral'larını getir
   */
  static async getDirectReferrals(sponsorId: string): Promise<any[]> {
    if (shouldUseMongoose('users')) {
      return await User.find({ sponsorId });
    } else {
      return await mlmDb.getDirectReferrals(sponsorId);
    }
  }

  /**
   * Kullanıcı network ağacını getir
   */
  static async getUserNetwork(userId: string, depth: number = 3): Promise<any> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    if (depth <= 0) {
      return { ...user, children: [] };
    }

    const directReferrals = await this.getDirectReferrals(userId);
    const children = await Promise.all(
      directReferrals.map(child => this.getUserNetwork(child.id, depth - 1))
    );

    return {
      ...user,
      children: children.filter(Boolean)
    };
  }

  /**
   * Kullanıcı istatistikleri
   */
  static async getUserStats(userId: string): Promise<{
    directReferrals: number;
    totalTeamSize: number;
    totalInvestment: number;
    walletBalance: number;
  }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    const directReferrals = await this.getDirectReferrals(userId);
    const totalTeamSize = await this.calculateTeamSize(userId);

    return {
      directReferrals: directReferrals.length,
      totalTeamSize,
      totalInvestment: user.totalInvestment || 0,
      walletBalance: user.wallet?.balance || 0
    };
  }

  /**
   * Toplam takım büyüklüğünü hesapla (recursive)
   */
  static async calculateTeamSize(userId: string): Promise<number> {
    const directReferrals = await this.getDirectReferrals(userId);
    let count = directReferrals.length;

    for (const referral of directReferrals) {
      count += await this.calculateTeamSize(referral.id);
    }

    return count;
  }

  /**
   * Admin: Kullanıcıyı aktif et
   */
  static async activateUser(userId: string, adminId: string): Promise<any> {
    const user = await this.updateUser(userId, {
      isActive: true,
      membershipStartDate: new Date()
    });

    console.log(`✅ Kullanıcı aktif edildi: ${user.email} tarafından: ${adminId}`);
    return user;
  }

  /**
   * Admin: Kullanıcı rolünü güncelle
   */
  static async updateUserRole(userId: string, newRole: string, adminId: string): Promise<any> {
    const allowedRoles = ['user', 'admin', 'moderator'];
    if (!allowedRoles.includes(newRole)) {
      throw new Error(`Geçersiz rol: ${newRole}. İzin verilen roller: ${allowedRoles.join(', ')}`);
    }

    return await this.updateUser(userId, { role: newRole });
  }
}