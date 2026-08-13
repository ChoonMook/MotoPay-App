// POST /admin/uploads/content-image — 관리자웹 리치텍스트 에디터(RichTextEditor) 본문 삽입 이미지 업로드 전용,
// 특정 엔티티에 종속되지 않는 범용 엔드포인트(상품 등록처럼 엔티티가 아직 저장되지 않은 화면에서도 사용 가능)
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { saveContentImage } from '../common/storage/content-image-storage';
import { UploadContentImageDto } from './dto/upload-content-image.dto';

@ApiTags('admin-uploads')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/uploads')
export class AdminContentImageController {
  @Post('content-image')
  @ApiOperation({
    summary:
      '리치텍스트 에디터 본문 삽입 이미지 업로드 — uploads/ 기준 상대경로 반환',
  })
  async upload(@Body() dto: UploadContentImageDto): Promise<{ path: string }> {
    const path = await saveContentImage(dto.imageBase64);
    return { path };
  }
}
