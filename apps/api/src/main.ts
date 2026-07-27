import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { UPLOADS_ROOT } from './common/storage/profile-image-storage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // apps/customer-app/apps/partner-app(별도 origin)에서 fetch로 호출할 수 있도록 허용.
  // CORS_ORIGINS(쉼표구분)를 지정하면 그 목록으로 제한하고, 미지정 시(로컬 개발 기본값) 전체 허용.
  const corsOrigins = process.env.CORS_ORIGINS?.trim();
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map((o) => o.trim())
    : undefined;
  app.enableCors(allowedOrigins ? { origin: allowedOrigins } : undefined);

  // 프로필 사진 등 업로드된 파일을 /uploads/<relativePath>로 정적 서빙
  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads/' });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('MotoPay API')
    .setDescription('MotoPay 백엔드 API 문서')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // customer-app(8090)/partner-app(8091)과 별도 origin(8092)으로 직접 노출 — 외부에서 접근 가능하도록 바인딩
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
