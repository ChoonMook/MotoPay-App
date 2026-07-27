// CU-NCPK-02: 보유 패키지 확인 - 차량정보 + 시공 항목(전 항목 기본 시공) + 항목별 업그레이드 옵션
import type { ComponentType } from "react";
import Button from "../../components/ui/Button";
import carImg from "../../assets/images/car.png";
import NcpHeader from "./NcpHeader";
import { ChevronDownIcon, TintIcon, BlackboxIcon, UndercoatIcon, CoatingIcon } from "./ncpIcons";
import { nfmt } from "./ncpFormat";

// prodCat(CommonCodeDetail code='PROD_CAT') -> 아이콘. 매핑 없는 분류는 UndercoatIcon을 범용 아이콘으로 사용
const CAT_ICONS: Record<string, ComponentType<{ color?: string }>> = {
  TINT: TintIcon,
  BBOX: BlackboxIcon,
  COAT: CoatingIcon,
};

export interface PkgBaseOption {
  code: string; // 구성상품코드 -> Product.productCode
  name: string;
}

export interface PkgUpgradeOption {
  code: string; // 구성상품코드 -> Product.productCode
  name: string;
  price: number;
}

// 패키지 구성상품을 상품분류(prodCat)별로 묶은 뷰 — 기본상품(basicItems, 무상·복수 가능)과
// 업그레이드옵션(optionItems, 같은 분류 내 유상 대체) 후보 목록
export interface PkgGroup {
  prodCat: string;
  name: string; // 상품분류명(PROD_CAT 공통코드명, 예: "썬팅")
  baseOptions: PkgBaseOption[];
  upgradeOptions: PkgUpgradeOption[];
}

interface MyPkgCfmScreenProps {
  onBack: () => void;
  onComplete: () => void;
  onOpenTint: () => void;
  carLabel: string;
  carVin: string | null;
  tintConcLabel: string;
  canComplete: boolean; // false면 썬팅 농도 미선택 등으로 다음 단계 진행 불가
  pkgGroups: PkgGroup[];
  pkgSel: Record<string, string>; // prodCat -> 현재 선택된 구성상품코드(기본/업그레이드 통틀어)
  pkgDropOpen: string | null; // 열려있는 드롭다운 박스의 고유 key
  onToggleDrop: (boxKey: string) => void;
  onSelectItem: (prodCat: string, code: string) => void;
  onToast: (msg: string) => void;
}

