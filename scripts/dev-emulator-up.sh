#!/usr/bin/env bash
# 로컬 Android 에뮬레이터 개발 환경을 초기 상태에서 한 번에 띄우는 스크립트
# (에뮬레이터 실행 -> Metro/customer-app/partner-app/api 기동 -> adb reverse 포트 포워딩)
# 사용법: ./scripts/dev-emulator-up.sh [AVD이름]
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
AVD_NAME="${1:-${AVD_NAME:-Pixel_7}}"
LOG_DIR="/tmp/motopay-dev-logs"
mkdir -p "$LOG_DIR"

ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"

if [ ! -x "$ADB" ]; then
  echo "adb를 찾을 수 없습니다: $ADB (ANDROID_HOME 확인 필요)"
  exit 1
fi

echo "== 1. 에뮬레이터 확인/실행 =="
if "$ADB" devices | grep -q "^emulator-.*device$"; then
  echo "  이미 실행 중"
else
  if ! "$EMULATOR" -list-avds | grep -qx "$AVD_NAME"; then
    echo "  AVD '$AVD_NAME'를 찾을 수 없습니다. 사용 가능한 목록:"
    "$EMULATOR" -list-avds
    exit 1
  fi
  echo "  '$AVD_NAME' 실행..."
  nohup "$EMULATOR" -avd "$AVD_NAME" > "$LOG_DIR/emulator.log" 2>&1 &
  disown
  echo "  부팅 대기 중..."
  "$ADB" wait-for-device
  until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
  done
  echo "  부팅 완료"
fi

# $1=이름 $2=헬스체크 URL $3=작업 디렉터리 $4=실행 명령 $5=로그 파일
start_if_down() {
  local name="$1" url="$2" dir="$3" cmd="$4" logfile="$5"
  if curl -s -o /dev/null --max-time 2 "$url"; then
    echo "  $name 이미 실행 중"
  else
    echo "  $name 시작..."
    (
      cd "$dir" || exit 1
      nohup $cmd > "$logfile" 2>&1 &
      disown
    )
  fi
}

echo "== 2. 개발 서버 기동 =="
start_if_down "Metro(8081)" "http://localhost:8081/status" \
  "$REPO_ROOT/apps/customer-mobile" "npx expo start" "$LOG_DIR/metro.log"
start_if_down "customer-app(5173)" "http://localhost:5173/" \
  "$REPO_ROOT/apps/customer-app" "npx vite --port 5173" "$LOG_DIR/customer-app.log"
start_if_down "partner-app(5174)" "http://localhost:5174/" \
  "$REPO_ROOT/apps/partner-app" "npx vite --port 5174" "$LOG_DIR/partner-app.log"
start_if_down "api(3000)" "http://localhost:3000/api-docs" \
  "$REPO_ROOT/apps/api" "npm run start:dev" "$LOG_DIR/api.log"

wait_for() {
  local name="$1" url="$2"
  printf "  %s 대기 중" "$name"
  until curl -s -o /dev/null --max-time 2 "$url"; do
    printf "."
    sleep 2
  done
  echo " 완료"
}

echo "== 3. 서비스 준비 대기 =="
wait_for "Metro" "http://localhost:8081/status"
wait_for "customer-app" "http://localhost:5173/"
wait_for "partner-app" "http://localhost:5174/"
wait_for "api" "http://localhost:3000/api-docs"

echo "== 4. adb reverse 포트 포워딩 =="
"$ADB" reverse tcp:8081 tcp:8081
"$ADB" reverse tcp:5173 tcp:5173
"$ADB" reverse tcp:5174 tcp:5174
"$ADB" reverse tcp:3000 tcp:3000
"$ADB" reverse --list

echo ""
echo "모든 준비 완료. 앱 실행:"
echo "  $ADB shell monkey -p com.motopay.customer -c android.intent.category.LAUNCHER 1"
echo ""
echo "로그 위치: $LOG_DIR"
