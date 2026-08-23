// 시공업체 조회 — 목록(시공가능 카테고리 필터·거리순 정렬)/상세(사진·시공가능 카테고리 포함)/내 업체 수정(파트너 전용)
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Shop, ShopPhoto } from '@prisma/client';
import { maskReviewerName } from '../common/mask/mask-name';
import {
  deleteShopPhoto,
  saveShopPhoto,
} from '../common/storage/shop-photo-storage';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateShopDto } from './dto/update-shop.dto';
import type { UpdateShopSettlementDto } from './dto/update-shop-settlement.dto';
import type { UploadShopPhotoDto } from './dto/upload-shop-photo.dto';

const MAX_CASE_PHOTOS = 10;

// 정산 관련 내부 필드 2개(기본 매입가 정률·정산일) — Product.supplyPrice와 같은 이유로 공개 조회(/shops)·
// 파트너 자기 조회(/shops/me)에는 노출하지 않고 관리자 조회(AD-CO-02)에만 내려준다(2026-08-23 확정).
// defaultCommissionRate는 원본이 Prisma Decimal이라 관리자 노출 시 number로 변환해서 내려준다
type SettlementFields = Pick<Shop, 'settlementDay'> & {
  defaultCommissionRate: number | null;
};

export interface ShopListItem extends Omit<Shop, keyof SettlementFields>, SettlementFields {
  mainPhoto: ShopPhoto | null;
  categories: string[]; // 시공가능 자동차 시공코드 목록
  distanceKm: number | null; // 기준 위치(lat/lng) 지정 시에만 값 존재
  avgRating: number | null; // Review.rating 평균(소수점 1자리 반올림) — 후기가 하나도 없으면 null
  reviewCount: number;
}

export interface ShopDetail extends Omit<Shop, keyof SettlementFields>, SettlementFields {
  photos: ShopPhoto[];
  categories: string[];
  avgRating: number | null;
  reviewCount: number;
}

/** 정산 필드 노출 여부 처리 — forAdmin=false면 응답에서 필드 자체를 생략(undefined, JSON 직렬화 시 키 생략됨),
 * true면 Decimal(defaultCommissionRate)을 number로 변환해 그대로 내려준다(maskSupplyPrice와 동일 패턴) */
function resolveSettlementFields(shop: Shop, forAdmin: boolean): SettlementFields {
  if (!forAdmin) {
    return {
      defaultCommissionRate: undefined as unknown as null,
      settlementDay: undefined as unknown as null,
    };
  }
  return {
    defaultCommissionRate:
      shop.defaultCommissionRate === null ? null : Number(shop.defaultCommissionRate),
    settlementDay: shop.settlementDay,
  };
}

// CU-NCPK-06/CU-RSVC-18 업체 프로필의 후기 목록 — 예약(Reservation)당 1건씩 작성되는 Review를 그대로 노출.
// 작성자 실명은 개인정보라 성만 남기고 마스킹해서 내려준다(maskReviewerName)
export interface ShopReviewItem {
  id: number;
  reviewerName: string;
  rating: number;
  content: string;
  photos: string[]; // uploads/ 기준 상대경로
  createdAt: string;
}

// PT-STL-03 후기 조회 — 파트너 전용. 공개용 ShopReviewItem에 차종을 더해 페이징으로 응답
export interface ShopReviewPageItem extends ShopReviewItem {
  car: string | null;
}

export interface ShopReviewPage {
  items: ShopReviewPageItem[];
  total: number;
  avgRating: number | null;
}

