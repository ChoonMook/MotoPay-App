// FAQ 조회(CU-CS-02) + 관리자 등록/수정/삭제/정렬(AD-CS-03)
import { Injectable, NotFoundException } from '@nestjs/common';
import type { FaqItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateFaqDto } from './dto/create-faq.dto';
import type { UpdateFaqDto } from './dto/update-faq.dto';
import type { ReorderFaqsDto } from './dto/reorder-faqs.dto';

export interface FaqView {
  id: number;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  useYn: boolean;
}

function toView(row: FaqItem): FaqView {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sortOrder,
    useYn: row.useYn,
  };
}

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 공개 조회(CU-CS-02) — 노출(useYn=true) 대상만 */
  async list(category?: string): Promise<FaqView[]> {
    const rows = await this.prisma.faqItem.findMany({
      where: { useYn: true, ...(category ? { category } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toView);
  }

  /** 관리자 목록(AD-CS-03) — 노출여부 무관 전체 */
  async adminList(category?: string): Promise<FaqView[]> {
    const rows = await this.prisma.faqItem.findMany({
      where: { ...(category ? { category } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toView);
  }

  async create(dto: CreateFaqDto, adminUsername: string): Promise<FaqView> {
    const maxSort = await this.prisma.faqItem.aggregate({ _max: { sortOrder: true } });
    const created = await this.prisma.faqItem.create({
      data: {
        category: dto.category,
        question: dto.question,
        answer: dto.answer,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        createdBy: adminUsername,
      },
    });
    return toView(created);
  }

  async update(id: number, dto: UpdateFaqDto, adminUsername: string): Promise<FaqView> {
    const exists = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('FAQ를 찾을 수 없습니다.');
    }
    const updated = await this.prisma.faqItem.update({
      where: { id },
      data: { ...dto, updatedBy: adminUsername },
    });
    return toView(updated);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('FAQ를 찾을 수 없습니다.');
    }
    await this.prisma.faqItem.delete({ where: { id } });
  }

  /** 드래그 정렬(AD-CS-03) — 바뀐 순서 전체를 한 번에 반영 */
  async reorder(dto: ReorderFaqsDto): Promise<void> {
    await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.faqItem.update({
          where: { id: i.id },
          data: { sortOrder: i.sortOrder },
        }),
      ),
    );
  }
}
