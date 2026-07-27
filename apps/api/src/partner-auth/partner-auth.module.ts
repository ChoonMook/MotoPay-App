import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PartnerAuthController } from './partner-auth.controller';
import { PartnerAuthService } from './partner-auth.service';
import { JwtPartnerStrategy } from './strategies/jwt-partner.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_PARTNER_ACCESS_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get<string>('JWT_ACCESS_EXPIRES_IN')),
        },
      }),
    }),
  ],
  controllers: [PartnerAuthController],
  providers: [PartnerAuthService, JwtPartnerStrategy, PhoneCryptoService],
})
export class PartnerAuthModule {}
