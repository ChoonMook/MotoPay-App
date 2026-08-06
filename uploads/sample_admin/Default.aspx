<%@ Page Title="Dashboard" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="partners_admin._Default" %>

<asp:Content ID="BodyContent" ContentPlaceHolderID="MainContent" runat="server">
    <div class="h-full overflow-y-auto custom-scrollbar pr-1 pb-4">
        <%-- 상단 요약 카드 --%>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30">
                <div class="flex justify-between items-start mb-3">
                    <div class="p-2 bg-surface-container rounded-lg text-blue-500">
                        <i data-lucide="clipboard-list" class="w-5 h-5"></i>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">+128 (금월)</span>
                </div>
                <p class="text-[11px] font-bold text-outline mb-1 uppercase">누적 시공 요청</p>
                <h4 class="text-2xl font-black text-on-surface tracking-tight">2,482</h4>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30">
                <div class="flex justify-between items-start mb-3">
                    <div class="p-2 bg-surface-container rounded-lg text-amber-500">
                        <i data-lucide="clock" class="w-5 h-5"></i>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">+24 (전일대비)</span>
                </div>
                <p class="text-[11px] font-bold text-outline mb-1 uppercase">금일 신규 요청</p>
                <h4 class="text-2xl font-black text-on-surface tracking-tight">24</h4>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30">
                <div class="flex justify-between items-start mb-3">
                    <div class="p-2 bg-surface-container rounded-lg text-red-500">
                        <i data-lucide="alert-circle" class="w-5 h-5"></i>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">-2 (대기중)</span>
                </div>
                <p class="text-[11px] font-bold text-outline mb-1 uppercase">시공 대기/중</p>
                <h4 class="text-2xl font-black text-on-surface tracking-tight">42</h4>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30">
                <div class="flex justify-between items-start mb-3">
                    <div class="p-2 bg-surface-container rounded-lg text-emerald-500">
                        <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">+0.5% (전주대비)</span>
                </div>
                <p class="text-[11px] font-bold text-outline mb-1 uppercase">시공 완료율</p>
                <h4 class="text-2xl font-black text-on-surface tracking-tight">96.4%</h4>
            </div>
        </div>

        <%-- 하단 컨텐츠 영역 --%>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <%-- 브랜드별 현황 --%>
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
                <h3 class="font-bold text-on-surface mb-5 flex items-center gap-2 text-sm">
                    <i data-lucide="store" class="w-4 h-4 text-secondary"></i>브랜드별 시공 요청 현황
                </h3>
                <div class="flex flex-col gap-5">
                    <div class="space-y-1">
                        <div class="flex justify-between items-end">
                            <span class="text-xs font-bold text-on-surface">현대자동차</span>
                            <span class="text-sm font-black text-primary">1,050 <span class="text-[10px] font-bold text-outline">reqs</span></span>
                        </div>
                        <div class="h-3 bg-surface-container rounded-full overflow-hidden">
                            <div class="h-full bg-blue-600 rounded-r-full" style="width: 85%"></div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between items-end">
                            <span class="text-xs font-bold text-on-surface">제네시스</span>
                            <span class="text-sm font-black text-primary">840 <span class="text-[10px] font-bold text-outline">reqs</span></span>
                        </div>
                        <div class="h-3 bg-surface-container rounded-full overflow-hidden">
                            <div class="h-full bg-slate-800 rounded-r-full" style="width: 70%"></div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between items-end">
                            <span class="text-xs font-bold text-on-surface">기아자동차</span>
                            <span class="text-sm font-black text-primary">592 <span class="text-[10px] font-bold text-outline">reqs</span></span>
                        </div>
                        <div class="h-3 bg-surface-container rounded-full overflow-hidden">
                            <div class="h-full bg-red-600 rounded-r-full" style="width: 50%"></div>
                        </div>
                    </div>
                </div>
                <div class="mt-5 pt-4 border-t border-outline-variant/10 flex justify-between text-[10px] text-outline font-bold">
                    <span>단위: 건 (최근 6개월)</span>
                    <span>최종 업데이트: 2026-04-24 13:00</span>
                </div>
            </div>

            <%-- 최근 활동 --%>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
                <h3 class="font-bold text-on-surface mb-5 flex items-center gap-2 text-sm">
                    <i data-lucide="message-square" class="w-4 h-4 text-secondary"></i>최근 시공 활동
                </h3>
                <div class="space-y-3 overflow-y-auto pr-1 custom-scrollbar" style="max-height: 300px;">
                    <div class="flex items-start gap-3 py-2 hover:bg-surface-container-low px-2 rounded-xl transition-colors cursor-pointer">
                        <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                            <i data-lucide="user" class="w-3.5 h-3.5 text-secondary"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-on-surface truncate">시공 요청 완료</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-[11px] text-outline">서초전시장 (G80)</span>
                                <span class="text-[10px] text-outline/50">• 5분 전</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3 py-2 hover:bg-surface-container-low px-2 rounded-xl transition-colors cursor-pointer">
                        <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                            <i data-lucide="user" class="w-3.5 h-3.5 text-secondary"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-on-surface truncate">시공 중 전환</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-[11px] text-outline">강남시공점 (그랜저)</span>
                                <span class="text-[10px] text-outline/50">• 15분 전</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3 py-2 hover:bg-surface-container-low px-2 rounded-xl transition-colors cursor-pointer">
                        <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                            <i data-lucide="user" class="w-3.5 h-3.5 text-secondary"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-on-surface truncate">시공 완료 승인</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-[11px] text-outline">송파시공점 (GV70)</span>
                                <span class="text-[10px] text-outline/50">• 1시간 전</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</asp:Content>
