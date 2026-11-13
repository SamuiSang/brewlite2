import { ValidationPipe } from '@nestjs/common';
import { ValidatePromotionDto } from './promotions.controller';

describe('Promotion request boundary', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  const metadata = { type: 'body' as const, metatype: ValidatePromotionDto };
  it('normalizes voucher code', async () => {
    expect(await pipe.transform({ code: ' brewlite20 ', cartSubtotal: 120000 }, metadata)).toEqual({ code: 'BREWLITE20', cartSubtotal: 120000 });
  });
  it.each([
    { code: '', cartSubtotal: 120000 }, { code: 'A', cartSubtotal: -1 },
    { code: 'A', cartSubtotal: 1.5 }, { code: 'A', cartSubtotal: '120000' },
    { code: 'A', cartSubtotal: 120000, discountAmount: 99999 },
  ])('rejects malformed input %p', async body => {
    await expect(pipe.transform(body, metadata)).rejects.toThrow();
  });
});
