// 공통코드 상세 조회 — 브랜드/차종/딜러사 등 코드값을 화면에 표시할 이름으로 바꿀 때 사용
import { Injectable } from '@nestjs/common';
import type { CommonCodeDetail } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommonCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetails(code: string): Promise<CommonCodeDetail[]> {
    return this.prisma.commonCodeDetail.findMany({
      where: { code, useYn: true },
      orderBy: { detailCode: 'asc' },
    });
  }
}
