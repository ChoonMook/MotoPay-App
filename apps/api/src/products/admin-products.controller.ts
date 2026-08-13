// GET/POST/PATCH/DELETE /admin/products(/:id)(/images)(/position-options)(/dealer-mappings)
// (/car-model-mappings)(/bundle-items) — AD-CTLG-05 상품 관리·AD-CTLG-07 상품 옵션 관리·
// AD-CTLG-08 딜러사 매핑 관리·AD-CTLG-09 차종 매핑 관리·AD-CTLG-10 신차패키지 구성 관리 화면 전용,
// 관리자 로그인 필요
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { SetProductBundleItemsDto } from './dto/set-product-bundle-items.dto';
import { SetProductCarModelMappingsDto } from './dto/set-product-car-model-mappings.dto';
import { SetProductDealerMappingsDto } from './dto/set-product-dealer-mappings.dto';
import { SetProductPositionOptionsDto } from './dto/set-product-position-options.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductImageDto } from './dto/upload-product-image.dto';
import { ProductsService } from './products.service';

@ApiTags('admin-products')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary:
      '상품 목록 조회 — 상품유형/상품분류/브랜드/딜러사/사용여부/상품명 검색으로 필터',
  })
  list(
    @CurrentAdmin() me: SafeAdminAccount,
    @Query('prodType') prodType?: string,
    @Query('prodCat') prodCat?: string,
    @Query('brand') brand?: string,
    @Query('dealerCompanyId') dealerCompanyId?: string,
    @Query('mappedDealerCompanyId') mappedDealerCompanyId?: string,
    @Query('useYn') useYn?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.productsService.adminList({
      prodType,
      prodCat,
      brand,
      dealerCompanyId:
        dealerCompanyId === undefined ? undefined : Number(dealerCompanyId),
      mappedDealerCompanyId:
        mappedDealerCompanyId === undefined
          ? undefined
          : Number(mappedDealerCompanyId),
      useYn: useYn === undefined ? undefined : useYn === 'true',
      keyword,
      permGroup: me.permGroup,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '상품 상세 조회' })
  get(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.productsService.adminGet(id, me.permGroup);
  }

  @Post()
  @ApiOperation({ summary: '상품 등록' })
  create(@Body() dto: CreateProductDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.productsService.create(dto, me.permGroup);
  }

  @Patch(':id')
  @ApiOperation({ summary: '상품 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.productsService.update(id, dto, me.permGroup);
  }

  @Delete(':id')
  @ApiOperation({ summary: '상품 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @ApiOperation({ summary: '상품 이미지 갤러리에 한 장 추가(최대 10장)' })
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UploadProductImageDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.productsService.uploadImage(id, dto.imageBase64, me.permGroup);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: '상품 이미지 갤러리에서 한 장 삭제' })
  deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.productsService.deleteImage(id, imageId, me.permGroup);
  }

  @Put(':id/position-options')
  @ApiOperation({
    summary:
      '부위옵션 사용여부·부위별 선택 가능 농도 통째로 교체 저장(AD-CTLG-07)',
  })
  setPositionOptions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetProductPositionOptionsDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.productsService.setPositionOptions(id, dto, me.permGroup);
  }

  @Get(':id/dealer-mappings')
  @ApiOperation({ summary: '딜러사 매핑 현황 조회(AD-CTLG-08)' })
  getDealerMappings(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getDealerMappings(id);
  }

  @Put(':id/dealer-mappings')
  @ApiOperation({
    summary:
      '딜러사 매핑 체크리스트 전체 교체 저장(AD-CTLG-08) — 신규 체크분만 판매가 스냅샷 생성',
  })
  setDealerMappings(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetProductDealerMappingsDto,
  ) {
    return this.productsService.setDealerMappings(id, dto);
  }

  @Get(':id/car-model-mappings')
  @ApiOperation({ summary: '적용 가능 차종 매핑 현황 조회(AD-CTLG-09)' })
  getCarModelMappings(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getCarModelMappings(id);
  }

  @Put(':id/car-model-mappings')
  @ApiOperation({
    summary: '적용 가능 차종 트리 체크 상태 전체 교체 저장(AD-CTLG-09)',
  })
  setCarModelMappings(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetProductCarModelMappingsDto,
  ) {
    return this.productsService.setCarModelMappings(id, dto);
  }

  @Get(':id/bundle-items')
  @ApiOperation({ summary: '패키지 구성상품 목록 조회(AD-CTLG-10)' })
  getBundleItems(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getBundleItems(id);
  }

  @Put(':id/bundle-items')
  @ApiOperation({
    summary:
      '패키지 구성상품 목록(유형·가격override·수량·순서) 전체 교체 저장(AD-CTLG-10)',
  })
  setBundleItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetProductBundleItemsDto,
  ) {
    return this.productsService.setBundleItems(id, dto);
  }
}
