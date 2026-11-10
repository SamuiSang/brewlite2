import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ProductsModule,
    // Các module nghiệp vụ sẽ được từng thành viên đăng ký tại đây ở Task 4.2, 4.3 & Task 5:
    // - HealthModule & AuthModule (Hiếu - Chức năng 3)
    // - ProductsModule (Duy & Chiến - Chức năng 1) [Đã đăng ký]
    // - PromotionsModule (Quỳnh - Chức năng 2)
    // - OrdersModule (Chiến - Chức năng 4)
    // - PaymentsModule (Quang - Chức năng 5)
    // - LoyaltyModule (Sang - Chức năng 6)
  ],
})
export class AppModule {}
