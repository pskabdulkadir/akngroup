import { User } from '../../shared/mlm-types';

export class FraudDetectionService {

  /**
   * Sponsor zincirinde loop var mı kontrol eder
   */
  static detectLoop(user: User, allUsers: User[], maxDepth = 20): boolean {
    const visited = new Set<string>();
    let currentUser = user;
    let depth = 0;

    // user.sponsorId might be populated or just an ID string.
    while (currentUser && currentUser.sponsorId && depth < maxDepth) {
      if (visited.has(currentUser.sponsorId)) {
        // Loop bulundu
        return true;
      }
      visited.add(currentUser.sponsorId);
      
      // Find sponsor in allUsers array
      const sponsor = allUsers.find(u => u.id === currentUser.sponsorId);
      if (!sponsor) break;
      
      currentUser = sponsor;
      depth++;
    }

    return false;
  }

  /**
   * Kullanıcının kendine veya alt zincire kazanç yazıp yazmadığını kontrol et
   */
  static checkSelfOrDownlineBonus(user: User, allUsers: User[], transactions: any[]): boolean {
    // Get all downline IDs for this user
    const downlineIds = this.getDownlineUserIds(user, allUsers);
    const downlineSet = new Set(downlineIds);

    for (const tx of transactions) {
      // Check if user is the source of the transaction (buyer)
      if (tx.sourceUserId === user.id) {
         // 1. Self commission: User buying and getting commission themselves
         if (tx.userId === user.id) return true;
         
         // 2. Reverse commission: User buying and commission going to downline (should go upline)
         if (downlineSet.has(tx.userId)) return true;
      }
    }
    return false;
  }

  static getDownlineUserIds(user: User, allUsers: User[]): string[] {
    const ids: string[] = [];
    const directReferrals = allUsers.filter(u => u.sponsorId === user.id);
    for (const referral of directReferrals) {
      ids.push(referral.id);
      ids.push(...this.getDownlineUserIds(referral, allUsers));
    }
    return ids;
  }
}