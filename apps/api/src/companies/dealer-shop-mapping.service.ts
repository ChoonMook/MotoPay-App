// 딜러사(Company, coType='DEALER')별 안내 가능 시공업체(Shop) 매핑(AD-NCPK-04) — CompaniesService와 분리해
// 이 화면 전용 로직만 담는다
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SetDealerShopMappingsDto } from './dto/set-dealer-shop-mappings.dto';

@Injectable()
export class DealerShopMappingService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireDealerCompany(companyId: number) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('업체를 찾을 수 없습니다.');
    }
    if (company.coType !== 'DEALER') {
      throw new BadRequestException('딜러사 타입 업체만 시공업체 매핑을 관리할 수 있습니다.');
    }
    return company;
  }

  async getMappedShopCodes(companyId: number): Promise<string[]> {
    const company = await this.requireDealerCompany(companyId);
    const rows = await this.prisma.dealerShopMapping.findMany({
      where: { dealerCompanyId: company.id },
    });
    return rows.map((r) => r.shopCode);
  }

  /** 체크리스트 전체 상태를 그대로 반영해 통째로 교체 저장 */
  async setMappedShopCodes(companyId: number, dto: SetDealerShopMappingsDto): Promise<string[]> {
    const company = await this.requireDealerCompany(companyId);
    await this.prisma.dealerShopMapping.deleteMany({ where: { dealerCompanyId: company.id } });
    if (dto.shopCodes.length > 0) {
      await this.prisma.dealerShopMapping.createMany({
        data: dto.shopCodes.map((shopCode) => ({ dealerCompanyId: company.id, shopCode })),
      });
    }
    return this.getMappedShopCodes(companyId);
  }
}
