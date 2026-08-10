// 업체 서류(사업자등록증/통장사본)의 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/company-documents/<uuid>.<ext>에 저장
import { deleteDocument, saveDocument } from './document-storage';

const COMPANY_DOCUMENT_SUBDIR = 'company-documents';
const MAX_COMPANY_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB — 스캔 PDF 다장 문서 고려

export function saveCompanyDocument(dataUri: string): Promise<string> {
  return saveDocument(dataUri, COMPANY_DOCUMENT_SUBDIR, MAX_COMPANY_DOCUMENT_BYTES);
}

/** 교체·삭제 시 이전 물리 파일 정리 — 이미 없어도(ENOENT) 무시 */
export function deleteCompanyDocument(relativePath: string): Promise<void> {
  return deleteDocument(relativePath);
}
