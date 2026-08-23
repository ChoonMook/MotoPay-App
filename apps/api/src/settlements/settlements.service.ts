// 정산 기준 관리(AD-STL-02) — 구성상품×시공업체 수수료(매입가) 예외(ProductShopCommission) 조회/전체교체.
// 시공업체별 기본 수수료(Shop.defaultCommission*)는 AD-CO-02 업체관리 매장정보 탭으로 이관됨(2026-08-23,
// companies.service.ts의 updateShopSettlement 참고) — 여기서는 예외 화면의 기본값 힌트 표시용으로만 읽는다
import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductShopCommission, Shop } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SetProductShopCommissionsDto } from './dto/set-product-shop-commissions.dto';

export interface ShopCommissionView {
  shopCode: string;
  name: string;
  useYn: boolean;
  commissionRate: number | null;
}

export interface ProductShopCommissionView {
  shopCode: string;
  commissionType: string;
  commissionAmount: number | null;
  commissionRate: number | null;
}

function toShopView(shop: Shop): ShopCommissionView {
  return {
    shopCode: shop.shopCode,
    name: shop.name,
    useYn: shop.useYn,
    commissionRate:
      shop.defaultCommissionRate === null
        ? null
        : Number(shop.defaultCommissionRate),
  };
}

function toProductCommissionView(
  row: ProductShopCommission,
): ProductShopCommissionView {
  return {
    shopCode: row.shopCode,
    commissionType: row.commissionType,
    commissionAmount: row.commissionAmount,
    commissionRate: row.commissionRate === null ? null : Number(row.commissionRate),
  };
}

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  /** AD-STL-02 하단 예외 화면의 기본값 힌트 표시용 — 전체 시공업체와 각 업체의 기본 수수료(정산일 제외) */
  async listShopCommissions(): Promise<ShopCommissionView[]> {
    const shops = await this.prisma.shop.findMany({ orderBy: { name: 'asc' } });
    return shops.map(toShopView);
  }

  /** AD-STL-02 하단 — 선택한 상품의 시공업체별 수수료 예외 목록 */
  async getProductCommissions(
    productCode: string,
  ): Promise<ProductShopCommissionView[]> {
    const product = await this.prisma.product.findUnique({
      where: { productCode },
    });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const rows = await this.prisma.productShopCommission.findMany({
      where: { productCode },
      orderBy: { shopCode: 'asc' },
    });
    return rows.map(toProductCommissionView);
  }

  /**
   * AD-STL-02 하단 — 상품별 수수료 예외 전체 교체 저장. items에 포함된 시공업체만 예외로 유지되고,
   * 빠진 시공업체는 예외가 삭제되어(=시공업체 기본값 적용) 다시 기본값을 따르게 된다
   * (ProductDealerMapping 체크리스트 저장과 동일한 전체 교체 방식)
   */
  async setProductCommissions(
    productCode: string,
    dto: SetProductShopCommissionsDto,
    adminUsername: string,
  ): Promise<ProductShopCommissionView[]> {
    const product = await this.prisma.product.findUnique({
      where: { productCode },
    });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const existing = await this.prisma.productShopCommission.findMany({
      where: { productCode },
    });
    const existingByShopCode = new Map(existing.map((row) => [row.shopCode, row]));
    const nextShopCodes = new Set(dto.items.map((item) => item.shopCode));

    const toRemove = existing
      .filter((row) => !nextShopCodes.has(row.shopCode))
      .map((row) => row.shopCode);

    await this.prisma.$transaction([
      ...(toRemove.length > 0
        ? [
            this.prisma.productShopCommission.deleteMany({
              where: { productCode, shopCode: { in: toRemove } },
            }),
          ]
        : []),
      ...dto.items.map((item) => {
        const current = existingByShopCode.get(item.shopCode);
        const data = {
          commissionType: item.commissionType,
          commissionAmount: item.commissionAmount ?? null,
          commissionRate: item.commissionRate ?? null,
        };
        return current
          ? this.prisma.productShopCommission.update({
              where: { id: current.id },
              data: { ...data, updatedBy: adminUsername },
            })
          : this.prisma.productShopCommission.create({
              data: {
                productCode,
                shopCode: item.shopCode,
                ...data,
                createdBy: adminUsername,
              },
            });
      }),
    ]);

    return this.getProductCommissions(productCode);
  }
}
