import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mocked_jwt_token_xyz'),
    };

    service = new AuthService(mockPrisma, mockJwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@brewlite.com' });

      await expect(
        service.register({
          email: 'test@brewlite.com',
          password: 'Password123',
          fullName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password with bcrypt and create user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation((args: any) =>
        Promise.resolve({
          id: 'uuid-123',
          email: args.data.email,
          fullName: args.data.fullName,
          role: 'CUSTOMER',
          loyaltyPoints: 0,
        }),
      );

      const result = await service.register({
        email: 'newuser@brewlite.com',
        password: 'Password123',
        fullName: 'New User',
      });

      expect(mockPrisma.user.create).toHaveBeenCalled();
      const createdData = mockPrisma.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toEqual('Password123');
      // Verify bcrypt hash structure ($2b$10$...)
      expect(createdData.passwordHash.startsWith('$2')).toBeTruthy();
      expect(result.accessToken).toBe('mocked_jwt_token_xyz');
      expect(result.user.email).toBe('newuser@brewlite.com');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@brewlite.com', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashed = await bcrypt.hash('CorrectPassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-123',
        email: 'user@brewlite.com',
        passwordHash: hashed,
        role: 'CUSTOMER',
      });

      await expect(
        service.login({ email: 'user@brewlite.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken and user profile if credentials are valid', async () => {
      const plainPass = 'ValidSecret123';
      const hashed = await bcrypt.hash(plainPass, 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-456',
        email: 'user@brewlite.com',
        fullName: 'Valid User',
        passwordHash: hashed,
        role: 'CUSTOMER',
        loyaltyPoints: 50,
      });

      const result = await service.login({ email: 'user@brewlite.com', password: plainPass });

      expect(result.accessToken).toBe('mocked_jwt_token_xyz');
      expect(result.user.email).toBe('user@brewlite.com');
      expect(result.user.loyaltyPoints).toBe(50);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 'uuid-456',
        email: 'user@brewlite.com',
        role: 'CUSTOMER',
      });
    });
  });
});
