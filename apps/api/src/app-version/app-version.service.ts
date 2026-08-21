// 앱 강제 업데이트 정책 조회(공개) + 관리자용 수정(AD-SYS-06 앱버전관리)
import { Injectable, NotFoundException } from '@nestjs/common';
import type { AppVersionPolicy } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateAppVersionPolicyDto } from './dto/update-app-version-policy.dto';

@Injectable()
export class AppVersionService {
  constructor(private readonly prisma: PrismaService) {}

  /** customer-app/partner-app이 motopay-mobile 안에서 앱 진입 시 조회(공개 API, 인증 불필요) */
  async getPolicy(platform: string): Promise<AppVersionPolicy> {
    const policy = await this.prisma.appVersionPolicy.findUnique({
      where: { platform },
    });
    if (!policy) {
      throw new NotFoundException('해당 플랫폼의 버전 정책이 없습니다.');
    }
    return policy;
  }

  /** 관리자 화면 목록(현재는 ANDROID 1건, iOS 출시 시 자동으로 함께 노출) */
  async listPolicies(): Promise<AppVersionPolicy[]> {
    return this.prisma.appVersionPolicy.findMany({
      orderBy: { platform: 'asc' },
    });
  }

  async updatePolicy(
    platform: string,
    dto: UpdateAppVersionPolicyDto,
    adminUsername: string,
  ): Promise<AppVersionPolicy> {
    const exists = await this.prisma.appVersionPolicy.findUnique({
      where: { platform },
    });
    if (!exists) {
      throw new NotFoundException('해당 플랫폼의 버전 정책이 없습니다.');
    }
    return this.prisma.appVersionPolicy.update({
      where: { platform },
      data: { ...dto, updatedBy: adminUsername },
    });
  }
}
