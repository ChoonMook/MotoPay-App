// 1:1 문의 등록·조회·수정(CU-CS-03~05) + 관리자 목록·답변(AD-CS-02). 답변은 실제 이메일 발송 없이 앱 내 상세 화면
// 반영으로만 처리(이메일 발송 인프라 없음, 2026-08-18 확인)
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { deleteImage } from '../common/storage/image-storage';
import { saveInquiryPhoto } from '../common/storage/inquiry-photo-storage';
import type { CreateInquiryDto } from './dto/create-inquiry.dto';
import type { UpdateInquiryDto } from './dto/update-inquiry.dto';
import type { AnswerInquiryDto } from './dto/answer-inquiry.dto';

export interface MyInquiryView {
  inquiryNo: string;
  category: string;
  title: string;
  content: string;
  status: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  photos: string[];
}

export interface AdminInquiryListItem {
  inquiryNo: string;
  memberId: string;
  memberName: string;
  category: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface AdminInquiryDetail extends AdminInquiryListItem {
  content: string;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
  photos: string[];
}

const PHOTO_ORDER = { orderBy: { sortOrder: 'asc' as const } };

function toMyView(row: {
  inquiryNo: string;
  category: string;
  title: string;
  content: string;
  status: string;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
  photos: { photoPath: string }[];
}): MyInquiryView {
  return {
    inquiryNo: row.inquiryNo,
    category: row.category,
    title: row.title,
    content: row.content,
    status: row.status,
    answer: row.answer,
    answeredAt: row.answeredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    photos: row.photos.map((p) => p.photoPath),
  };
}

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(memberId: string, dto: CreateInquiryDto): Promise<MyInquiryView> {
    const created = await this.prisma.inquiry.create({
      data: {
        inquiryNo: '0'.repeat(10),
        memberId,
        category: dto.category,
        title: dto.title,
        content: dto.content,
        createdBy: memberId,
      },
    });
    const inquiryNo = String(created.id).padStart(10, '0');
    const photoPaths = await Promise.all((dto.photos ?? []).map((p) => saveInquiryPhoto(p)));
    const confirmed = await this.prisma.inquiry.update({
      where: { id: created.id },
      data: {
        inquiryNo,
        photos: {
          create: photoPaths.map((photoPath, index) => ({ photoPath, sortOrder: index })),
        },
      },
      include: { photos: PHOTO_ORDER },
    });
    return toMyView(confirmed);
  }

  async listMine(memberId: string): Promise<MyInquiryView[]> {
    const rows = await this.prisma.inquiry.findMany({
      where: { memberId },
      include: { photos: PHOTO_ORDER },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toMyView);
  }

  async getMine(memberId: string, inquiryNo: string): Promise<MyInquiryView> {
    const row = await this.prisma.inquiry.findUnique({
      where: { inquiryNo },
      include: { photos: PHOTO_ORDER },
    });
    if (!row || row.memberId !== memberId) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }
    return toMyView(row);
  }

  /** 답변 등록 전(PENDING)에만 수정 허용 — 답변완료 후에는 문의 내용을 바꿀 수 없음 */
  async updateMine(
    memberId: string,
    inquiryNo: string,
    dto: UpdateInquiryDto,
  ): Promise<MyInquiryView> {
    const existing = await this.prisma.inquiry.findUnique({
      where: { inquiryNo },
      include: { photos: PHOTO_ORDER },
    });
    if (!existing || existing.memberId !== memberId) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }
    if (existing.status !== 'PENDING') {
      throw new BadRequestException('답변이 등록된 문의는 수정할 수 없습니다.');
    }

    // photos: data URI(신규 업로드)와 기존 상대경로(유지)가 섞여서 올 수 있음 — 신규만 저장하고,
    // 최종 목록에서 빠진 기존 사진은 물리 파일까지 정리한다
    let photoPaths: string[] | null = null;
    if (dto.photos !== undefined) {
      const existingPaths = new Set(existing.photos.map((p) => p.photoPath));
      photoPaths = await Promise.all(
        dto.photos.map((item) => {
          if (item.startsWith('data:')) return saveInquiryPhoto(item);
          if (existingPaths.has(item)) return Promise.resolve(item);
          throw new BadRequestException('올바르지 않은 사진 정보입니다.');
        }),
      );
      const kept = new Set(photoPaths);
      const removed = existing.photos.filter((p) => !kept.has(p.photoPath));
      await Promise.all(removed.map((p) => deleteImage(p.photoPath)));
      await this.prisma.inquiryPhoto.deleteMany({ where: { inquiryId: existing.id } });
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: existing.id },
      data: {
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(photoPaths !== null
          ? { photos: { create: photoPaths.map((photoPath, index) => ({ photoPath, sortOrder: index })) } }
          : {}),
        updatedBy: memberId,
      },
      include: { photos: PHOTO_ORDER },
    });
    return toMyView(updated);
  }

  async adminList(params: {
    keyword?: string;
    category?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AdminInquiryListItem[]> {
    const rows = await this.prisma.inquiry.findMany({
      where: {
        ...(params.category ? { category: params.category } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.keyword
          ? { member: { name: { contains: params.keyword } } }
          : {}),
        ...(params.dateFrom || params.dateTo
          ? {
              createdAt: {
                ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
                ...(params.dateTo
                  ? {
                      lt: new Date(
                        new Date(params.dateTo).getTime() + 24 * 60 * 60 * 1000,
                      ),
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: { member: { select: { name: true } } },
      // 대기 상태(PENDING)를 상단에 고정 정렬(응답 지연 방지, 'PENDING' > 'ANSWERED' 알파벳순이라 desc로 충족) —
      // 그 안에서는 최신순
      orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((r) => ({
      inquiryNo: r.inquiryNo,
      memberId: r.memberId,
      memberName: r.member.name,
      category: r.category,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async adminGetDetail(inquiryNo: string): Promise<AdminInquiryDetail> {
    const row = await this.prisma.inquiry.findUnique({
      where: { inquiryNo },
      include: { member: { select: { name: true } }, photos: PHOTO_ORDER },
    });
    if (!row) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }
    return {
      inquiryNo: row.inquiryNo,
      memberId: row.memberId,
      memberName: row.member.name,
      category: row.category,
      title: row.title,
      status: row.status,
      content: row.content,
      answer: row.answer,
      answeredBy: row.answeredBy,
      answeredAt: row.answeredAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      photos: row.photos.map((p) => p.photoPath),
    };
  }

  async adminAnswer(
    inquiryNo: string,
    dto: AnswerInquiryDto,
    adminUsername: string,
  ): Promise<AdminInquiryDetail> {
    const exists = await this.prisma.inquiry.findUnique({ where: { inquiryNo } });
    if (!exists) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }
    await this.prisma.inquiry.update({
      where: { inquiryNo },
      data: {
        answer: dto.answer,
        status: 'ANSWERED',
        answeredBy: adminUsername,
        answeredAt: new Date(),
        updatedBy: adminUsername,
      },
    });
    return this.adminGetDetail(inquiryNo);
  }
}
