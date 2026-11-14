import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PromotionsModule } from './promotions/promotions.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
    PromotionsModule,
    AuthModule,
    PaymentsModule,
    // Các module nghiệp vụ sẽ được từng thành viên đăng ký tại đây ở Task 4.2, 4.3 & Task 5:
    // - HealthModule & AuthModule (Hiếu - Chức năng 3) [HealthModule & AuthModule đã đăng ký]
    // - ProductsModule (Duy & Chiến - Chức năng 1) [Đã đăng ký]
    // - PromotionsModule (Quỳnh - Chức năng 2) [Đã đăng ký]
    // - OrdersModule (Chiến - Chức năng 4) [Đã đăng ký]
    // - PaymentsModule (Quang - Chức năng 5) [Đã đăng ký]
    // - LoyaltyModule (Sang - Chức năng 6)
  ],
})
export class AppModule {}
