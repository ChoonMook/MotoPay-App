// 시공업체 조회 — 목록(시공가능 카테고리 필터·거리순 정렬)/상세(사진·시공가능 카테고리 포함)/내 업체 수정(파트너 전용)
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Shop, ShopPhoto } from '@prisma/client';
import { deleteShopPhoto, saveShopPhoto } from '../common/storage/shop-photo-storage';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateShopDto } from './dto/update-shop.dto';
import type { UploadShopPhotoDto } from './dto/upload-shop-photo.dto';

const MAX_CASE_PHOTOS = 10;

export interface ShopListItem extends Shop {
  mainPhoto: ShopPhoto | null;
  categories: string[]; // 시공가능 자동차 시공코드 목록
  distanceKm: number | null; // 기준 위치(lat/lng) 지정 시에만 값 존재
}

export interface ShopDetail extends Shop {
  photos: ShopPhoto[];
  categories: string[];
}

export interface ListShopsParams {
  instCodes?: string[]; // 지정하면 이 시공코드를 모두 지원하는 업체만 조회
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
    const { instCodes, lat, lng } = params;

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
      },
      include: {
        photos: { where: { photoType: 'MAIN' }, take: 1 },
        categories: true,
      },
      orderBy: { name: 'asc' },
    });

    const items: ShopListItem[] = shops.map((shop) => {
      const { photos, categories, ...rest } = shop;
      const distanceKm =
        lat !== undefined &&
        lng !== undefined &&
        shop.latitude !== null &&
        shop.longitude !== null
          ? haversineKm(lat, lng, shop.latitude, shop.longitude)
          : null;
      return {
        ...rest,
        mainPhoto: photos[0] ?? null,
        categories: categories.map((c) => c.instCode),
        distanceKm,
      };
    });

    if (lat !== undefined && lng !== undefined) {
      items.sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      );
    }

    return items;
  }

  async getDetail(shopCode: string): Promise<ShopDetail> {
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
    return { ...rest, categories: categories.map((c) => c.instCode) };
  }

  private async resolveCoordinates(address: string): Promise<{ latitude: number | null; longitude: number | null }> {
    const query = address.trim();
    if (!query) {
      return { latitude: null, longitude: null };
    }

    const kakaoRestApiKey = this.configService.get<string>('KAKAO_REST_API_KEY');
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
      const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `KakaoAK ${kakaoRestApiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { documents?: Array<{ x?: string; y?: string }> };
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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': 'ko',
          'User-Agent': 'MotoPay/1.0',
        },
      });

      if (!response.ok) {
        return { latitude: null, longitude: null };
      }

      const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
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

    const latitude = dto.latitude ?? resolvedCoordinates.latitude ?? shop.latitude ?? null;
    const longitude = dto.longitude ?? resolvedCoordinates.longitude ?? shop.longitude ?? null;

    await this.prisma.shop.update({
      where: { shopCode },
      data: {
        ...(dto.intro !== undefined ? { intro: dto.intro } : {}),
        ...(dto.greeting !== undefined ? { greeting: dto.greeting } : {}),
        ...(dto.zipCode !== undefined ? { zipCode: dto.zipCode } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.addressDetail !== undefined ? { addressDetail: dto.addressDetail } : {}),
        latitude,
        longitude,
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.businessHours !== undefined ? { businessHours: dto.businessHours } : {}),
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

    return this.getDetail(shopCode);
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

    return this.getDetail(shopCode);
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

    return this.getDetail(shopCode);
  }
}
