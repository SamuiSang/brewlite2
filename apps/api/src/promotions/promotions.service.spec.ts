import { Prisma } from '@prisma/client';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma/prisma.service';

const decimal = (n: number) => new Prisma.Decimal(n);
const voucher = {
  id: 'promo-1',
  code: 'BREWLITE20',
  description: 'Giam 20k',
  isActive: true,
  startsAt: new Date('2020-01-01'),
  expiresAt: new Date('2099-01-01'),
  usageLimit: 100,
  usedCount: 10,
  minOrderValue: decimal(100000),
  discountType: 'PERCENTAGE',
  discountValue: decimal(20),
  maxDiscountAmount: decimal(30000),
  firstOrderOnly: false,
  deliveryOnly: false,
  createdAt: new Date('2020-01-01'),
  updatedAt: new Date('2020-01-01'),
};

describe('PromotionsService preview & validation', () => {
  const findFirst = jest.fn();
  const service = new PromotionsService({ promotion: { findFirst } } as unknown as PrismaService);
  beforeEach(() => findFirst.mockResolvedValue({ ...voucher }));

  it('normalizes codes, calculates discount and caps percentage discount', async () => {
    expect((await service.validate(' brewlite20 ', 120000)).discountAmount).toBe(24000);
    expect((await service.validate('BREWLITE20', 200000)).discountAmount).toBe(30000);
    expect(findFirst).toHaveBeenCalledWith({ where: { code: { equals: 'BREWLITE20', mode: 'insensitive' } } });
  });

  it.each([
    [{ isActive: false }, 'không còn hiệu lực'],
    [{ expiresAt: new Date('2000-01-01') }, 'hết hạn'],
    [{ startsAt: new Date('2090-01-01') }, 'chưa đến'],
    [{ usedCount: 100 }, 'hết lượt'],
  ])('rejects invalid conditions %p', async (change, message) => {
    findFirst.mockResolvedValue({ ...voucher, ...change });
    await expect(service.validate('BREWLITE20', 150000)).rejects.toThrow(message);
  });

  it('rejects missing code, minimum shortfall and malformed subtotal', async () => {
    await expect(service.validate('BREWLITE20', 80000)).rejects.toThrow('100.000');
    await expect(service.validate('BREWLITE20', -1)).rejects.toThrow();
    findFirst.mockResolvedValue(null);
    await expect(service.validate('UNKNOWN', 150000)).rejects.toThrow('không tồn tại');
  });

  it('preserves vouchers without expiry and includes them in active offers', async () => {
    const perpetual = { ...voucher, expiresAt: null };
    findFirst.mockResolvedValue(perpetual);
    expect((await service.validate('BREWLITE20', 150000)).discountAmount).toBe(30000);
    const findMany = jest.fn().mockResolvedValue([perpetual]);
    const activeService = new PromotionsService({ promotion: { findMany } } as unknown as PrismaService);
    expect((await activeService.active())[0].expiresAt).toBeNull();
    expect(findMany.mock.calls[0][0].where.OR).toEqual([{ expiresAt: null }, { expiresAt: { gte: expect.any(Date) } }]);
  });

  it('rejects first-order offers without verified identity and delivery-only offers for pickup', async () => {
    findFirst.mockResolvedValue({ ...voucher, firstOrderOnly: true });
    await expect(service.validate('WELCOME10', 150000)).rejects.toThrow('xác thực');
    findFirst.mockResolvedValue({ ...voucher, code: 'FREESHIP', deliveryOnly: true, discountType: 'FIXED_AMOUNT', discountValue: decimal(15000) });
    await expect(service.validate('FREESHIP', 150000, 'PICKUP')).rejects.toThrow('giao hàng');
    const deliveryResult = await service.validate('FREESHIP', 150000, 'DELIVERY');
    expect(deliveryResult.discountAmount).toBe(15000);
  });

  it('fixed discount cannot exceed subtotal; unlimited usage stays valid', async () => {
    findFirst.mockResolvedValue({ ...voucher, usageLimit: null, minOrderValue: decimal(0), discountType: 'FIXED_AMOUNT', discountValue: decimal(50000) });
    expect((await service.validate('BREWLITE20', 29000)).discountAmount).toBe(29000);
  });
});

describe('PromotionsService CRUD operations', () => {
  const findFirst = jest.fn();
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const del = jest.fn();

  const service = new PromotionsService({
    promotion: { findFirst, findUnique, findMany, create, update, delete: del },
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates new voucher and normalizes code', async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ ...voucher, code: 'NEW50', discountValue: decimal(50000) });

    const result = await service.create({
      code: '  new50  ',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 50000,
    });

    expect(result.code).toBe('NEW50');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ code: 'NEW50' }),
    }));
  });

  it('rejects duplicate voucher code on creation', async () => {
    findFirst.mockResolvedValue({ ...voucher, code: 'EXISTING' });
    await expect(service.create({
      code: 'EXISTING',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 10000,
    })).rejects.toThrow('đã tồn tại');
  });

  it('finds all vouchers with optional filters', async () => {
    findMany.mockResolvedValue([{ ...voucher }]);
    const list = await service.findAll({ isActive: true, search: 'BREW' });
    expect(list).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isActive: true }),
    }));
  });

  it('finds voucher by code or id', async () => {
    findFirst.mockResolvedValue({ ...voucher });
    const found = await service.findOne('BREWLITE20');
    expect(found.code).toBe('BREWLITE20');

    findFirst.mockResolvedValue(null);
    await expect(service.findOne('UNKNOWN')).rejects.toThrow('Không tìm thấy');
  });

  it('updates existing voucher', async () => {
    findUnique.mockResolvedValue({ ...voucher });
    update.mockResolvedValue({ ...voucher, description: 'Updated note' });

    const updated = await service.update('promo-1', { description: 'Updated note' });
    expect(updated.description).toBe('Updated note');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'promo-1' },
    }));
  });

  it('deletes voucher and returns confirmation', async () => {
    findUnique.mockResolvedValue({ ...voucher });
    del.mockResolvedValue({ ...voucher });

    const res = await service.remove('promo-1');
    expect(res.success).toBe(true);
    expect(del).toHaveBeenCalledWith({ where: { id: 'promo-1' } });
  });

  it('throws 404 when updating or deleting non-existent voucher', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.update('invalid-id', { description: 'test' })).rejects.toThrow('Không tìm thấy');
    await expect(service.remove('invalid-id')).rejects.toThrow('Không tìm thấy');
  });
});
