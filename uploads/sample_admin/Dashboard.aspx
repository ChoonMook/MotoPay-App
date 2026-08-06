<%@ Page Title="Dashboard" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Dashboard.aspx.cs" Inherits="partners_admin.Dashboard" %>

<asp:Content ID="BodyContent" ContentPlaceHolderID="MainContent" runat="server">
    <div class="h-full overflow-y-auto custom-scrollbar px-8 py-6 flex flex-col gap-6">
        <!-- 대시보드 헤더 및 새로고침 -->
        <div class="flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2 text-[11px] font-bold text-secondary uppercase tracking-widest">
                <span>HOME</span><i data-lucide="chevron-right" class="w-3.5 h-3.5 text-outline"></i><span>대시보드</span>
            </div>
            <div class="flex items-center gap-4">
                <span id="last-update-time" class="text-[11px] font-bold text-secondary font-mono">마지막 업데이트: -</span>
                <button type="button" onclick="loadDashboardData()" class="flex items-center gap-2 px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-secondary hover:bg-surface-container transition-all shadow-sm group">
                    <i data-lucide="refresh-cw" id="refresh-icon" class="w-3.5 h-3.5 transition-transform duration-700"></i>
                    <span class="text-[11px] font-bold">새로고침</span>
                </button>
            </div>
        </div>

        <!-- 상단 요약 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center">
                <div class="mb-3">
                    <img src="/Content/images/benz.png" alt="BENZ" class="w-12 h-12 object-contain" />
                </div>
                <p class="text-[11px] font-bold text-secondary mb-1 uppercase">누적 시공 요청 (BENZ)</p>
                <h4 id="total-benz-count" class="text-2xl font-black text-on-surface tracking-tight">0</h4>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center">
                <div class="mb-3">
                    <img src="/Content/images/byd.png" alt="BYD" class="w-12 h-12 object-contain" />
                </div>
                <p class="text-[11px] font-bold text-secondary mb-1 uppercase">누적 시공 요청 (BYD)</p>
                <h4 id="total-byd-count" class="text-2xl font-black text-on-surface tracking-tight">0</h4>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center">
                <div class="mb-3">
                    <img src="/Content/images/benz.png" alt="BENZ" class="w-10 h-10 object-contain grayscale opacity-30" />
                </div>
                <p class="text-[11px] font-bold text-secondary mb-1 uppercase">금일 신규 요청 (BENZ)</p>
                <h4 id="today-benz-count" class="text-2xl font-black text-on-surface tracking-tight">0</h4>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center">
                <div class="mb-3">
                    <img src="/Content/images/byd.png" alt="BYD" class="w-10 h-10 object-contain grayscale opacity-30" />
                </div>
                <p class="text-[11px] font-bold text-secondary mb-1 uppercase">금일 신규 요청 (BYD)</p>
                <h4 id="today-byd-count" class="text-2xl font-black text-on-surface tracking-tight">0</h4>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <!-- 차량브랜드별 비교 차트 -->
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="font-bold text-on-surface flex items-center gap-2 text-sm">
                        <i data-lucide="line-chart" class="w-4 h-4 text-primary"></i>차량브랜드별 비교 차트
                    </h3>
                    <div class="flex items-center gap-4 text-[10px] font-bold">
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span class="text-on-surface">BENZ</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span class="text-on-surface">BYD</span></div>
                    </div>
                </div>
                <div class="h-[300px] w-full relative">
                    <canvas id="brand-comparison-chart"></canvas>
                </div>
            </div>

            <!-- 최근 시공 요청 -->
            <div class="bg-white rounded-xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                <div class="px-6 py-5 border-b border-outline-variant/30 bg-surface-container-lowest">
                    <h3 class="font-bold text-on-surface flex items-center gap-2 text-sm">
                        <i data-lucide="list-checks" class="w-4 h-4 text-secondary"></i>최근 시공 요청
                    </h3>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <div id="recent-requests-container" class="space-y-2">
                        <!-- 동적 생성 -->
                        <div class="flex flex-col items-center justify-center py-12 text-outline">
                            <i data-lucide="inbox" class="w-8 h-8 mb-2 opacity-20"></i>
                            <p class="text-xs">데이터를 불러오는 중...</p>
                        </div>
                    </div>
                </div>
                <div class="px-6 py-3 bg-surface-container-low border-t border-outline-variant/30">
                    <button type="button" onclick="window.parent.openTab('/Install/InstallReq.aspx', '시공요청서관리')" class="w-full text-center text-[11px] font-bold text-primary hover:underline font-mono uppercase tracking-widest">전체 보기 <i data-lucide="chevron-right" class="w-3.5 h-3.5 inline-block ml-1"></i></button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        $(function () {
            loadDashboardData();
        });

        function callAjax(methodName, parameters, callback) {
            $.ajax({
                type: "POST",
                url: "Dashboard.aspx/" + methodName,
                data: JSON.stringify(parameters),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: false,
                success: function (response) {
                    if (callback && response && response.hasOwnProperty('d')) {
                        callback(response.d);
                    }
                },
                error: function (xhr, status, error) {
                    console.error("AJAX Error [" + methodName + "]:", error);
                }
            });
        }

        let isDataLoading = false;
        function loadDashboardData() {
            if (isDataLoading) return;
            isDataLoading = true;

            // 로딩 상태 표시 (아이콘 회전 및 시간 표시 준비)
            const $refreshIcon = $('#refresh-icon');
            $refreshIcon.addClass('rotate-180');
            
            callAjax('GetDashboardData', {}, function (response) {
                isDataLoading = false;
                $refreshIcon.removeClass('rotate-180');

                // 마지막 업데이트 시간 설정
                const now = new Date();
                const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                               now.getMinutes().toString().padStart(2, '0') + ':' + 
                               now.getSeconds().toString().padStart(2, '0');
                $('#last-update-time').text('마지막 업데이트: ' + timeStr);

                if (!response) return;

                if (response.Error) {
                    console.error("Dashboard Data Server Error:", response.Error);
                    return;
                }
                
                const data = response;
                const summary = data.Summary || {};
                
                // 요약 데이터 업데이트
                $('#total-benz-count').text((summary.total_benz_count || 0).toLocaleString());
                $('#total-byd-count').text((summary.total_byd_count || 0).toLocaleString());
                $('#today-benz-count').text((summary.today_benz_count || 0).toLocaleString());
                $('#today-byd-count').text((summary.today_byd_count || 0).toLocaleString());

                // 차트 렌더링
                if (data.ChartData) renderChart(data.ChartData);

                // 최근 요청 목록 업데이트
                if (data.RecentRequests) renderRecentRequests(data.RecentRequests);
            });
        }

        function renderChart(chartData) {
            const ctx = document.getElementById('brand-comparison-chart').getContext('2d');
            
            const labels = chartData.map(d => d.work_date);
            const benzData = chartData.map(d => d.benz_count);
            const bydData = chartData.map(d => d.byd_count);

            if (window.myChart) window.myChart.destroy();

            window.myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'BENZ',
                            data: benzData,
                            borderColor: '#3b7ddd',
                            backgroundColor: 'rgba(59, 125, 221, 0.05)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: chartData.length > 10 ? 0 : 4,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#fff',
                            pointBorderWidth: 2
                        },
                        {
                            label: 'BYD',
                            data: bydData,
                            borderColor: '#1cbb8c',
                            backgroundColor: 'rgba(28, 187, 140, 0.05)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: chartData.length > 10 ? 0 : 4,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#fff',
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f1f3f5' },
                            ticks: { font: { size: 10, weight: 'bold' }, color: '#adb5bd' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { 
                                font: { size: 10, weight: 'bold' }, 
                                color: '#adb5bd',
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        }
                    }
                }
            });
        }

        function renderRecentRequests(list) {
            const $container = $('#recent-requests-container');
            $container.empty();

            if (!list || list.length === 0) {
                $container.html('<div class="py-10 text-center text-xs text-outline font-medium">최근 요청 내역이 없습니다.</div>');
                return;
            }

            list.forEach(item => {
                const isBenz = item.car_brand_class === 'BENZ';
                const logoImg = isBenz ? 'benz.png' : 'byd.png';

                const html = `
                    <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer border border-transparent hover:border-outline-variant/30 group" 
                         onclick="window.parent.openTab('/Install/InstallReq.aspx', '시공요청서관리')">
                        <div class="w-10 h-10 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                            <img src="/Content/images/${logoImg}" alt="${item.car_brand_class}" class="w-full h-full object-contain" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center justify-between mb-0.5">
                                <span class="text-sm font-bold text-on-surface truncate">${item.car_class_nm || item.car_class || '-'}</span>
                                <span class="text-[11px] font-bold text-secondary">${formatDate(item.regist_dt)}</span>
                            </div>
                            <div class="flex items-center gap-2 text-[11px] font-bold text-secondary">
                                <span>${item.dealer_class_nm || '-'}</span>
                                <span class="w-0.5 h-0.5 rounded-full bg-outline-variant"></span>
                                <span>${item.regist_nm || '-'}</span>
                                <span class="w-0.5 h-0.5 rounded-full bg-outline-variant"></span>
                                <span class="text-primary">${item.work_agency_class_nm || '-'}</span>
                            </div>
                        </div>
                    </div>
                `;
                $container.append(html);
            });
            lucide.createIcons();
        }

        function formatDate(dtStr) {
            if (!dtStr) return '-';
            const date = new Date(parseInt(dtStr.replace('/Date(', '').replace(')/', '')));
            const now = new Date();
            const diffMs = now - date;
            const diffMin = Math.floor(diffMs / 60000);
            
            if (diffMin < 1) return '방금 전';
            if (diffMin < 60) return diffMin + '분 전';
            if (diffMin < 1440) return Math.floor(diffMin / 60) + '시간 전';
            return (date.getMonth() + 1) + '/' + date.getDate();
        }
    </script>
</asp:Content>
