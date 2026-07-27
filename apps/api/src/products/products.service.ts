// 상품/패키지 조회 — 패키지 상세 조회 시 구성상품을 기본상품(BASIC)/업그레이드옵션(OPTION)/추가옵션(ADD)으로 구분해 응답
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Product, ProductBundleItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PackageBundleItem extends ProductBundleItem {
  product: Product | null;
  effectivePrice: number | null; // 이 패키지에서 적용할 가격 — price가 지정돼 있으면 그 값, 없으면 Product.price
}

export interface PackageDetail {
  package: Product;
  basicItems: PackageBundleItem[]; // 기본상품 — 무상 포함
  optionItems: PackageBundleItem[]; // 업그레이드옵션 — 기본상품과 같은 prodCat 내 대체 선택(유상)
  addItems: PackageBundleItem[]; // 추가옵션 — 패키지에 없던 prodCat을 새로 추가(유상)
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 패키지 상세 조회 — 구성상품 매핑(ProductBundleItem)은 DB FK 없이 상품코드 문자열로만 연결돼 있어
   * (Product 자기참조, schema.prisma 주석 참고) 구성상품 정보를 별도로 조회해 직접 조인한다.
   */
  async getPackageDetail(packageCode: string): Promise<PackageDetail> {
    const pkg = await this.prisma.product.findUnique({
      where: { productCode: packageCode },
    });
    if (!pkg || pkg.prodType !== 'PKG') {
      throw new NotFoundException('패키지 상품을 찾을 수 없습니다.');
    }

    const bundleItems = await this.prisma.productBundleItem.findMany({
      where: { packageCode },
      orderBy: { sortOrder: 'asc' },
    });

    const components = await this.prisma.product.findMany({
      where: {
        productCode: { in: bundleItems.map((item) => item.componentCode) },
      },
    });
    const componentByCode = new Map(
      components.map((component) => [component.productCode, component]),
    );

    const items: PackageBundleItem[] = bundleItems.map((item) => {
      const product = componentByCode.get(item.componentCode) ?? null;
      return {
        ...item,
        product,
        effectivePrice: item.price ?? product?.price ?? null,
      };
    });

    return {
      package: pkg,
      basicItems: items.filter((item) => item.itemType === 'BASIC'),
      optionItems: items.filter((item) => item.itemType === 'OPTION'),
      addItems: items.filter((item) => item.itemType === 'ADD'),
    };
  }
}
