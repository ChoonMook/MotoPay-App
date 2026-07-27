import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CarsModule } from '../cars/cars.module';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        // .env 값은 항상 문자열이라 Number()로 실제 숫자(초)로 변환 — ConfigService.get<number>()는 타입만 속이고 런타임 변환은 안 해줌
        signOptions: {
          expiresIn: Number(configService.get<string>('JWT_ACCESS_EXPIRES_IN')),
        },
      }),
    }),
    CarsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PhoneCryptoService],
})
export class AuthModule {}
