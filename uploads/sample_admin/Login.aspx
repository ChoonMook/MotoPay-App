<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Login.aspx.cs" Inherits="partners_admin.Login" %>

<!DOCTYPE html>
<html lang="ko">
<head runat="server">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>로그인 - 파트너스지원시스템</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <script>
        // Iframe 내부에서 로그인 페이지가 호출된 경우 부모 창을 로그인 페이지로 이동
        if (self !== top) {
            top.location.href = self.location.href;
        }

        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Malgun Gothic', '맑은 고딕', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
                    colors: { primary: '#3b7ddd', secondary: '#222e3c', 'on-surface-variant': '#6c757d', outline: '#adb5bd', 'outline-variant': '#dee2e6' }
                }
            }
        };
    </script>
    <style>
        body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; background: #f5f7fb; color: #495057; -webkit-font-smoothing: antialiased; }
        .form-checkbox { width: 1rem; height: 1rem; color: #3b7ddd; border-color: #ced4da; border-radius: 0.25rem; cursor: pointer; }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <div class="flex h-screen bg-[#f5f7fb] items-center justify-center p-4">
            <div class="w-full max-w-sm">
                <div class="text-center mb-8">
                    <img src="/Content/images/metaonce.svg" alt="MetaOnce Logo" class="h-12 mx-auto mb-4" />
                    <h1 class="text-2xl font-bold text-secondary mb-1">파트너스지원시스템</h1>
                    <p class="text-xs text-on-surface-variant font-medium">프리미엄 자동차 라이프의 시작</p>
                </div>
                <div class="bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-10">
                    <div class="flex flex-col gap-5">
                        <div class="space-y-2">
                            <label class="text-[11px] font-bold text-secondary uppercase tracking-widest ml-1">사용자 ID</label>
                            <div class="relative group">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"><i data-lucide="user" class="w-4 h-4"></i></span>
                                <asp:TextBox ID="txtUserId" runat="server" placeholder="아이디를 입력하세요" CssClass="w-full bg-white border border-[#ced4da] rounded-lg pl-11 pr-4 py-2.5 text-xs font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"></asp:TextBox>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center px-1">
                                <label class="text-[11px] font-bold text-secondary uppercase tracking-widest">비밀번호</label>
                            </div>
                            <div class="relative group">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"><i data-lucide="lock" class="w-4 h-4"></i></span>
                                <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" placeholder="비밀번호를 입력하세요" CssClass="w-full bg-white border border-[#ced4da] rounded-lg pl-11 pr-12 py-2.5 text-xs font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"></asp:TextBox>
                                <button type="button" onclick="togglePasswordVisibility()" class="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-secondary transition-colors outline-none focus:outline-none">
                                    <i data-lucide="eye" id="eye-icon" class="w-4 h-4"></i>
                                    <i data-lucide="eye-off" id="eye-off-icon" class="w-4 h-4 hidden"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 아이디 기억하기 -->
                        <div class="flex items-center justify-between px-1 mt-1">
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" id="chkRememberId" class="form-checkbox" />
                                <span class="text-[11px] text-on-surface-variant font-medium group-hover:text-primary transition-colors">내 아이디 기억하기</span>
                            </label>
                            <a href="#" class="text-[10px] text-primary font-bold hover:underline">비밀번호 찾기</a>
                        </div>

                        <asp:Button ID="btnLogin" runat="server" Text="로그인" OnClick="btnLogin_Click" OnClientClick="fnSaveId();" CssClass="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-xs cursor-pointer mt-2" />
                        
                        <!-- 에러 메시지 표시 영역 (login_err.png 스타일) -->
                        <asp:Panel ID="pnlMessage" runat="server" Visible="false" CssClass="flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-lg py-2.5 mt-2 transition-all">
                            <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 shrink-0"></i>
                            <asp:Label ID="lblMessage" runat="server" CssClass="text-[11px] text-red-600 font-semibold"></asp:Label>
                        </asp:Panel>
                    </div>
                </div>
                <div class="text-center mt-8">
                    <p class="text-[10px] font-bold text-outline uppercase tracking-tighter">Copyright ⓒ 2026 MetaOnce. All rights reserved.</p>
                </div>
            </div>
        </div>
    </form>
    <script>
        lucide.createIcons();

        window.onload = function() {
            const savedId = localStorage.getItem('savedPartnersId');
            if (savedId) {
                const txtUserId = document.getElementById('<%= txtUserId.ClientID %>');
                if (txtUserId) txtUserId.value = savedId;
                document.getElementById('chkRememberId').checked = true;
            }
        };

        function fnSaveId() {
            const userId = document.getElementById('<%= txtUserId.ClientID %>').value;
            const isRemember = document.getElementById('chkRememberId').checked;
            if (isRemember) {
                localStorage.setItem('savedPartnersId', userId);
            } else {
                localStorage.removeItem('savedPartnersId');
            }
        }

        function togglePasswordVisibility() {
            const pwdInput = document.getElementById('<%= txtPassword.ClientID %>');
            const eyeIcon = document.getElementById('eye-icon');
            const eyeOffIcon = document.getElementById('eye-off-icon');

            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            } else {
                pwdInput.type = 'password';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            }
        }
    </script>
</body>
</html>
