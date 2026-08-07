import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BidRequestsModule } from './bid-requests/bid-requests.module';
import { CarsModule } from './cars/cars.module';
import { CommonCodesModule } from './common-codes/common-codes.module';
import { PartnerAuthModule } from './partner-auth/partner-auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ShopsModule } from './shops/shops.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PartnerAuthModule,
    AdminAuthModule,
    UsersModule,
    CarsModule,
    CommonCodesModule,
    ProductsModule,
    ShopsModule,
    ReservationsModule,
    BidRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
