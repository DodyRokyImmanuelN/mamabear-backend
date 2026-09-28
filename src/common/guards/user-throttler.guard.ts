import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

export const TOO_MANY_MESSAGES =
  'Mama sudah mengirim banyak pesan, coba lagi sebentar ya.';

// Counts requests per logged-in user instead of per IP, since many users can share one IP.
// Must run after JwtAuthGuard so req.user is populated.
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.sub ?? req.ip;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(TOO_MANY_MESSAGES);
  }
}
