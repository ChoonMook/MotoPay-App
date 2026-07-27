// 마이페이지 "내 정보 변경" — 이름·이메일 수정, 프로필 사진 업로드/교체, 비밀번호 변경
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { toSafeUser } from '../auth/to-safe-user';
import type { SafeUser } from '../auth/auth.types';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import {
  deleteProfileImage,
  saveProfileImage,
} from '../common/storage/profile-image-storage';
import { PrismaService } from '../prisma/prisma.service';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, email: dto.email },
    });
    return toSafeUser(user, this.phoneCrypto);
  }

  async updateProfileImage(
    userId: string,
    imageBase64: string,
  ): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const relativePath = await saveProfileImage(imageBase64);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImagePath: relativePath },
    });

    if (existing.profileImagePath) {
      await deleteProfileImage(existing.profileImagePath);
    }

    return toSafeUser(updated, this.phoneCrypto);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const currentMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
