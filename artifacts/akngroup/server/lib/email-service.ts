import nodemailer from 'nodemailer';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Development only - helps with some self-signed certs
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  // If no SMTP credentials are provided, log to console (Development Mode)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("=================================================");
    console.log("📧 EMAIL SIMULATION (No SMTP Credentials Set)");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    console.log("=================================================");
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Kutbul Zaman'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
  const subject = "Şifre Sıfırlama Kodu - Kutbul Zaman";
  const text = `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 10 dakika süreyle geçerlidir.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Şifre Sıfırlama İsteği</h2>
      <p>Merhaba,</p>
      <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki kodu kullanarak şifrenizi yenileyebilirsiniz:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${code}</span>
      </div>
      <p>Bu kod 10 dakika süreyle geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
      <p>Teşekkürler,<br>Kutbul Zaman Ekibi</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}
