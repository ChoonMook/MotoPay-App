// 관리자웹 메인 쉘 - 사이드바+헤더+탭바+iframe MDI 컨테이너를 조립하고 탭 상태를 관리
// 원본 Site.Master의 openTab/syncIframes/closeTab/closeAllTabs 로직을 React state + sessionStorage로 이식
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdminAccount } from "../api/adminAuth";
import { clearTokens } from "../api/tokenStorage";
import { filterMenuGroups, type MenuLeaf } from "../lib/menuConfig";
import { clearTabStorage, loadActiveTab, loadTabs, saveTabState, DEFAULT_TAB, type AdminTab } from "../lib/tabStorage";
import Sidebar from "./Sidebar";
import Header from "./Header";
import TabBar from "./TabBar";
import ConfirmModal from "./ConfirmModal";
import MyInfoModal from "./MyInfoModal";

interface AdminShellProps {
  adminAccount: AdminAccount;
  onAdminAccountChange: (adminAccount: AdminAccount) => void;
  /** 로그인한 관리자의 권한그룹이 접근 가능한 메뉴 프로그램ID 집합 — null이면 전체 메뉴 노출(SUPER_ADMIN 등) */
  allowedMenuPgIds: Set<string> | null;
}

// 동시에 열 수 있는 최대 탭 수 — 너무 많은 iframe이 동시에 떠 있으면 메모리·성능 부담이 커져 제한
const MAX_TABS = 10;

export default function AdminShell({ adminAccount, onAdminAccountChange, allowedMenuPgIds }: AdminShellProps) {
  const navigate = useNavigate();

  const menuGroups = useMemo(() => filterMenuGroups(allowedMenuPgIds), [allowedMenuPgIds]);

  const [collapsed, setCollapsed] = useState(false);
  const [tabs, setTabs] = useState<AdminTab[]>(loadTabs);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const stored = loadActiveTab();
    return tabs.some((t) => t.path === stored) ? stored : DEFAULT_TAB.path;
  });
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMyInfoModal, setShowMyInfoModal] = useState(false);
  const [apiBusyCount, setApiBusyCount] = useState(0);
  const [tabLimitWarning, setTabLimitWarning] = useState(false);

  useEffect(() => {
    saveTabState(tabs, activeTab);
  }, [tabs, activeTab]);

  useEffect(() => {
    if (!tabLimitWarning) return;
    const t = setTimeout(() => setTabLimitWarning(false), 2600);
    return () => clearTimeout(t);
  }, [tabLimitWarning]);

  // window.openTab은 아래 useEffect가 마운트 시 1회만 등록하는 안정적인 함수라, 그 안에서 매 렌더마다 새로
  // 생성되는 openTab 클로저를 직접 참조하면 클로저가 마운트 시점의 tabs로 고정되어 버린다(탭 개수 제한 체크가
  // 항상 최초 상태 기준으로만 동작하는 원인). tabsRef로 항상 최신 tabs를 읽도록 우회한다.
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const openTab = (item: MenuLeaf | AdminTab) => {
    const current = tabsRef.current;
    const alreadyOpen = current.some((t) => t.path === item.path);
    if (!alreadyOpen && current.length >= MAX_TABS) {
      setTabLimitWarning(true);
      return;
    }
    setTabs((prev) => (prev.some((t) => t.path === item.path) ? prev : [...prev, { path: item.path, label: item.label }]));
    setActiveTab(item.path);
  };

  // iframe 안의 콘텐츠 페이지가 lib/parentBridge.ts의 openInParent()로 부모(이 창)의 탭을 열 수 있도록 노출
  // (원본 Site.Master의 window.parent.openTab(path, label) 패턴)
  useEffect(() => {
    window.openTab = (path, label) => openTab({ path, label });
    return () => {
      delete window.openTab;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // iframe 안의 콘텐츠 페이지가 api/http.ts를 통해 보내는 API 요청 시작/종료 신호를 받아 사이드바 로고
  // 회전 속도에 반영(lib/parentBridge.ts의 notifyApiBusyDelta와 짝) — 0 아래로 내려가지 않게 방어
  useEffect(() => {
    window.adjustApiBusyCount = (delta) => setApiBusyCount((prev) => Math.max(0, prev + delta));
    return () => {
      delete window.adjustApiBusyCount;
    };
  }, []);

  const closeTab = (path: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.path !== path);
      const nonEmpty = next.length > 0 ? next : [DEFAULT_TAB];
      if (activeTab === path) {
        setActiveTab(nonEmpty[nonEmpty.length - 1].path);
      }
      return nonEmpty;
    });
  };

  const clearAllTabs = () => {
    setTabs([DEFAULT_TAB]);
    setActiveTab(DEFAULT_TAB.path);
    setShowClearAllConfirm(false);
  };

  const doLogout = () => {
    clearTokens();
    clearTabStorage();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar collapsed={collapsed} activePath={activeTab} onNavigate={openTab} isBusy={apiBusyCount > 0} menuGroups={menuGroups} />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          username={adminAccount.name}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onEditProfile={() => setShowMyInfoModal(true)}
          onLogout={() => setShowLogoutConfirm(true)}
        />
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onActivate={setActiveTab}
          onClose={closeTab}
          onClearAll={() => setShowClearAllConfirm(true)}
          onReorder={setTabs}
        />

        <main className="relative flex-1 overflow-hidden bg-surface">
          {tabs.map((tab) => (
            <iframe
              key={tab.path}
              src={`${tab.path}?frame=Y`}
              title={tab.label}
              className="absolute inset-0 h-full w-full border-none"
              style={{ display: tab.path === activeTab ? "block" : "none" }}
            />
          ))}
        </main>
      </div>

      {showClearAllConfirm && (
        <ConfirmModal
          title="전체 탭 닫기"
          message="대시보드를 제외한 모든 탭을 닫으시겠습니까? 저장되지 않은 정보는 사라질 수 있습니다."
          onCancel={() => setShowClearAllConfirm(false)}
          onConfirm={clearAllTabs}
        />
      )}
      {showLogoutConfirm && (
        <ConfirmModal
          title="로그아웃"
          message="정말로 시스템에서 로그아웃 하시겠습니까?"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={doLogout}
        />
      )}
      {showMyInfoModal && (
        <MyInfoModal
          adminAccount={adminAccount}
          onCancel={() => setShowMyInfoModal(false)}
          onSaved={(updated) => {
            onAdminAccountChange(updated);
            setShowMyInfoModal(false);
          }}
        />
      )}

      {tabLimitWarning && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          탭은 최대 {MAX_TABS}개까지 열 수 있습니다. 사용하지 않는 탭을 닫고 다시 시도해주세요.
        </div>
      )}
    </div>
  );
}