export interface ListShopsParams {
  instCodes?: string[]; // 지정하면 이 시공코드를 모두 지원하는 업체만 조회
  dealerCompanyId?: number; // 지정하면 이 딜러사(Company.id, coType='DEALER')가 DealerShopMapping(AD-NCPK-04)으로 등록한 업체만 조회 — 신차패키지 시공업체 선택 화면 전용
  lat?: number; // 기준 위치 — lat/lng을 함께 지정하면 거리순 정렬
  lng?: number;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async list(params: ListShopsParams): Promise<ShopListItem[]> {
    const { instCodes, dealerCompanyId, lat, lng } = params;

    const shops = await this.prisma.shop.findMany({
      where: {
        useYn: true,
        ...(instCodes && instCodes.length > 0
          ? {
              AND: instCodes.map((instCode) => ({
                categories: { some: { instCode } },
              })),
            }
          : {}),
        ...(dealerCompanyId !== undefined
          ? { dealerMappings: { some: { dealerCompanyId } } }
          : {}),
      },
      include: {
        photos: { where: { photoType: 'MAIN' }, take: 1 },
        categories: true,
      },
      orderBy: { name: 'asc' },
    });

    const ratingByShop = await this.aggregateRatings(
      shops.map((shop) => shop.shopCode),
    );

    const items: ShopListItem[] = shops.map((shop) => {
      const { photos, categories, ...rest } = shop;
      const distanceKm =
        lat !== undefined &&
        lng !== undefined &&
        shop.latitude !== null &&
        shop.longitude !== null
          ? haversineKm(lat, lng, shop.latitude, shop.longitude)
          : null;
      const rating = ratingByShop.get(shop.shopCode);
      return {
        ...rest,
        ...resolveSettlementFields(shop, false),
        mainPhoto: photos[0] ?? null,
        categories: categories.map((c) => c.instCode),
        distanceKm,
        avgRating: rating?.avgRating ?? null,
        reviewCount: rating?.reviewCount ?? 0,
      };
    });

    if (lat !== undefined && lng !== undefined) {
      items.sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      );
    }

