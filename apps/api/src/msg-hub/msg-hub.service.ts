// LG U+ 메시지허브(https://api.msghub.uplus.co.kr) 연동 공용 클라이언트 — SMS/LMS 발송 + 카카오 알림톡 발송을
// 인증번호(OTP), 예약 알림 등 여러 기능에서 재사용하기 위한 공통 모듈(2026-08-21). 인증 방식은 apiKey/apiPwd로
// Bearer 토큰을 발급받아(약 50분 캐시) 이후 요청에 실어 보내는 구조(LGU+ 제공 ASP.NET 참조 구현과 동일 규격)
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';

interface MsgHubTokenResponse {
  data?: { token?: string };
}

const TOKEN_TTL_MS = 50 * 60 * 1000; // LGU+ 발급 토큰 실제 유효시간보다 여유를 둔 캐시 기간
const SMS_BYTE_LIMIT = 90; // 이 바이트수를 넘으면 SMS 대신 LMS(장문)로 자동 전환

@Injectable()
export class MsgHubService {
  private readonly logger = new Logger(MsgHubService.name);
  private readonly baseUrl: string;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiPwd: string;
  private readonly kkoChId: string;
  private readonly callback: string;

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('MSGHUB_BASE_URL') ?? '';
    this.apiUrl = this.configService.get<string>('MSGHUB_API_URL') ?? '';
    this.apiKey = this.configService.get<string>('MSGHUB_API_KEY') ?? '';
    this.apiPwd = this.configService.get<string>('MSGHUB_API_PWD') ?? '';
    this.kkoChId = this.configService.get<string>('MSGHUB_KKO_CH_ID') ?? '';
    this.callback = this.configService.get<string>('MSGHUB_CALLBACK_URL') ?? '';
  }

  private sha512Base64(input: string): string {
    return createHash('sha512').update(input, 'utf8').digest('base64');
  }

  /** apiPwd를 랜덤 문자열과 2중 SHA-512+Base64로 암호화(LGU+ 메시지허브 인증 규격) */
  private encryptApiPwd(randomStr: string): string {
    const step1 = this.sha512Base64(this.apiPwd);
    return this.sha512Base64(`${step1}.${randomStr}`);
  }

  private newCliKey(): string {
    return randomBytes(15).toString('hex'); // 30자리
  }

  private async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const randomStr = randomBytes(5).toString('hex'); // 10자리
    const response = await fetch(`${this.baseUrl}/auth/v1/${randomStr}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.apiKey,
        apiPwd: this.encryptApiPwd(randomStr),
      }),
    });
    if (!response.ok) {
      throw new Error(`MsgHub 인증 실패(${response.status}): ${await response.text()}`);
    }
    const result = (await response.json()) as MsgHubTokenResponse;
    const token = result.data?.token;
    if (!token) {
      throw new Error('MsgHub 인증 토큰을 받지 못했습니다.');
    }
    this.cachedToken = token;
    this.tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
    return token;
  }

  /** SMS(90바이트 이하)/LMS(초과) 발송 — phone은 하이픈 있어도/없어도 됨 */
  async sendSms(phone: string, message: string, title = ''): Promise<void> {
    const token = await this.getToken();
    const endpoint = Buffer.byteLength(message, 'utf8') > SMS_BYTE_LIMIT ? '/xms/mms/v1' : '/xms/sms/v1';
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        callback: this.callback,
        msg: message,
        title,
        recvInfoLst: [{ cliKey: this.newCliKey(), phone: phone.replace(/-/g, '') }],
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`SMS/LMS 발송 실패(${response.status}): ${text}`);
      throw new InternalServerErrorException('문자 발송에 실패했습니다.');
    }
  }

  /** 카카오 알림톡 발송 — 템플릿코드·치환데이터·버튼 구성은 호출하는 쪽 책임(2026-08-21 기준 등록된 템플릿 없음) */
  async sendAlimTalk(
    phone: string,
    templateCode: string,
    message: string,
    mergeData: Record<string, unknown> = {},
    buttons?: unknown,
  ): Promise<void> {
    const token = await this.getToken();
    const response = await fetch(`${this.apiUrl}/kko/alimtalk/v1.2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        callback: this.callback,
        kkoChId: this.kkoChId,
        tmpltCode: templateCode,
        msg: message,
        recvInfoLst: [{ cliKey: this.newCliKey(), phone: phone.replace(/-/g, ''), mergeData }],
        buttons: buttons ?? undefined,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`알림톡 발송 실패(${response.status}): ${text}`);
      throw new Error('알림톡 발송에 실패했습니다.');
    }
  }
}
