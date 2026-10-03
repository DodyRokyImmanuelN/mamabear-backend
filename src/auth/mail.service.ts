import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.BACKEND_URL}/auth/verify-email?token=${token}`;
    await this.mailService.sendMail({
      to: email,
      subject: 'Please verify your email',
      text: `ini merupakan email verifikasi`,
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
    await this.mailService.sendMail({
      to: email,
      subject: 'Selamat datang ke rumah Mamabear!',
      text: `${userName}, selamat datang ke rumah Mamabear!`,
    });
  }

  async sendForgotPasswordMail(email: string, token: string) {
    const resetUrl = `${process.env.BACKEND_URL}/auth/reset-password?token=${token}`;

    await this.mailService.sendMail({
      to: email,
      subject: 'Reset password request',
      text: `Ini merupakan email reset password`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#3f3f46">
  <h2 style="color:#d6557e">Verifikasi Email Mama Beruang</h2>
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
    const orderUrl = `${process.env.BACKEND_URL}/orders/${orderId}`;
    await this.mailService.sendMail({
      to: email,
      subject: 'Order Confirmation',
      text: `Pesanan Anda sudah di konfirmasi`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#3f3f46">
  <h2 style="color:#d6557e">Verifikasi Email Mama Beruang</h2>
  <p>Klik tombol berikut untuk cek pesanan anda:</p>
  <p style="text-align:center;margin:28px 0">
    <a href="${orderUrl}"
       style="background:#d6557e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;font-weight:bold">
      Reset Password
    </a>
  </p>
  <p style="font-size:12px;color:#71717a">Jika tombol tidak berfungsi, salin tautan ini:<br>${orderUrl}</p>
</div>`,
    });
  }
}