export default function MyPkgCfmScreen({
  onBack,
  onComplete,
  onOpenTint,
  carLabel,
  carVin,
  tintConcLabel,
  canComplete,
  pkgGroups,
  pkgSel,
  pkgDropOpen,
  onToggleDrop,
  onSelectItem,
  onToast,
}: MyPkgCfmScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <NcpHeader title="보유 패키지 확인" onBack={onBack} step={0} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="flex items-center gap-3 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
          <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            <img src={carImg} alt="차량" className="w-[42px]" />
          </span>
          <div className="flex-1">
            <div className="text-[15px] font-extrabold text-gray-900">{carLabel}</div>
            <div className="mt-0.5 text-xs text-gray-500 tabular-nums">{carVin ? `VIN · ${carVin}` : "VIN 정보 없음"}</div>
          </div>
        </div>

        <div className="mx-0.5 mt-4 mb-2.5 flex items-center gap-1.5">
          <span className="text-sm font-extrabold text-gray-900">시공 항목</span>
          <span className="rounded-md bg-brand-subtle px-[7px] py-0.5 text-[10.5px] font-bold text-brand">
            전 항목 기본 시공
          </span>
        </div>

        {pkgGroups.length === 0 ? (
          <div className="mt-2 rounded-[14px] border border-dashed border-gray-300 bg-white p-6 text-center text-[13px] text-gray-500">
            매핑된 시공 패키지가 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pkgGroups.map((g) => {
              const Icon = CAT_ICONS[g.prodCat] ?? UndercoatIcon;
              const isTint = g.prodCat === "TINT";
              const selCode = pkgSel[g.prodCat] ?? g.baseOptions[0]?.code ?? null;
              const selBase = g.baseOptions.find((b) => b.code === selCode);
              const selUpgrade = g.upgradeOptions.find((o) => o.code === selCode);
              const hasUpgradeOptions = g.upgradeOptions.length > 0;
              const hasMultiBase = g.baseOptions.length > 1;
              const hasDropdown = isTint || hasUpgradeOptions || hasMultiBase;
              const subLabel = selBase?.name ?? selUpgrade?.name ?? g.baseOptions[0]?.name ?? "-";

              return (
                <div
                  key={g.prodCat}
                  onClick={hasDropdown ? undefined : () => onToast(`${g.name} · 기본 시공 항목`)}
                  className={`rounded-[14px] border border-gray-200 bg-white p-4 ${hasDropdown ? "" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-brand-subtle text-brand">
                      <Icon />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">{g.name}</div>
                      <div className="mt-px text-[11.5px] text-gray-500">{subLabel}</div>
                    </div>
                    <span className="flex-none rounded-md bg-status-success-bg px-2 py-[3px] text-[10px] font-extrabold text-green-600">
                      기본 시공
                    </span>
                  </div>

                  {isTint && (
                    <>
                      <div
                        onClick={onOpenTint}
                        className="mt-[11px] flex cursor-pointer items-center justify-between rounded-[10px] bg-gray-100 px-3 py-[9px]"
                      >
                        <span className="text-[12.5px] font-semibold text-gray-800">{tintConcLabel}</span>
                        <span className="text-xs font-bold text-brand">농도 선택 ›</span>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1.5 text-[11px] text-gray-500">
                          기본 품목 <span className="font-bold text-green-600">· 기본 시공 포함</span>
                        </div>
                        <div
                          onClick={() => onToggleDrop(`${g.prodCat}:base`)}
                          className="flex cursor-pointer items-center justify-between rounded-[10px] border border-gray-400 bg-white px-3 py-[11px]"
                        >
                          <span className={`text-[13px] font-semibold ${selBase ? "text-gray-800" : "text-gray-500"}`}>
                            {selBase ? selBase.name : "선택 안함"}
                          </span>
                          <ChevronDownIcon />
                        </div>
                        {pkgDropOpen === `${g.prodCat}:base` && (
                          <div className="mt-1.5 rounded-[10px] border border-gray-200 bg-white p-1 shadow-sm">
                            {g.baseOptions.map((b) => {
                              const sel = selCode === b.code;
                              return (
                                <div
                                  key={b.code}
                                  onClick={() => onSelectItem(g.prodCat, b.code)}
                                  className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-3 py-[11px] ${
                                    sel ? "bg-brand-subtle" : ""
                                  }`}
                                >
                                  <span className={`text-[13px] ${sel ? "font-bold text-brand" : "font-semibold text-gray-800"}`}>
                                    {b.name}
                                  </span>
                                  <span className="w-4 text-center text-xs font-extrabold text-brand">{sel ? "✓" : ""}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {hasUpgradeOptions && (
                        <div className="mt-3">
                          <div className="mb-1.5 text-[11px] text-gray-500">고객부담 품목 · 선택 시 추가 결제</div>
                          <div
                            onClick={() => onToggleDrop(`${g.prodCat}:paid`)}
                            className="flex cursor-pointer items-center justify-between rounded-[10px] border border-gray-400 bg-white px-3 py-[11px]"
                          >
                            <span className={`text-[13px] font-semibold ${selUpgrade ? "text-gray-800" : "text-gray-500"}`}>
                              {selUpgrade ? `${selUpgrade.name} (+${nfmt(selUpgrade.price)}원)` : "없음"}
                            </span>
                            <ChevronDownIcon />
                          </div>
                          {pkgDropOpen === `${g.prodCat}:paid` && (
                            <div className="mt-1.5 rounded-[10px] border border-gray-200 bg-white p-1 shadow-sm">
                              {g.upgradeOptions.map((o) => {
                                const sel = selCode === o.code;
                                return (
                                  <div
                                    key={o.code}
                                    onClick={() => onSelectItem(g.prodCat, o.code)}
                                    className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-3 py-[11px] ${
                                      sel ? "bg-brand-subtle" : ""
                                    }`}
                                  >
                                    <span className={`text-[13px] ${sel ? "font-bold text-brand" : "font-semibold text-gray-800"}`}>
                                      {o.name}
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <span className="text-xs font-bold tabular-nums text-gray-900">{`+${nfmt(o.price)}원`}</span>
                                      <span className="w-4 text-center text-xs font-extrabold text-brand">{sel ? "✓" : ""}</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {!isTint && (hasUpgradeOptions || hasMultiBase) && (
                    <div className="mt-3">
                      <div className="mb-1.5 text-[11px] text-gray-500">업그레이드 옵션 · 선택 시 추가 결제</div>
                      <div
                        onClick={() => onToggleDrop(g.prodCat)}
                        className="flex cursor-pointer items-center justify-between rounded-[10px] border border-gray-400 bg-white px-3 py-[11px]"
                      >
                        <span className={`text-[13px] font-semibold ${selUpgrade ? "text-gray-800" : "text-gray-500"}`}>
                          {selUpgrade ? `${selUpgrade.name} (+${nfmt(selUpgrade.price)}원)` : `${subLabel} (기본 포함)`}
                        </span>
                        <ChevronDownIcon />
                      </div>
                      {pkgDropOpen === g.prodCat && (
                        <div className="mt-1.5 rounded-[10px] border border-gray-200 bg-white p-1 shadow-sm">
                          {g.baseOptions.map((b) => {
                            const sel = selCode === b.code;
                            return (
                              <div
                                key={b.code}
                                onClick={() => onSelectItem(g.prodCat, b.code)}
                                className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-3 py-[11px] ${
                                  sel ? "bg-brand-subtle" : ""
                                }`}
                              >
                                <span className={`text-[13px] ${sel ? "font-bold text-brand" : "font-semibold text-gray-800"}`}>
                                  {b.name} (기본)
                                </span>
                                <span className="w-4 text-center text-xs font-extrabold text-brand">{sel ? "✓" : ""}</span>
                              </div>
                            );
                          })}
                          {g.upgradeOptions.map((o) => {
                            const sel = selCode === o.code;
                            return (
                              <div
                                key={o.code}
                                onClick={() => onSelectItem(g.prodCat, o.code)}
                                className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-3 py-[11px] ${
                                  sel ? "bg-brand-subtle" : ""
                                }`}
                              >
                                <span className={`text-[13px] ${sel ? "font-bold text-brand" : "font-semibold text-gray-800"}`}>
                                  {o.name}
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="text-xs font-bold tabular-nums text-gray-900">{`+${nfmt(o.price)}원`}</span>
                                  <span className="w-4 text-center text-xs font-extrabold text-brand">{sel ? "✓" : ""}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!canComplete} onClick={onComplete}>
          선택 완료
        </Button>
      </div>
    </div>
  );
}
