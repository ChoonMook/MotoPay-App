// apps/api의 관리자웹 범용 업로드 엔드포인트(/admin/uploads/*) 호출 — RichTextEditor 본문 삽입 이미지 전용
import { authedRequest } from "./http";

export function uploadContentImage(imageBase64: string): Promise<{ path: string }> {
  return authedRequest<{ path: string }>("/admin/uploads/content-image", {
    method: "POST",
    body: JSON.stringify({ imageBase64 }),
  });
}
