import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendChatMessageDto } from '../dto/send-chat-message.dto';
import { sanitizeMessage } from './sanitize-message';

describe('sanitizeMessage', () => {
  it.each([
    ['trims surrounding whitespace', '  halo Mama  ', 'halo Mama'],
    [
      'removes zero-width and bidi characters',
      'al\u200Bmon\u202Emix',
      'almonmix',
    ],
    [
      'removes control characters but keeps tab and newline',
      'a\u0000b\tc\nd',
      'ab\tc\nd',
    ],
    [
      'normalizes Windows line breaks',
      'baris 1\r\nbaris 2',
      'baris 1\nbaris 2',
    ],
    ['keeps emoji joined with ZWJ', 'halo 👩\u200D🍼', 'halo 👩\u200D🍼'],
  ])('%s', (_label, input, expected) => {
    expect(sanitizeMessage(input)).toBe(expected);
  });

  it('passes non-string values through for the validator to reject', () => {
    expect(sanitizeMessage(123)).toBe(123);
  });
});

describe('SendChatMessageDto message', () => {
  it('rejects a message that is only invisible characters and spaces', async () => {
    const dto = plainToInstance(SendChatMessageDto, {
      message: ' \u200B\uFEFF ',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('message');
  });

  it('stores the sanitized message', () => {
    const dto = plainToInstance(SendChatMessageDto, {
      message: '  ada\u200B kapsul?  ',
    });
    expect(dto.message).toBe('ada kapsul?');
  });
});
