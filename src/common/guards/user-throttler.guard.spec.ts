import { ThrottlerException } from '@nestjs/throttler';
import { TOO_MANY_MESSAGES, UserThrottlerGuard } from './user-throttler.guard';

describe('UserThrottlerGuard', () => {
  // Skip the constructor: these methods do not use the injected throttler options or storage
  const guard = Object.create(UserThrottlerGuard.prototype) as any;

  it('tracks a logged-in request by user id', async () => {
    await expect(
      guard.getTracker({ user: { sub: 'user-1' }, ip: '10.0.0.1' }),
    ).resolves.toBe('user-1');
  });

  it('falls back to the IP when there is no user', async () => {
    await expect(guard.getTracker({ ip: '10.0.0.1' })).resolves.toBe(
      '10.0.0.1',
    );
  });

  it('rejects with a friendly 429 message', async () => {
    const error = await guard.throwThrottlingException().catch((e) => e);
    expect(error).toBeInstanceOf(ThrottlerException);
    expect(error.getStatus()).toBe(429);
    expect(error.message).toBe(TOO_MANY_MESSAGES);
  });
});
