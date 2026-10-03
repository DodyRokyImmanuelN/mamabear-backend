// import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class MailService {
  private parseSender(): { name: string; email: string } {
    const from =
      process.env.MAIL_FROM ?? '"Mama Beruang" <noreply@mamabear.com>';
    const match = /^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/.exec(from);

    if (match) {
      return {
        name: match[1].trim() || 'Mama Beruang',
        email: match[2].trim(),
      };
    }

    return { name: 'Mama Beruang', email: from.trim() };
  }

  private async send({
    to,
    subject,
    html,
    text,
  }: SendMailInput): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not set');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: this.parseSender(),
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Brevo API ${res.status}: ${body}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verifikasi Email Mama Beruang',
      text: `Terima kasih sudah mendaftar. Verifikasi email Anda melalui tautan berikut: ${verifyUrl}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#3f3f46">
  <h2 style="color:#d6557e">Verifikasi Email Mama Beruang</h2>
  <p>Hai, terima kasih sudah mendaftar. Klik tombol di bawah untuk memverifikasi emailmu:</p>
  <p style="text-align:center;margin:28px 0">
    <a href="${verifyUrl}"
       style="background:#d6557e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;font-weight:bold">
      Verifikasi Email
    </a>
  </p>
  <p style="font-size:12px;color:#71717a">Jika tombol tidak berfungsi, salin tautan ini:<br>${verifyUrl}</p>
</div>`,
    });
  }

  async confirmEmailVerified(email: string, userName: string) {
    await this.send({
      to: email,
      subject: 'Selamat datang ke rumah Mamabear!',
      text: `${userName}, selamat datang ke rumah Mamabear!`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#3f3f46">
  <h2 style="color:#d6557e">Selamat datang, ${userName}!</h2>
  <p>Akunmu sudah aktif. Selamat belanja kebutuhan Mama di Mama Beruang.</p>
</div>`,
    });
  }

  async sendForgotPasswordMail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset Password Mama Beruang',
      text: `Kami menerima permintaan reset password. Buka tautan berikut: ${resetUrl}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#3f3f46">
  <h2 style="color:#d6557e">Reset Password Mama Beruang</h2>
  <p>Klik tombol berikut untuk reset password kamu:</p>
  <p style="text-align:center;margin:28px 0">
    <a href="${resetUrl}"
       style="background:#d6557e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;font-weight:bold">
      Reset Password
    </a>
  </p>
  <p style="font-size:12px;color:#71717a">Jika tombol tidak berfungsi, salin tautan ini:<br>${resetUrl}</p>
</div>`,
    });
  }

  async orderConfirmationEmail(email: string, orderId: string) {
    const orderUrl = `${process.env.FRONTEND_URL}/account/orders/${orderId}`;

    await this.send({
      to: email,
      subject: 'Konfirmasi Pesanan Mama Beruang',
      text: `Pesanan Anda sudah dikonfirmasi. Cek detail pesanan: ${orderUrl}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#3f3f46">
  <h2 style="color:#d6557e">Konfirmasi Pesanan Mama Beruang</h2>
  <p>Pesanan Anda sudah dikonfirmasi. Klik tombol berikut untuk melihat detail pesanan:</p>
  <p style="text-align:center;margin:28px 0">
    <a href="${orderUrl}"
       style="background:#d6557e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;font-weight:bold">
      Lihat Pesanan
    </a>
  </p>
  <p style="font-size:12px;color:#71717a">Jika tombol tidak berfungsi, salin tautan ini:<br>${orderUrl}</p>
</div>`,
    });
  }
}