    return items;
  }

  async getDetail(shopCode: string, forAdmin = false): Promise<ShopDetail> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopCode },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        categories: true,
      },
    });
    if (!shop || !shop.useYn) {
      throw new NotFoundException('시공업체를 찾을 수 없습니다.');
    }

    const { categories, ...rest } = shop;
    const rating = (await this.aggregateRatings([shopCode])).get(shopCode);
    return {
      ...rest,
      ...resolveSettlementFields(shop, forAdmin),
      categories: categories.map((c) => c.instCode),
      avgRating: rating?.avgRating ?? null,
      reviewCount: rating?.reviewCount ?? 0,
    };
  }

  /** shopCode별 평균 평점(소수점 1자리 반올림)·후기 개수 집계 — 후기가 없는 업체는 맵에 아예 안 잡힘(호출부에서 null/0 처리) */
  private async aggregateRatings(
    shopCodes: string[],
  ): Promise<Map<string, { avgRating: number; reviewCount: number }>> {
    if (shopCodes.length === 0) return new Map();
    const grouped = await this.prisma.review.groupBy({
      by: ['shopCode'],
      where: { shopCode: { in: shopCodes }, isBlinded: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return new Map(
      grouped.map((g) => [
        g.shopCode,
        {
          avgRating: Math.round((g._avg.rating ?? 0) * 10) / 10,
          reviewCount: g._count.rating,
        },
      ]),
    );
  }

  /** CU-NCPK-06/CU-RSVC-18 업체 프로필 — 이 업체가 받은 후기 목록(최신순) */
  async listReviews(shopCode: string): Promise<ShopReviewItem[]> {
    const shop = await this.prisma.shop.findUnique({ where: { shopCode } });
    if (!shop || !shop.useYn) {
      throw new NotFoundException('시공업체를 찾을 수 없습니다.');
    }
    const reviews = await this.prisma.review.findMany({
      where: { shopCode, isBlinded: false },
      include: {
        member: { select: { name: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => ({
      id: r.id,
      reviewerName: maskReviewerName(r.member.name),
      rating: r.rating,
      content: r.content,
      photos: r.photos.map((p) => p.photoPath),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** PT-STL-03 후기 조회(파트너 로그인 전용) — 공개 목록에 차종을 더하고 페이징 지원 */
  async listReviewsForMe(
    shopCode: string,
    offset: number,
    limit: number,
  ): Promise<ShopReviewPage> {
    const [total, avg, reviews] = await Promise.all([
      this.prisma.review.count({ where: { shopCode, isBlinded: false } }),
      this.prisma.review.aggregate({
        where: { shopCode, isBlinded: false },
        _avg: { rating: true },
      }),
      this.prisma.review.findMany({
        where: { shopCode, isBlinded: false },
        include: {
          member: { select: { name: true } },
          photos: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const memberIds = [...new Set(reviews.map((r) => r.memberId))];
    const carLabels = await this.resolveMemberCarLabels(memberIds);

    return {
      total,
      avgRating: avg._avg.rating != null ? Math.round(avg._avg.rating * 10) / 10 : null,
      items: reviews.map((r) => ({
        id: r.id,
        reviewerName: maskReviewerName(r.member.name),
        rating: r.rating,
        content: r.content,
        photos: r.photos.map((p) => p.photoPath),
        createdAt: r.createdAt.toISOString(),
        car: carLabels.get(r.memberId) ?? null,
      })),
    };
  }

  // 후기는 예약(Reservation)에 차량 연결 컬럼이 없어 작성 회원의 대표차량(없으면 최근 등록차량)을 차종으로
  // 사용(근사치) — listTodayForShop/resolveMemberPackage(reservations.service.ts)와 동일한 방식.
  // 여러 회원의 후기를 한 번에 조회하므로 N+1을 피하려고 배치로 조회
  private async resolveMemberCarLabels(
    memberIds: string[],
  ): Promise<Map<string, string>> {
    const labels = new Map<string, string>();
    if (memberIds.length === 0) {
      return labels;
    }
    const cars = await this.prisma.myCar.findMany({
      where: { memberId: { in: memberIds } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    const carByMember = new Map<string, (typeof cars)[number]>();
    for (const car of cars) {
      if (!carByMember.has(car.memberId)) {
        carByMember.set(car.memberId, car);
      }
    }
    const brandCodes = [...new Set(cars.map((c) => c.carBrandCode))];
    const modelCodes = [...new Set(cars.map((c) => c.carModelCode))];
    const [brands, models] = await Promise.all([
      this.prisma.commonCodeDetail.findMany({
        where: { code: 'CAR_BRAND', detailCode: { in: brandCodes } },
      }),
      this.prisma.commonCodeDetail.findMany({
        where: { code: 'CAR_MODEL', detailCode: { in: modelCodes } },
      }),
    ]);
    const brandNameByCode = new Map(brands.map((b) => [b.detailCode, b.detailName]));
    const modelNameByCode = new Map(models.map((m) => [m.detailCode, m.detailName]));
    for (const [memberId, car] of carByMember) {
      const brand = brandNameByCode.get(car.carBrandCode) ?? car.carBrandCode;
      const model = modelNameByCode.get(car.carModelCode) ?? car.carModelCode;
      labels.set(
        memberId,
        car.trimName ? `${brand} ${model} ${car.trimName}` : `${brand} ${model}`,
      );
    }
    return labels;
  }

  private async resolveCoordinates(
    address: string,
  ): Promise<{ latitude: number | null; longitude: number | null }> {
    const query = address.trim();
    if (!query) {
      return { latitude: null, longitude: null };
    }

    const kakaoRestApiKey =
      this.configService.get<string>('KAKAO_REST_API_KEY');
    if (kakaoRestApiKey) {
      const kakaoResult = await this.resolveWithKakao(query, kakaoRestApiKey);
      if (kakaoResult) {
        return kakaoResult;
      }
    }

    return this.resolveWithNominatim(query);
  }

  private async resolveWithKakao(
    query: string,
    kakaoRestApiKey: string,
  ): Promise<{ latitude: number | null; longitude: number | null } | null> {
    try {
      const params = new URLSearchParams({ query });
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `KakaoAK ${kakaoRestApiKey}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        documents?: Array<{ x?: string; y?: string }>;
      };
      const match = data.documents?.[0];
      if (!match?.x || !match?.y) {
        return null;
      }

      return {
        latitude: Number(match.y),
        longitude: Number(match.x),
      };
    } catch {
      return null;
    }
  }

  private async resolveWithNominatim(
    query: string,
  ): Promise<{ latitude: number | null; longitude: number | null }> {
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        limit: '1',
        addressdetails: '1',
        q: query,
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept-Language': 'ko',
            'User-Agent': 'MotoPay/1.0',
          },
        },
      );

      if (!response.ok) {
        return { latitude: null, longitude: null };
      }

      const data = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
      }>;
      const match = data[0];
      if (!match?.lat || !match?.lon) {
        return { latitude: null, longitude: null };
      }

      return {
        latitude: Number(match.lat),
        longitude: Number(match.lon),
      };
    } catch {
      return { latitude: null, longitude: null };
    }
  }

  /** 파트너 로그인 계정의 소속 업체(기본정보 관리 화면) 수정 — 보낸 필드만 반영, categories는 보내면 전체 교체 */
  async updateMyShop(
    shopCode: string,
    dto: UpdateShopDto,
  ): Promise<ShopDetail> {
    const shop = await this.prisma.shop.findUnique({ where: { shopCode } });
    if (!shop) {
      throw new NotFoundException('시공업체를 찾을 수 없습니다.');
    }

    const addressToGeocode = dto.address ?? shop.address;
    const resolvedCoordinates = addressToGeocode
      ? await this.resolveCoordinates(addressToGeocode)
      : { latitude: null, longitude: null };

    const latitude =
      dto.latitude ?? resolvedCoordinates.latitude ?? shop.latitude ?? null;
    const longitude =
      dto.longitude ?? resolvedCoordinates.longitude ?? shop.longitude ?? null;

    await this.prisma.shop.update({
      where: { shopCode },
      data: {
        ...(dto.intro !== undefined ? { intro: dto.intro } : {}),
        ...(dto.greeting !== undefined ? { greeting: dto.greeting } : {}),
        ...(dto.zipCode !== undefined ? { zipCode: dto.zipCode } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.addressDetail !== undefined
          ? { addressDetail: dto.addressDetail }
          : {}),
        latitude,
        longitude,
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.businessHours !== undefined
          ? { businessHours: dto.businessHours }
          : {}),
      },
    });

    if (dto.categories) {
      await this.prisma.shopInstCategory.deleteMany({ where: { shopCode } });
      if (dto.categories.length > 0) {
        await this.prisma.shopInstCategory.createMany({
          data: dto.categories.map((instCode) => ({ shopCode, instCode })),
        });
      }
    }

    return this.getDetail(shopCode, true);
  }

  /**
   * 정산 기본값(기본 수수료·정산일) 수정 — 관리자 전용(AD-CO-02 업체관리 매장정보 탭, 2026-08-23 확정으로
   * AD-STL-02 정산 기준 관리 화면에서 이쪽으로 이동). 파트너 자기 자신은 updateMyShop(UpdateShopDto)로는
   * 이 필드들을 건드릴 수 없도록 DTO 자체를 분리해뒀다
   */
  async updateSettlementInfo(
    shopCode: string,
    dto: UpdateShopSettlementDto,
  ): Promise<ShopDetail> {
    const shop = await this.prisma.shop.findUnique({ where: { shopCode } });
    if (!shop) {
      throw new NotFoundException('시공업체를 찾을 수 없습니다.');
    }
    await this.prisma.shop.update({
      where: { shopCode },
      data: {
        ...(dto.commissionRate !== undefined
          ? { defaultCommissionRate: dto.commissionRate }
          : {}),
        ...(dto.settlementDay !== undefined
          ? { settlementDay: dto.settlementDay }
          : {}),
      },
    });
    return this.getDetail(shopCode, true);
  }

  /** 내 업체 사진 업로드 — MAIN은 항상 1장(있으면 파일 교체), CASE는 추가(최대 10장) */
  async uploadPhoto(
    shopCode: string,
    dto: UploadShopPhotoDto,
  ): Promise<ShopDetail> {
    const shop = await this.prisma.shop.findUnique({ where: { shopCode } });
    if (!shop) {
      throw new NotFoundException('시공업체를 찾을 수 없습니다.');
    }

    if (dto.photoType === 'MAIN') {
      const existing = await this.prisma.shopPhoto.findFirst({
        where: { shopCode, photoType: 'MAIN' },
      });
      const photoPath = await saveShopPhoto(dto.imageBase64);
      if (existing) {
        await this.prisma.shopPhoto.update({
          where: { id: existing.id },
          data: { photoPath },
        });
        await deleteShopPhoto(existing.photoPath);
      } else {
        await this.prisma.shopPhoto.create({
          data: { shopCode, photoPath, photoType: 'MAIN', sortOrder: 0 },
        });
      }
    } else {
      const caseCount = await this.prisma.shopPhoto.count({
        where: { shopCode, photoType: 'CASE' },
      });
      if (caseCount >= MAX_CASE_PHOTOS) {
        throw new BadRequestException(
          `소개 사진은 최대 ${MAX_CASE_PHOTOS}장까지 등록할 수 있습니다.`,
        );
      }
      const photoPath = await saveShopPhoto(dto.imageBase64);
      await this.prisma.shopPhoto.create({
        data: { shopCode, photoPath, photoType: 'CASE', sortOrder: caseCount },
      });
    }

    return this.getDetail(shopCode, true);
  }

  /** 내 업체 사진 삭제 — 다른 업체 소속 photoId를 지정하는 걸 막기 위해 shopCode 일치까지 확인 */
  async deletePhoto(shopCode: string, photoId: number): Promise<ShopDetail> {
    const photo = await this.prisma.shopPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo || photo.shopCode !== shopCode) {
      throw new NotFoundException('사진을 찾을 수 없습니다.');
    }

    await this.prisma.shopPhoto.delete({ where: { id: photoId } });
    await deleteShopPhoto(photo.photoPath);

    return this.getDetail(shopCode, true);
  }
}
