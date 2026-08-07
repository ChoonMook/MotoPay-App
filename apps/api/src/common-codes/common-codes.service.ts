// 공통코드 조회(공개) + 관리자용 등록/수정(AD-SYS-03 공통 코드 관리) — 브랜드/차종/딜러사 등 코드값을 화면에
// 표시할 이름으로 바꿀 때 사용
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CommonCode, CommonCodeDetail } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCommonCodeDetailDto } from './dto/create-common-code-detail.dto';
import type { CreateCommonCodeDto } from './dto/create-common-code.dto';
import type { UpdateCommonCodeDetailDto } from './dto/update-common-code-detail.dto';
import type { UpdateCommonCodeDto } from './dto/update-common-code.dto';

@Injectable()
export class CommonCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetails(code: string): Promise<CommonCodeDetail[]> {
    return this.prisma.commonCodeDetail.findMany({
      where: { code, useYn: true },
      orderBy: { detailCode: 'asc' },
    });
  }

  /** 관리자 화면 좌측 코드그룹 목록 */
  async listGroups(): Promise<CommonCode[]> {
    return this.prisma.commonCode.findMany({ orderBy: { code: 'asc' } });
  }

  /** 관리자 화면 우측 코드값 테이블 — 그룹 선택 시 정렬순서 기준으로 조회(사용여부 무관, 비활성 코드도 함께 표시) */
  async getGroupWithDetails(
    code: string,
  ): Promise<CommonCode & { details: CommonCodeDetail[] }> {
    const group = await this.prisma.commonCode.findUnique({
      where: { code },
      include: { details: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!group) {
      throw new NotFoundException('공통코드 그룹을 찾을 수 없습니다.');
    }
    return group;
  }

  async createGroup(dto: CreateCommonCodeDto): Promise<CommonCode> {
    const exists = await this.prisma.commonCode.findUnique({
      where: { code: dto.code },
    });
    if (exists) {
      throw new ConflictException('이미 존재하는 코드그룹입니다.');
    }
    return this.prisma.commonCode.create({
      data: { code: dto.code, name: dto.name },
    });
  }

  async updateGroup(
    code: string,
    dto: UpdateCommonCodeDto,
  ): Promise<CommonCode> {
    const exists = await this.prisma.commonCode.findUnique({ where: { code } });
    if (!exists) {
      throw new NotFoundException('공통코드 그룹을 찾을 수 없습니다.');
    }
    return this.prisma.commonCode.update({ where: { code }, data: dto });
  }

  /** 상세 코드값이 남아있는 그룹은 삭제할 수 없음(DB FK도 ON DELETE RESTRICT로 동일하게 막음) */
  async deleteGroup(code: string): Promise<void> {
    const group = await this.prisma.commonCode.findUnique({
      where: { code },
      include: { _count: { select: { details: true } } },
    });
    if (!group) {
      throw new NotFoundException('공통코드 그룹을 찾을 수 없습니다.');
    }
    if (group._count.details > 0) {
      throw new BadRequestException(
        '상세 코드값이 남아있는 그룹은 삭제할 수 없습니다. 먼저 상세 코드를 모두 삭제해주세요.',
      );
    }
    await this.prisma.commonCode.delete({ where: { code } });
  }

  async createDetail(
    code: string,
    dto: CreateCommonCodeDetailDto,
  ): Promise<CommonCodeDetail> {
    await this.getGroupWithDetails(code); // 그룹 존재 확인

    const exists = await this.prisma.commonCodeDetail.findUnique({
      where: { code_detailCode: { code, detailCode: dto.detailCode } },
    });
    if (exists) {
      throw new ConflictException('이미 존재하는 코드값입니다.');
    }

    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const last = await this.prisma.commonCodeDetail.findFirst({
        where: { code },
        orderBy: { sortOrder: 'desc' },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    return this.prisma.commonCodeDetail.create({
      data: {
        code,
        detailCode: dto.detailCode,
        detailName: dto.detailName,
        ref1: dto.ref1,
        ref2: dto.ref2,
        sortOrder,
      },
    });
  }

  async updateDetail(
    code: string,
    detailCode: string,
    dto: UpdateCommonCodeDetailDto,
  ): Promise<CommonCodeDetail> {
    const exists = await this.prisma.commonCodeDetail.findUnique({
      where: { code_detailCode: { code, detailCode } },
    });
    if (!exists) {
      throw new NotFoundException('공통코드 상세를 찾을 수 없습니다.');
    }

    return this.prisma.commonCodeDetail.update({
      where: { code_detailCode: { code, detailCode } },
      data: dto,
    });
  }

  async deleteDetail(code: string, detailCode: string): Promise<void> {
    const exists = await this.prisma.commonCodeDetail.findUnique({
      where: { code_detailCode: { code, detailCode } },
    });
    if (!exists) {
      throw new NotFoundException('공통코드 상세를 찾을 수 없습니다.');
    }
    await this.prisma.commonCodeDetail.delete({
      where: { code_detailCode: { code, detailCode } },
    });
  }
}
