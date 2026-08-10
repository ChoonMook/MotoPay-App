// 상품/패키지 조회(공개) + 관리자용 등록/수정(AD-CTLG-05 상품 관리) — 패키지 상세 조회 시 구성상품을
// 기본상품(BASIC)/업그레이드옵션(OPTION)/추가옵션(ADD)으로 구분해 응답
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Product, ProductBundleItem, ProductImage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  deleteProductPhoto,
  saveProductPhoto,
} from '../common/storage/product-photo-storage';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

// 상품 하나당 등록 가능한 이미지 개수 — ShopPhoto(CASE 사진 최대 10장)와 동일한 상한
const MAX_PRODUCT_IMAGES = 10;

export type ProductWithImages = Product & { images: ProductImage[] };

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

// 원가(supplyPrice)는 정산 관련 내부 값이라 이 두 권한그룹의 관리자에게만 조회/저장을 허용
const SUPPLY_PRICE_VISIBLE_PERM_GROUPS = new Set(['SUPER_ADMIN', 'SETTLEMENT']);

function canViewSupplyPrice(permGroup: string): boolean {
  return SUPPLY_PRICE_VISIBLE_PERM_GROUPS.has(permGroup);
}

/** 권한 없는 관리자에게는 응답에서 supplyPrice 필드 자체를 제거(JSON 직렬화 시 undefined 키는 생략됨) */
function maskSupplyPrice<T extends { supplyPrice: number | null }>(product: T, permGroup: string): T {
  if (canViewSupplyPrice(permGroup)) return product;
  return { ...product, supplyPrice: undefined as unknown as null };
}

const IMAGES_ORDER_BY = { sortOrder: 'asc' as const };

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 상품 카탈로그 조회 — 예약시공(입찰) 전문가추천 화면에서 파트너가 카테고리별 추천 상품을 검색할 때 사용 */
  async list(params: { prodCat?: string; prodType?: string }): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        useYn: true,
        ...(params.prodCat ? { prodCat: params.prodCat } : {}),
        ...(params.prodType ? { prodType: params.prodType } : {}),
      },
      orderBy: { price: 'asc' },
    });
  }

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

  /** AD-CTLG-05 상품 관리 화면 목록 조회 — 상품유형/상품분류/브랜드/딜러사/사용여부/상품명 검색으로 필터 */
  async adminList(params: {
    prodType?: string;
    prodCat?: string;
    brand?: string;
    dealerCode?: string;
    useYn?: boolean;
    keyword?: string;
    permGroup: string;
  }): Promise<ProductWithImages[]> {
    const { permGroup, keyword, ...filters } = params;
    const products = await this.prisma.product.findMany({
      where: {
        ...(filters.prodType ? { prodType: filters.prodType } : {}),
        ...(filters.prodCat ? { prodCat: filters.prodCat } : {}),
        ...(filters.brand ? { brand: filters.brand } : {}),
        ...(filters.dealerCode ? { dealerCode: filters.dealerCode } : {}),
        ...(filters.useYn !== undefined ? { useYn: filters.useYn } : {}),
        ...(keyword ? { name: { contains: keyword } } : {}),
      },
      include: { images: { orderBy: IMAGES_ORDER_BY } },
      orderBy: { id: 'desc' },
    });
    return products.map((product) => maskSupplyPrice(product, permGroup));
  }

  async adminGet(id: number, permGroup: string): Promise<ProductWithImages> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: IMAGES_ORDER_BY } },
    });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return maskSupplyPrice(product, permGroup);
  }

  /**
   * 상품 등록 — productCode(Shop.shopCode와 동일한 2단계 채번 방식: 임시값으로 생성 후 id 기반
   * 10자리 0-padding으로 즉시 업데이트)와 원가(supplyPrice) 권한 게이팅을 함께 처리
   */
  async create(dto: CreateProductDto, permGroup: string): Promise<ProductWithImages> {
    const supplyPrice = canViewSupplyPrice(permGroup) ? dto.supplyPrice : undefined;
    return this.prisma.$transaction(async (tx) => {
      const placeholder = await tx.product.create({
        data: {
          productCode: '0'.repeat(10),
          prodType: dto.prodType,
          brand: dto.brand,
          prodCat: dto.prodCat,
          dealerCode: dto.dealerCode,
          name: dto.name,
          price: dto.price,
          originPrice: dto.originPrice,
          supplyPrice,
          description: dto.description,
          useYn: dto.useYn,
          ncpApplicable: dto.ncpApplicable,
          bidApplicable: dto.bidApplicable,
        },
      });
      return tx.product.update({
        where: { id: placeholder.id },
        data: { productCode: String(placeholder.id).padStart(10, '0') },
        include: { images: { orderBy: IMAGES_ORDER_BY } },
      });
    });
  }

  async update(id: number, dto: UpdateProductDto, permGroup: string): Promise<ProductWithImages> {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const supplyPrice = canViewSupplyPrice(permGroup) ? dto.supplyPrice : undefined;
    return this.prisma.product.update({
      where: { id },
      data: { ...dto, supplyPrice },
      include: { images: { orderBy: IMAGES_ORDER_BY } },
    });
  }

  async remove(id: number): Promise<void> {
    const exists = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!exists) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    await this.prisma.productImage.deleteMany({ where: { productCode: exists.productCode } });
    await this.prisma.product.delete({ where: { id } });
    for (const image of exists.images) {
      await deleteProductPhoto(image.imagePath);
    }
  }

  /** 상품 이미지 갤러리에 한 장 추가(최대 10장) — 첫 번째 이미지는 Product.imagePath(대표이미지)와 항상 동기화 */
  async uploadImage(id: number, imageBase64: string, permGroup: string): Promise<ProductWithImages> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const count = await this.prisma.productImage.count({ where: { productCode: product.productCode } });
    if (count >= MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(`상품 이미지는 최대 ${MAX_PRODUCT_IMAGES}장까지 등록할 수 있습니다.`);
    }
    const imagePath = await saveProductPhoto(imageBase64);
    await this.prisma.productImage.create({
      data: { productCode: product.productCode, imagePath, sortOrder: count },
    });
    await this.syncCoverImage(product.productCode);
    return this.adminGet(id, permGroup);
  }

  async deleteImage(id: number, imageId: number, permGroup: string): Promise<ProductWithImages> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productCode !== product.productCode) {
      throw new NotFoundException('이미지를 찾을 수 없습니다.');
    }
    await this.prisma.productImage.delete({ where: { id: imageId } });
    await deleteProductPhoto(image.imagePath);
    await this.syncCoverImage(product.productCode);
    return this.adminGet(id, permGroup);
  }

  /** Product.imagePath(대표이미지)를 갤러리의 첫 번째(sortOrder 최소) 이미지로 맞춤(갤러리가 비었으면 null) */
  private async syncCoverImage(productCode: string): Promise<void> {
    const first = await this.prisma.productImage.findFirst({
      where: { productCode },
      orderBy: IMAGES_ORDER_BY,
    });
    await this.prisma.product.update({
      where: { productCode },
      data: { imagePath: first?.imagePath ?? null },
    });
  }
}
