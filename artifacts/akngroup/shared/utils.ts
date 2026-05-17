export function hashPassword(password: string): string {
  // Basit hash örneği (gerçekte bcrypt kullan)
  return "hashed_" + password;
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}