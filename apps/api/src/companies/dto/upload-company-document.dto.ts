// POST /admin/companies/:id/documents 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

export class UploadCompanyDocumentDto {
  @ApiProperty({
    description: 'data URI(base64) 형식의 파일 — JPEG·PNG·WEBP·PDF만 허용',
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
  })
  @IsString()
  @Matches(/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,.+$/, {
    message: 'JPEG·PNG·WEBP·PDF 형식의 파일만 업로드할 수 있습니다.',
  })
  fileBase64: string;

  @ApiProperty({
    enum: ['BIZ_REG_CERT', 'BANKBOOK_COPY'],
    description:
      '서류유형 — BIZ_REG_CERT(사업자 등록증)/BANKBOOK_COPY(통장사본)',
  })
  @IsIn(['BIZ_REG_CERT', 'BANKBOOK_COPY'])
  docType: 'BIZ_REG_CERT' | 'BANKBOOK_COPY';
}
