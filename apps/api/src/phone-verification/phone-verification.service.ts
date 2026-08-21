// SMS 인증번호(OTP) 발송·검증 — 회원가입 등에서 휴대폰 소유를 확인하는 용도(CI/DI 기반 실명인증 아님).
// 실제 SMS 발송은 공용 MsgHubService(LG U+ 메시지허브)를 통함
import { BadRequestException, Injectable } from '@nestjs/common';
import { PhoneVerifyPurpose } from '@prisma/client';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { MsgHubService } from '../msg-hub/msg-hub.service';
import { PrismaService } from '../prisma/prisma.service';

const CODE_TTL_MS = 5 * 60 * 1000; // 인증번호 유효시간 5분
const MAX_ATTEMPTS = 5; // 초과 시 재발송 필요(무차별 대입 방지)
const RESEND_COOLDOWN_MS = 60 * 1000; // 같은 번호로 재발송 요청 최소 간격
const VERIFIED_FRESHNESS_MS = 30 * 60 * 1000; // assertRecentlyVerified가 인정하는 "인증 완료 후 경과 허용시간"

// "모토페이 인증번호" SMS 템플릿(2026-08-22 사용자가 msg-hub에 등록한 템플릿 문구로 교체 — 템플릿코드 TPLpUAkU는
// 참고용, SMS 발송 자체엔 템플릿코드가 쓰이지 않음)
// 마지막 줄의 11자리 문자열은 motopay-mobile 앱의 SMS Retriever API 연동용 앱 서명 해시(SmsRetrieverModule.getAppSignature()로
// 확인, 디버그 키스토어로 서명하는 한 값이 고정됨) — 이 줄이 있어야 안드로이드 앱이 인증번호를 자동으로 읽어 입력해준다.
// SMS Retriever는 진짜 SMS(LMS 아님)로 와야 동작하므로, 이 문자열 전체가 msg-hub의 SMS/LMS 전환 기준(90바이트)을
// 넘지 않도록 길이에 주의할 것(현재 85바이트, 여유 있게 유지)
const SMS_RETRIEVER_APP_HASH = 'g6lsk63khdh';
function authCodeMessage(code: string): string {
  return `[모토페이] 본인확인을 위한 인증번호는 [${code}] 입니다.\n${SMS_RETRIEVER_APP_HASH}`;
}

@Injectable()
export class PhoneVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneCrypto: PhoneCryptoService,
    private readonly msgHub: MsgHubService,
  ) {}

  async sendCode(phone: string, purpose: PhoneVerifyPurpose): Promise<void> {
    const normalizedPhone = this.phoneCrypto.normalize(phone);
    const phoneHash = this.phoneCrypto.hash(normalizedPhone);

    const recent = await this.prisma.phoneVerification.findFirst({
      where: { phoneHash, purpose },
      orderBy: { createdAt: 'desc' },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new BadRequestException('잠시 후 다시 시도해주세요.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    // 발송이 실패하면 DB에 기록을 남기지 않음 — 먼저 기록해두면 문자가 실제로 안 갔는데도 재발송 쿨다운(1분)에
    // 걸려버려 사용자가 곧바로 재시도할 수 없게 됨
    await this.msgHub.sendSms(normalizedPhone, authCodeMessage(code));

    await this.prisma.phoneVerification.create({
      data: {
        phoneHash,
        purpose,
        code,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });
  }

  async verifyCode(phone: string, code: string, purpose: PhoneVerifyPurpose): Promise<void> {
    const normalizedPhone = this.phoneCrypto.normalize(phone);
    const phoneHash = this.phoneCrypto.hash(normalizedPhone);

    const record = await this.prisma.phoneVerification.findFirst({
      where: { phoneHash, purpose, verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('인증번호가 만료되었습니다. 다시 요청해주세요.');
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('인증 시도 횟수를 초과했습니다. 다시 요청해주세요.');
    }
    if (record.code !== code) {
      await this.prisma.phoneVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('인증번호가 일치하지 않습니다.');
    }

    await this.prisma.phoneVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });
  }

  /** 실제 가입 등 처리 시점에 "이 번호가 최근 해당 목적으로 인증완료됐는지" 재확인 — verify-code API를 거치지 않고
   * 바로 가입 요청을 보내는 우회를 막기 위함(서버 측 최종 검증) */
  async assertRecentlyVerified(phone: string, purpose: PhoneVerifyPurpose): Promise<void> {
    const normalizedPhone = this.phoneCrypto.normalize(phone);
    const phoneHash = this.phoneCrypto.hash(normalizedPhone);
    const record = await this.prisma.phoneVerification.findFirst({
      where: { phoneHash, purpose, verified: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || Date.now() - record.createdAt.getTime() > VERIFIED_FRESHNESS_MS) {
      throw new BadRequestException('휴대폰 인증을 먼저 완료해주세요.');
    }
  }
}
