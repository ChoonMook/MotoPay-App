// PortOne V2 본인인증(실명인증) 결과 조회 — 회원가입 시 이름·휴대폰번호를 서버가 직접 확인하기 위함.
// 프런트엔드(@portone/browser-sdk)가 PortOne.requestIdentityVerification()으로 NICE/PASS 등 인증을 띄우고
// 발급받은 identityVerificationId를 서버로 넘기면, 이 서비스가 PortOne API로 그 결과를 재조회해 신뢰한다
// (클라이언트가 보낸 이름·번호를 그대로 믿지 않고 서버가 PortOne에 직접 물어봐서 확정하는 것이 핵심)
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatPhone, normalizePhone } from '../common/crypto/phone-crypto';

interface PortOneIdentityVerification {
  status: string;
  verifiedCustomer?: {
    name?: string;
    phoneNumber?: string;
  };
}

export interface VerifiedIdentity {
  name: string;
  phone: string;
}

@Injectable()
export class IdentityVerificationService {
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.apiSecret = this.configService.get<string>('PORTONE_API_SECRET') ?? '';
  }

  async confirm(identityVerificationId: string): Promise<VerifiedIdentity> {
    const response = await fetch(
      `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
      { headers: { Authorization: `PortOne ${this.apiSecret}` } },
    );
    if (!response.ok) {
      throw new BadRequestException('본인인증 조회에 실패했습니다.');
    }

    const result = (await response.json()) as PortOneIdentityVerification;
    if (result.status !== 'VERIFIED') {
      throw new BadRequestException('완료되지 않은 인증이거나 인증에 실패했습니다.');
    }

    const name = result.verifiedCustomer?.name;
    const phone = result.verifiedCustomer?.phoneNumber;
    if (!name || !phone) {
      throw new BadRequestException('본인인증 결과에서 이름 또는 휴대폰번호를 확인하지 못했습니다.');
    }

    return { name, phone: formatPhone(normalizePhone(phone)) };
  }
}
