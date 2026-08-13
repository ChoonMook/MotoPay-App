// 고객앱 "마이페이지" 16개 화면(CU-MYPG-01~16)을 엮는 상태 컨테이너 (RsvFlow.tsx와 동일한 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import { API_BASE_URL } from "../../api/config";
import type { LoginUser } from "../../api/auth";
import { changePassword, updateProfile, updateProfileImage } from "../../api/users";
import { createMyCar, deleteMyCar, listMyCars, setDefaultCar, updateMyCar, type MyCarApi } from "../../api/cars";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import MyPageScreen from "./MyPageScreen";
import MyCarListScreen from "./MyCarListScreen";
import CarRegScreen from "./mycarlis/CarRegScreen";
import DfltCarSetScreen from "./mycarlis/DfltCarSetScreen";
import CstHistScreen from "./CstHistScreen";
import NotiCfgScreen, { type NotiSettings } from "./NotiCfgScreen";
import MyInfoChgScreen from "./MyInfoChgScreen";
import PwdChgScreen from "./PwdChgScreen";
import ShopOrderHistScreen from "./ShopOrderHistScreen";
import CancelReturnHistScreen from "./CancelReturnHistScreen";
import NotiInboxScreen from "./NotiInboxScreen";
import LogoutConfirmScreen from "./LogoutConfirmScreen";
import AcctWithdrawScreen from "./AcctWithdrawScreen";
import SnsLinkManageScreen from "./SnsLinkManageScreen";
import CpnBoxScreen from "./CpnBoxScreen";
import type { CouponStatus } from "./mypData";
import type { Car, MypScreenId, MypSheetId } from "./mypTypes";

type CodeNameMap = Record<string, string>;

const toMap = (details: CommonCodeDetailApi[]): CodeNameMap =>
  Object.fromEntries(details.map((d) => [d.detailCode, d.detailName]));

// 목록/상세 화면 표시용 — 브랜드·차종 코드를 공통코드에서 조회한 실제 이름으로 변환. 딜러사명은 서버가
// dealerCompanyId를 조인해 이미 채워 내려주므로(GET /cars/me) 별도 코드 조회가 필요 없음
function toViewCar(c: MyCarApi, brandNames: CodeNameMap, modelNames: CodeNameMap): Car {
  return {
    id: String(c.id),
    maker: brandNames[c.carBrandCode] ?? c.carBrandCode,
    model: modelNames[c.carModelCode] ?? c.carModelCode,
    year: c.modelYear ?? "",
    plate: c.plateNumber ?? "",
    isDefault: c.isDefault,
    fromDealer: c.regType === "MAP",
    dealerName: c.dealerCompanyName ?? undefined,
    vin: c.vin ?? undefined,
  };
}

interface MypFlowProps {
  user: LoginUser;
  onExit: () => void;
  onOpenShop: () => void;
  onOpenRsv: () => void;
  onOpenCs: () => void;
  onUpdateUser: (user: LoginUser) => void;
  onLogout: () => void;
  initialScreen?: MypScreenId;
}

