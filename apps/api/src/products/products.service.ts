// 상품/패키지 조회(공개) + 관리자용 등록/수정(AD-CTLG-05 상품 관리) — 패키지 상세 조회 시 구성상품을
// 기본상품(BASIC)/업그레이드옵션(OPTION)/추가옵션(ADD)으로 구분해 응답
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Product,
  ProductBundleItem,
  ProductDealerMapping,
  ProductImage,
  ProductPositionOption,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  deleteProductPhoto,
  saveProductPhoto,
} from '../common/storage/product-photo-storage';
import type { CreateProductDto } from './dto/create-product.dto';
import type { SetProductBundleItemsDto } from './dto/set-product-bundle-items.dto';
import type { SetProductCarModelMappingsDto } from './dto/set-product-car-model-mappings.dto';
import type { SetProductDealerMappingsDto } from './dto/set-product-dealer-mappings.dto';
import type { SetProductPositionOptionsDto } from './dto/set-product-position-options.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

// 상품 하나당 등록 가능한 이미지 개수 — ShopPhoto(CASE 사진 최대 10장)와 동일한 상한
const MAX_PRODUCT_IMAGES = 10;

export type ProductWithImages = Product & {
  images: ProductImage[];
  positionOptions: ProductPositionOption[];
};

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
    // AD-CTLG-10 딜러사별 필터용 — Product.dealerCode(단일필드)와 달리 ProductDealerMapping 다대다 관계로 필터
    mappedDealerCode?: string;
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
        ...(filters.mappedDealerCode
          ? { dealerMappings: { some: { dealerCode: filters.mappedDealerCode } } }
          : {}),
        ...(filters.useYn !== undefined ? { useYn: filters.useYn } : {}),
        ...(keyword ? { name: { contains: keyword } } : {}),
      },
      include: { images: { orderBy: IMAGES_ORDER_BY }, positionOptions: true },
      orderBy: { id: 'desc' },
    });
    return products.map((product) => maskSupplyPrice(product, permGroup));
  }

  async adminGet(id: number, permGroup: string): Promise<ProductWithImages> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: IMAGES_ORDER_BY }, positionOptions: true },
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
        include: { images: { orderBy: IMAGES_ORDER_BY }, positionOptions: true },
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
      include: { images: { orderBy: IMAGES_ORDER_BY }, positionOptions: true },
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
    await this.prisma.productPositionOption.deleteMany({ where: { productCode: exists.productCode } });
    await this.prisma.productDealerMapping.deleteMany({ where: { productCode: exists.productCode } });
    await this.prisma.productCarModelMapping.deleteMany({ where: { productCode: exists.productCode } });
    // ProductBundleItem은 DB FK가 없어 삭제해도 막히진 않지만, 이 상품이 패키지든 구성상품이든 걸려있던
    // 매핑을 그대로 두면 고아 데이터가 되므로 함께 정리
    await this.prisma.productBundleItem.deleteMany({
      where: { OR: [{ packageCode: exists.productCode }, { componentCode: exists.productCode }] },
    });
    await this.prisma.product.delete({ where: { id } });
    for (const image of exists.images) {
      await deleteProductPhoto(image.imagePath);
    }
  }

  /**
   * AD-CTLG-07 상품 옵션 관리 — 부위옵션 사용여부와 부위별 선택 가능 농도를 통째로 교체 저장.
   * (부위, 농도) 조합 행을 모두 지우고 새로 넣는 방식이라 부분 수정이 아니라 항상 전체 상태를 다시 보낸다
   */
  async setPositionOptions(
    id: number,
    dto: SetProductPositionOptionsDto,
    permGroup: string,
  ): Promise<ProductWithImages> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    // 부위옵션을 미사용으로 끄면 부위·농도 조합은 의미가 없어지므로 넘어온 options와 무관하게 항상 비운다
    const rows = dto.positionOptionYn
      ? dto.options.flatMap((group) =>
          group.levels.map((level) => ({
            productCode: product.productCode,
            position: group.position,
            level,
          })),
        )
      : [];
    await this.prisma.$transaction([
      this.prisma.productPositionOption.deleteMany({ where: { productCode: product.productCode } }),
      ...(rows.length > 0 ? [this.prisma.productPositionOption.createMany({ data: rows })] : []),
      this.prisma.product.update({ where: { id }, data: { positionOptionYn: dto.positionOptionYn } }),
    ]);
    return this.adminGet(id, permGroup);
  }

  /** AD-CTLG-08 딜러사 매핑 관리 — 우측 체크리스트를 채우기 위한 현재 매핑 목록 조회 */
  async getDealerMappings(id: number): Promise<ProductDealerMapping[]> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    return this.prisma.productDealerMapping.findMany({
      where: { productCode: product.productCode },
      orderBy: { dealerCode: 'asc' },
    });
  }

  /**
   * AD-CTLG-08 딜러사 매핑 관리 — 체크리스트 전체 상태(dealerCodes)를 그대로 반영해 추가분만 새로 만들고
   * 해제분만 지운다. 이미 매핑된 딜러사는 건드리지 않아 그때 스냅샷해둔 price가 계속 유지된다(사용자 확정 사항:
   * 디폴트 판매가는 "매핑 시점"에만 자동 부여되고 이후 Product.price 변경에 따라 자동으로 갱신되지 않음)
   */
  async setDealerMappings(id: number, dto: SetProductDealerMappingsDto): Promise<ProductDealerMapping[]> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const existing = await this.prisma.productDealerMapping.findMany({ where: { productCode: product.productCode } });
    const existingCodes = new Set(existing.map((m) => m.dealerCode));
    const nextCodes = new Set(dto.dealerCodes);

    const toAdd = [...nextCodes].filter((code) => !existingCodes.has(code));
    const toRemove = [...existingCodes].filter((code) => !nextCodes.has(code));

    if (toRemove.length > 0) {
      await this.prisma.productDealerMapping.deleteMany({
        where: { productCode: product.productCode, dealerCode: { in: toRemove } },
      });
    }
    if (toAdd.length > 0) {
      await this.prisma.productDealerMapping.createMany({
        data: toAdd.map((dealerCode) => ({
          productCode: product.productCode,
          dealerCode,
          price: product.price,
        })),
      });
    }

    return this.getDealerMappings(id);
  }

  /** AD-CTLG-09 차종 매핑 관리 — 우측 트리 체크박스를 채우기 위한 현재 매핑된 차종코드 목록 조회 */
  async getCarModelMappings(id: number): Promise<string[]> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const rows = await this.prisma.productCarModelMapping.findMany({
      where: { productCode: product.productCode },
    });
    return rows.map((r) => r.carModelCode);
  }

  /** AD-CTLG-09 차종 매핑 관리 — 트리 체크 상태를 통째로 교체 저장(딜러사 매핑과 달리 가격 스냅샷이 없어 단순 전체 교체) */
  async setCarModelMappings(id: number, dto: SetProductCarModelMappingsDto): Promise<string[]> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    await this.prisma.productCarModelMapping.deleteMany({ where: { productCode: product.productCode } });
    if (dto.carModelCodes.length > 0) {
      await this.prisma.productCarModelMapping.createMany({
        data: dto.carModelCodes.map((carModelCode) => ({ productCode: product.productCode, carModelCode })),
      });
    }
    return this.getCarModelMappings(id);
  }

  /**
   * AD-CTLG-10 신차패키지 구성 관리 — 패키지(packageCode)의 구성상품 목록 조회. 공개용 getPackageDetail과
   * 동일하게 componentCode를 Product로 조인해 상품명·자체 판매가를 함께 내려준다(가격 override 비교용)
   */
  async getBundleItems(id: number): Promise<PackageBundleItem[]> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    const items = await this.prisma.productBundleItem.findMany({
      where: { packageCode: product.productCode },
      orderBy: { sortOrder: 'asc' },
    });
    const components = await this.prisma.product.findMany({
      where: { productCode: { in: items.map((item) => item.componentCode) } },
    });
    const componentByCode = new Map(components.map((c) => [c.productCode, c]));
    return items.map((item) => {
      const componentProduct = componentByCode.get(item.componentCode) ?? null;
      return {
        ...item,
        product: componentProduct,
        effectivePrice: item.price ?? componentProduct?.price ?? null,
      };
    });
  }

  /**
   * AD-CTLG-10 신차패키지 구성 관리 — 구성상품 목록(유형·가격override·수량·순서)을 통째로 교체 저장.
   * sortOrder는 화면에서 유형(BASIC/OPTION/ADD)별로 따로 편집하므로 그룹 내 상대 순서만 맞으면 되고,
   * 다른 그룹과 값이 겹쳐도 무방하다(조회 시 정렬 후 유형으로 필터링해 그룹별 순서는 항상 보존됨)
   */
  async setBundleItems(id: number, dto: SetProductBundleItemsDto): Promise<PackageBundleItem[]> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
    await this.prisma.productBundleItem.deleteMany({ where: { packageCode: product.productCode } });
    if (dto.items.length > 0) {
      await this.prisma.productBundleItem.createMany({
        data: dto.items.map((item) => ({
          packageCode: product.productCode,
          componentCode: item.componentCode,
          itemType: item.itemType,
          price: item.price,
          qty: item.qty,
          sortOrder: item.sortOrder,
        })),
      });
    }
    return this.getBundleItems(id);
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
