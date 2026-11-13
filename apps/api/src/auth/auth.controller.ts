import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint Đăng ký tài khoản thành viên mới
   * POST /api/v1/auth/register
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Endpoint Đăng nhập hệ thống & Cấp phát JWT
   * POST /api/v1/auth/login
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Endpoint Lấy thông tin hồ sơ người dùng hiện tại
   * GET /api/v1/auth/me (Được bảo vệ bởi JwtAuthGuard)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.authService.getProfile(userId);
  }

  /**
   * Endpoint Kiểm tra Token & Phân quyền mẫu cho các service khác
   * GET /api/v1/auth/verify
   */
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  verifyToken(@Req() req: any) {
    return {
      status: 'valid',
      message: 'Token JWT hợp lệ',
      user: req.user,
    };
  }
}