export default function MypFlow({ user, onExit, onOpenShop, onOpenRsv, onOpenCs, onUpdateUser, onLogout, initialScreen = "main" }: MypFlowProps) {
  const [screen, setScreen] = useState<MypScreenId>(initialScreen);
  const [sheet, setSheet] = useState<MypSheetId>(null);

  const [carsApi, setCarsApi] = useState<MyCarApi[]>([]);
  const [carBrandOptions, setCarBrandOptions] = useState<CommonCodeDetailApi[]>([]);
  const [carModelOptions, setCarModelOptions] = useState<CommonCodeDetailApi[]>([]);
  const brandNameMap = toMap(carBrandOptions);
  const modelNameMap = toMap(carModelOptions);
  const cars = carsApi.map((c) => toViewCar(c, brandNameMap, modelNameMap));
  // 차종이 하나도 없는 브랜드를 고르면 모델 드롭다운이 비어버리니, 차종이 있는 브랜드만 제조사 선택지로 노출
  const carBrandOptionsWithModels = carBrandOptions.filter((b) => carModelOptions.some((m) => m.ref1 === b.detailCode));

  const [carEditId, setCarEditId] = useState<string | null>(null);
  const [carMakerVal, setCarMakerVal] = useState("");
  const [carModelVal, setCarModelVal] = useState("");
  const [carTrimVal, setCarTrimVal] = useState("");
  const [carYearVal, setCarYearVal] = useState("");
  const [carPlateVal, setCarPlateVal] = useState("");
  const [carSaving, setCarSaving] = useState(false);
  const [defaultTargetId, setDefaultTargetId] = useState<string | null>(null);

  const [notiRead, setNotiRead] = useState<Record<string, boolean>>({});
  const [notiSettings, setNotiSettings] = useState<NotiSettings>({ all: true, event: true, resv: true, order: true, night: false });

  // user.profileImageUrl은 apps/api 기준 상대경로("/uploads/...")라 API_BASE_URL을 붙여야 브라우저에서 실제로 로드됨
  const profileImageAbsoluteUrl = user.profileImageUrl ? `${API_BASE_URL}${user.profileImageUrl}` : null;

  const [profNameInput, setProfNameInput] = useState(user.name);
  const [profEmailInput, setProfEmailInput] = useState(user.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [pwCur, setPwCur] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [withdrawReason, setWithdrawReason] = useState<string | null>(null);
  const [withdrawAgree, setWithdrawAgree] = useState(false);

  const [snsLinked, setSnsLinked] = useState<Record<string, boolean>>({ kakao: true, naver: false, google: true });

  const [couponFilter, setCouponFilter] = useState<CouponStatus>("usable");

  const { toast, showToast } = useToast();

  useEffect(() => {
    listMyCars()
      .then(setCarsApi)
      .catch((err) => showToast(err instanceof Error ? err.message : "차량 정보를 불러오지 못했어요", "danger"));
    Promise.all([getCommonCodeDetails("CAR_BRAND"), getCommonCodeDetails("CAR_MODEL")])
      .then(([brands, models]) => {
        setCarBrandOptions(brands);
        setCarModelOptions(models);
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "차량 코드 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goMain = () => {
    setScreen("main");
    setSheet(null);
  };
  const goCars = () => {
    setScreen("cars");
    setSheet(null);
  };

  const goInfoEdit = () => {
    setProfNameInput(user.name);
    setProfEmailInput(user.email ?? "");
    setScreen("infoedit");
  };

  const onSelectPhoto = async (dataUri: string) => {
    setUploadingPhoto(true);
    try {
      const updated = await updateProfileImage(dataUri);
      onUpdateUser(updated);
      showToast("프로필 사진이 변경됐어요", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "사진 업로드에 실패했어요", "danger");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 제조사를 바꾸면 그 브랜드에 속한 차종으로 자동 전환(다른 브랜드 차종이 남아있지 않도록)
  const onChangeCarMaker = (brandCode: string) => {
    setCarMakerVal(brandCode);
    const firstModel = carModelOptions.find((m) => m.ref1 === brandCode);
    setCarModelVal(firstModel?.detailCode ?? "");
  };

  const goCarEdit = (id: string | null) => {
    const car = id ? carsApi.find((c) => String(c.id) === id) : null;
    setCarEditId(id);
    if (car) {
      setCarMakerVal(car.carBrandCode);
      setCarModelVal(car.carModelCode);
      setCarTrimVal(car.trimName ?? "");
      setCarYearVal(car.modelYear ?? "");
      setCarPlateVal(car.plateNumber ?? "");
    } else {
      const defaultBrand = carBrandOptionsWithModels[0];
      const defaultModel = carModelOptions.find((m) => m.ref1 === defaultBrand?.detailCode);
      setCarMakerVal(defaultBrand?.detailCode ?? "");
      setCarModelVal(defaultModel?.detailCode ?? "");
      setCarTrimVal("");
      setCarYearVal("");
      setCarPlateVal("");
    }
    setScreen(car ? "caredit" : "carreg");
  };

  const saveCar = async () => {
    if (!carModelVal || !carPlateVal) {
      showToast("차량 정보를 모두 입력하세요");
      return;
    }
    setCarSaving(true);
    try {
      if (carEditId) {
        const isMapCar = carsApi.find((c) => String(c.id) === carEditId)?.regType === "MAP";
        const updated = isMapCar
          ? await updateMyCar(Number(carEditId), { plateNumber: carPlateVal })
          : await updateMyCar(Number(carEditId), {
              carBrandCode: carMakerVal,
              carModelCode: carModelVal,
              trimName: carTrimVal,
              modelYear: carYearVal,
              plateNumber: carPlateVal,
            });
        setCarsApi((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createMyCar({
          carBrandCode: carMakerVal,
          carModelCode: carModelVal,
          trimName: carTrimVal,
          modelYear: carYearVal,
          plateNumber: carPlateVal,
        });
        setCarsApi((prev) => [...prev, created]);
      }
      showToast("차량 정보가 저장됐어요", "success");
      setScreen("cars");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "차량 정보 저장에 실패했어요", "danger");
    } finally {
      setCarSaving(false);
    }
  };

  const deleteCar = async () => {
    if (!carEditId) return;
    try {
      await deleteMyCar(Number(carEditId));
      setCarsApi((prev) => prev.filter((c) => String(c.id) !== carEditId));
      setScreen("cars");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "차량 삭제에 실패했어요", "danger");
    }
  };

  const editingCar = cars.find((c) => c.id === carEditId);
  const defaultTarget = cars.find((c) => c.id === defaultTargetId);

  // 하드웨어 백버튼: 각 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동
  // (withdrawconfirm 시트는 별도 sheet 렌더 블록이 아니라 AcctWithdrawScreen의 confirmOpen prop이라
  // setSheet(null) 하나로 모든 시트가 동일하게 닫힘)
  useEffect(() => {
    if (sheet) {
      return pushBackAction(() => setSheet(null));
    }
    switch (screen) {
      case "carreg":
      case "caredit":
        return pushBackAction(goCars);
      case "pwedit":
        return pushBackAction(() => setScreen("infoedit"));
      case "cars":
      case "cst":
      case "notisettings":
      case "infoedit":
      case "shophist":
      case "cancelhist":
      case "couponbox":
      case "notis":
      case "withdraw":
      case "sns":
        return pushBackAction(goMain);
      default:
        return;
    }
  }, [screen, sheet]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {screen === "main" && (
        <MyPageScreen
          userName={user.name}
          profileImageUrl={profileImageAbsoluteUrl}
          userCarLabel={(() => {
            const def = cars.find((c) => c.isDefault) || cars[0];
            return def ? `${def.maker} ${def.model}${def.plate ? ` · ${def.plate}` : ""}` : "등록된 차량이 없어요";
          })()}
          onExit={onExit}
          onOpenShop={onOpenShop}
          onOpenRsv={onOpenRsv}
          onOpenCars={goCars}
          onOpenCst={() => setScreen("cst")}
          onOpenShopHist={() => setScreen("shophist")}
          onOpenCancelHist={() => setScreen("cancelhist")}
          onOpenCouponBox={() => setScreen("couponbox")}
          onOpenNotis={() => setScreen("notis")}
          onOpenNotiSettings={() => setScreen("notisettings")}
          onOpenInfoEdit={goInfoEdit}
          onOpenSns={() => setScreen("sns")}
          onOpenCs={onOpenCs}
          onOpenLogout={() => setSheet("logout")}
          onOpenWithdraw={() => {
            setWithdrawReason(null);
            setWithdrawAgree(false);
            setScreen("withdraw");
          }}
          onToast={(label) => showToast(`${label} 탭으로 이동해요`)}
        />
      )}

      {screen === "cars" && (
        <MyCarListScreen
          onBack={goMain}
          cars={cars}
          onOpenCar={(id) => goCarEdit(id)}
          onAddCar={() => goCarEdit(null)}
          onSetDefault={(id) => {
            setDefaultTargetId(id);
            setSheet("defaultcar");
          }}
        />
      )}

      {(screen === "carreg" || screen === "caredit") && (
        <CarRegScreen
          onBack={goCars}
          isEditMode={!!carEditId}
          brandOptions={carBrandOptionsWithModels}
          modelOptions={carModelOptions}
          maker={carMakerVal}
          model={carModelVal}
          trim={carTrimVal}
          year={carYearVal}
          plate={carPlateVal}
          onChangeMaker={onChangeCarMaker}
          onChangeModel={setCarModelVal}
          onChangeTrim={setCarTrimVal}
          onChangeYear={setCarYearVal}
          onChangePlate={setCarPlateVal}
          isDealerCar={!!editingCar?.fromDealer}
          dealerName={editingCar?.dealerName}
          vin={editingCar?.vin}
          onDelete={deleteCar}
          onSave={saveCar}
          saving={carSaving}
        />
      )}

      {screen === "cst" && <CstHistScreen onBack={goMain} onOpenItem={() => showToast("예약시공 모듈의 상세로 이동해요")} />}

      {screen === "notisettings" && (
        <NotiCfgScreen
          onBack={goMain}
          settings={notiSettings}
          onToggle={(key) => setNotiSettings((prev) => ({ ...prev, [key]: !prev[key] }))}
        />
      )}

      {screen === "infoedit" && (
        <MyInfoChgScreen
          onBack={goMain}
          profName={profNameInput}
          profPhone={user.phone ?? ""}
          profEmail={profEmailInput}
          profileImageUrl={profileImageAbsoluteUrl}
          onChangeName={setProfNameInput}
          onChangeEmail={setProfEmailInput}
          onSelectPhoto={onSelectPhoto}
          photoUploading={uploadingPhoto}
          saving={savingProfile}
          onError={(message) => showToast(message, "danger")}
          onOpenPwEdit={() => {
            setPwCur("");
            setPwNew("");
            setPwConfirm("");
            setScreen("pwedit");
          }}
          onSave={async () => {
            if (!profNameInput.trim()) {
              showToast("이름을 입력하세요");
              return;
            }
            setSavingProfile(true);
            try {
              const updated = await updateProfile({ name: profNameInput, email: profEmailInput });
              onUpdateUser(updated);
              showToast("정보가 저장됐어요", "success");
              setScreen("main");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "정보 저장에 실패했어요", "danger");
            } finally {
              setSavingProfile(false);
            }
          }}
        />
      )}

      {screen === "pwedit" && (
        <PwdChgScreen
          onBack={() => setScreen("infoedit")}
          pwCur={pwCur}
          pwNew={pwNew}
          pwConfirm={pwConfirm}
          onChangeCur={setPwCur}
          onChangeNew={setPwNew}
          onChangeConfirm={setPwConfirm}
          saving={pwSaving}
          onSave={async () => {
            if (!pwCur || !pwNew || pwNew !== pwConfirm || pwCur === pwNew) return;
            setPwSaving(true);
            try {
              await changePassword(pwCur, pwNew);
              showToast("비밀번호가 변경됐어요", "success");
              setPwCur("");
              setPwNew("");
              setPwConfirm("");
              setScreen("infoedit");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "비밀번호 변경에 실패했어요", "danger");
            } finally {
              setPwSaving(false);
            }
          }}
        />
      )}

      {screen === "shophist" && <ShopOrderHistScreen onBack={goMain} onOpenItem={() => showToast("쇼핑몰 모듈의 주문상세로 이동해요")} />}

      {screen === "cancelhist" && <CancelReturnHistScreen onBack={goMain} />}

      {screen === "couponbox" && <CpnBoxScreen onBack={goMain} filter={couponFilter} onSelectFilter={setCouponFilter} />}

      {screen === "notis" && (
        <NotiInboxScreen
          onBack={goMain}
          onOpenSettings={() => setScreen("notisettings")}
          notiRead={notiRead}
          onMarkRead={(id) => setNotiRead((prev) => ({ ...prev, [id]: true }))}
        />
      )}

      {screen === "withdraw" && (
        <AcctWithdrawScreen
          onBack={goMain}
          reason={withdrawReason}
          onSelectReason={setWithdrawReason}
          agree={withdrawAgree}
          onToggleAgree={() => setWithdrawAgree((v) => !v)}
          onWithdraw={() => {
            if (!withdrawReason || !withdrawAgree) return;
            setSheet("withdrawconfirm");
          }}
          confirmOpen={sheet === "withdrawconfirm"}
          onCancelConfirm={() => setSheet(null)}
          onConfirmFinal={() => {
            setSheet(null);
            onLogout();
          }}
        />
      )}

      {screen === "sns" && (
        <SnsLinkManageScreen
          onBack={goMain}
          linked={snsLinked}
          onToggle={(key) => {
            const wasLinked = snsLinked[key];
            setSnsLinked((prev) => ({ ...prev, [key]: !prev[key] }));
            const label = key === "kakao" ? "카카오" : key === "naver" ? "네이버" : "구글";
            showToast(wasLinked ? `${label} 연결이 해제됐어요` : `${label} 계정이 연결됐어요`, "success");
          }}
        />
      )}

      {sheet === "defaultcar" && (
        <DfltCarSetScreen
          onClose={() => setSheet(null)}
          targetName={defaultTarget ? defaultTarget.model : ""}
          onConfirm={async () => {
            if (!defaultTargetId) return;
            try {
              await setDefaultCar(Number(defaultTargetId));
              setCarsApi((prev) => prev.map((c) => ({ ...c, isDefault: String(c.id) === defaultTargetId })));
              setSheet(null);
              showToast("대표차량으로 지정됐어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "대표차량 지정에 실패했어요", "danger");
            }
          }}
        />
      )}

      {sheet === "logout" && (
        <LogoutConfirmScreen
          onCancel={() => setSheet(null)}
          onConfirm={() => {
            setSheet(null);
            onLogout();
          }}
        />
      )}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
