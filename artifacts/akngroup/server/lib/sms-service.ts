export class SmsService {
  static async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId: string }> {
    console.log(`[SMS] to ${phone}: ${message}`);
    return { success: true, messageId: `sms_${Date.now()}` };
  }
}

export default SmsService;
