import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedeemPointsDto, RedeemPreviewDto } from './dto/redeem-points.dto';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  private extractUserId(req: any): string {
    return req.user?.sub || req.user?.id;
  }

  /**
   * GET /api/v1/loyalty/balance
   * Lấy số dư Hạt, hạng thành viên & lịch sử biến động điểm
   */
  @Get('balance')
  async getBalance(@Req() req: any) {
    return await this.loyaltyService.getBalanceAndHistory(this.extractUserId(req));
  }

  /**
   * GET /api/v1/loyalty/history
   */
  @Get('history')
  async getHistory(@Req() req: any) {
    return await this.loyaltyService.getBalanceAndHistory(this.extractUserId(req));
  }

  /**
   * GET /api/v1/loyalty/transactions
   */
  @Get('transactions')
  async getTransactions(@Req() req: any) {
    return await this.loyaltyService.getBalanceAndHistory(this.extractUserId(req));
  }

  /**
   * POST /api/v1/loyalty/redeem-preview
   * Tính nháp số tiền được giảm khi dùng Hạt
   */
  @Post('redeem-preview')
  async previewRedeem(@Req() req: any, @Body() dto: RedeemPreviewDto) {
    return await this.loyaltyService.previewRedeem(
      this.extractUserId(req),
      dto.pointsToRedeem,
      dto.orderAmount,
    );
  }

  /**
   * POST /api/v1/loyalty/redeem
   * Thực thi trừ điểm đổi quà hoặc áp dụng ưu đãi
   */
  @Post('redeem')
  async redeemPoints(@Req() req: any, @Body() dto: RedeemPointsDto) {
    return await this.loyaltyService.redeemPoints(this.extractUserId(req), dto);
  }
}
