import 'dotenv/config';
import { MailerOptions } from '@nestjs-modules/mailer';

export const MailHogOptions: MailerOptions = {
  defaults: {
    from: process.env.MAIL_FROM ?? '"Mama Beruang" <noreply@mamabear.com>',
  },
  transport: {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 587),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  },
};
