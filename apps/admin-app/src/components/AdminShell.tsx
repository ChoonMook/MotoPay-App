// 관리자웹 메인 쉘 - 사이드바+헤더+탭바+iframe MDI 컨테이너를 조립하고 탭 상태를 관리
// 원본 Site.Master의 openTab/syncIframes/closeTab/closeAllTabs 로직을 React state + sessionStorage로 이식
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MenuLeaf } from "../lib/menuConfig";
import { getSession, logout as mockLogout } from "../lib/mockAuth";
import { clearTabStorage, loadActiveTab, loadTabs, saveTabState, DEFAULT_TAB, type AdminTab } from "../lib/tabStorage";
import Sidebar from "./Sidebar";
import Header from "./Header";
import TabBar from "./TabBar";
import ConfirmModal from "./ConfirmModal";

export default function AdminShell() {
  const navigate = useNavigate();
  const session = getSession();

  const [collapsed, setCollapsed] = useState(false);
  const [tabs, setTabs] = useState<AdminTab[]>(loadTabs);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const stored = loadActiveTab();
    return tabs.some((t) => t.path === stored) ? stored : DEFAULT_TAB.path;
  });
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    saveTabState(tabs, activeTab);
  }, [tabs, activeTab]);

  const openTab = (item: MenuLeaf | AdminTab) => {
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
    mockLogout();
    clearTabStorage();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar collapsed={collapsed} activePath={activeTab} onNavigate={openTab} />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Header username={session?.username ?? "관리자"} onToggleSidebar={() => setCollapsed((v) => !v)} onLogout={() => setShowLogoutConfirm(true)} />
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
    </div>
  );
}
