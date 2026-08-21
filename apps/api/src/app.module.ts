import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminAccountsModule } from './admin-accounts/admin-accounts.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminMembersModule } from './admin-members/admin-members.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppVersionModule } from './app-version/app-version.module';
import { AuthModule } from './auth/auth.module';
import { BidRequestsModule } from './bid-requests/bid-requests.module';
import { CarsModule } from './cars/cars.module';
import { CommonCodesModule } from './common-codes/common-codes.module';
import { CompaniesModule } from './companies/companies.module';
import { CouponsModule } from './coupons/coupons.module';
import { FaqsModule } from './faqs/faqs.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PushModule } from './push/push.module';
import { AdminPushModule } from './admin-push/admin-push.module';
import { MemberGradeRulesModule } from './member-grade-rules/member-grade-rules.module';
import { MenuPermissionsModule } from './menu-permissions/menu-permissions.module';
import { NewCarPurchasesModule } from './new-car-purchases/new-car-purchases.module';
import { PartnerAuthModule } from './partner-auth/partner-auth.module';
import { PointsModule } from './points/points.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ShopsModule } from './shops/shops.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PartnerAuthModule,
    AdminAuthModule,
    AdminAccountsModule,
    AdminMembersModule,
    MenuPermissionsModule,
    UsersModule,
    CarsModule,
    CommonCodesModule,
    AppVersionModule,
    CompaniesModule,
    ProductsModule,
    ShopsModule,
    ReservationsModule,
    BidRequestsModule,
    UploadsModule,
    NewCarPurchasesModule,
    PointsModule,
    MemberGradeRulesModule,
    CouponsModule,
    InquiriesModule,
    FaqsModule,
    ReviewsModule,
    NotificationsModule,
    PushModule,
    AdminPushModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
