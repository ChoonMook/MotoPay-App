// GET/POST/PATCH/DELETE /admin/products(/:id)(/photo) — AD-CTLG-05 상품 관리 화면 전용, 관리자 로그인 필요
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
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
  @ApiOperation({ summary: '상품 목록 조회 — 상품유형/상품분류/브랜드/딜러사/사용여부/상품명 검색으로 필터' })
  list(
    @CurrentAdmin() me: SafeAdminAccount,
    @Query('prodType') prodType?: string,
    @Query('prodCat') prodCat?: string,
    @Query('brand') brand?: string,
    @Query('dealerCode') dealerCode?: string,
    @Query('useYn') useYn?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.productsService.adminList({
      prodType,
      prodCat,
      brand,
      dealerCode,
      useYn: useYn === undefined ? undefined : useYn === 'true',
      keyword,
      permGroup: me.permGroup,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '상품 상세 조회' })
  get(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() me: SafeAdminAccount) {
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
}
