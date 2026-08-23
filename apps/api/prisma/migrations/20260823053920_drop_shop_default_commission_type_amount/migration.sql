-- AlterTable
-- 업체 기본 정산값은 정률만 사용(2026-08-23 확정) — 정액은 상품마다 가격대가 달라 업체 단위 기본값으로는
-- 의미가 없고, 필요하면 AD-STL-02에서 구성상품×업체 예외로 등록. 기존 데이터는 전부 defaultCommissionType='RATE'
-- 였고 defaultCommissionAmount는 전부 NULL이었음(FIXED로 설정된 업체 없음, 삭제 전 확인 완료)
ALTER TABLE `shops` DROP COLUMN `defaultCommissionAmount`,
    DROP COLUMN `defaultCommissionType`;
