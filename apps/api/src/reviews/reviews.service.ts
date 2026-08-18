// 후기 관리(AD-NOTI-02) — 부적절 후기 블라인드 처리. 후기 자체(생성/조회)는 ReservationsService가 담당하고
// 이 서비스는 관리자 목록·블라인드 토글만 다룬다.
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { maskReviewerName } from '../common/mask/mask-name';

export interface AdminReviewListItem {
  id: number;
  reservationNo: string;
  memberNameMasked: string;
  shopName: string;
  rating: number;
  content: string;
  isBlinded: boolean;
  createdAt: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async adminList(params: {
    keyword?: string;
    rating?: number;
    isBlinded?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AdminReviewListItem[]> {
    const rows = await this.prisma.review.findMany({
      where: {
        ...(params.rating ? { rating: params.rating } : {}),
        ...(params.isBlinded !== undefined ? { isBlinded: params.isBlinded } : {}),
        ...(params.keyword
          ? { shop: { name: { contains: params.keyword } } }
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
      include: { member: { select: { name: true } }, shop: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      reservationNo: r.reservationNo,
      memberNameMasked: maskReviewerName(r.member.name),
      shopName: r.shop.name,
      rating: r.rating,
      content: r.content,
      isBlinded: r.isBlinded,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async setBlinded(
    id: number,
    isBlinded: boolean,
    adminUsername: string,
  ): Promise<AdminReviewListItem> {
    const exists = await this.prisma.review.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('후기를 찾을 수 없습니다.');
    }
    const updated = await this.prisma.review.update({
      where: { id },
      data: { isBlinded, updatedBy: adminUsername },
      include: { member: { select: { name: true } }, shop: { select: { name: true } } },
    });
    return {
      id: updated.id,
      reservationNo: updated.reservationNo,
      memberNameMasked: maskReviewerName(updated.member.name),
      shopName: updated.shop.name,
      rating: updated.rating,
      content: updated.content,
      isBlinded: updated.isBlinded,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
