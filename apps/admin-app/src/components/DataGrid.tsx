// 관리자웹 표준 목록 그리드 - AD-SYS-04(사용자 계정 관리)에서 정립한 그리드 스타일(테마·행/헤더 높이·hover 색상·
// 페이지네이션·"건" 단위 페이지 크기 select)을 표준화한 공통 컴포넌트. 신규 목록(list) 화면은 <table>을 직접
// 만들거나 ag-grid를 개별 설정하지 말고 이 컴포넌트를 사용해 그리드 스타일을 통일한다.
import { forwardRef, useImperativeHandle, useRef, useState, type ForwardedRef } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  CellClickedEvent,
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  RowClassParams,
  RowSelectionOptions,
} from "ag-grid-community";
import { ADMIN_GRID_DEFAULT_PAGE_SIZE, ADMIN_GRID_LOCALE_KO, ADMIN_GRID_PAGE_SIZE_OPTIONS, ADMIN_GRID_THEME } from "../lib/agGridConfig";

export interface DataGridProps<TData> {
  columnDefs: ColDef<TData>[];
  rowData: TData[];
  getRowId: (params: GetRowIdParams<TData>) => string;
  context?: unknown;
  onCellClicked?: (event: CellClickedEvent<TData>) => void;
  /** 셀 인라인 편집(columnDefs의 editable) 값이 바뀌었을 때 - 편집 가능한 그리드에서만 사용 */
  onCellValueChanged?: (event: CellValueChangedEvent<TData>) => void;
  /** 선택된 행 강조 등 행별 조건부 스타일 클래스 */
  getRowClass?: (params: RowClassParams<TData>) => string | string[] | undefined;
  /** Master-Detail 화면처럼 행을 선택해 하이라이트해야 할 때만 지정(테마의 selectedRowBackgroundColor와 짝) */
  rowSelection?: RowSelectionOptions<TData>;
  rowClass?: string;
  /** 결과가 없을 때 보여줄 안내 문구(로딩 중 문구는 loading prop이 별도로 처리 — 여기 섞지 않는다) */
  emptyMessage?: string;
  /** true인 동안 ag-grid 자체 로딩 오버레이를 표시 — rowData가 빈 배열이어도 "결과 없음" 문구로 잘못 표시되지 않도록 분리 */
  loading?: boolean;
  /** columnDefs의 spanRows(동일 값 셀 병합)를 쓰려면 true로 지정 - gridOptions 레벨 스위치라 컬럼 정의만으로는 동작하지 않음 */
  enableCellSpan?: boolean;
  /** 그리드 하단에 고정 표시할 합계 등의 행(페이지네이션과 무관하게 항상 노출) */
  pinnedBottomRowData?: TData[];
}

function DataGridInner<TData>(
  {
    columnDefs,
    rowData,
    getRowId,
    context,
    onCellClicked,
    onCellValueChanged,
    getRowClass,
    rowSelection,
    rowClass,
    emptyMessage = "조건에 맞는 항목이 없습니다.",
    loading = false,
    enableCellSpan = false,
    pinnedBottomRowData,
  }: DataGridProps<TData>,
  ref: ForwardedRef<AgGridReact<TData>>,
) {
  const internalRef = useRef<AgGridReact<TData>>(null);
  useImperativeHandle(ref, () => internalRef.current as AgGridReact<TData>, []);

  const [pageSize, setPageSize] = useState<number>(ADMIN_GRID_DEFAULT_PAGE_SIZE);

  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    internalRef.current?.api?.paginationGoToFirstPage();
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-[#e3e5ec] bg-white shadow-sm">
      <AgGridReact<TData>
        ref={internalRef}
        className="mp-admin-grid"
        theme={ADMIN_GRID_THEME}
        rowData={rowData}
        loading={loading}
        columnDefs={columnDefs}
        getRowId={getRowId}
        context={context}
        onCellClicked={onCellClicked}
        onCellValueChanged={onCellValueChanged}
        getRowClass={getRowClass}
        rowSelection={rowSelection}
        rowClass={rowClass}
        enableCellSpan={enableCellSpan}
        pinnedBottomRowData={pinnedBottomRowData}
        pagination
        paginationPageSize={pageSize}
        paginationPageSizeSelector={false}
        paginationPanels={["rowSummary", "pageSummary"]}
        suppressCellFocus
        localeText={{ ...ADMIN_GRID_LOCALE_KO, noRowsToShow: emptyMessage }}
      />
      {/* AG Grid 기본 페이징 패널은 페이지 크기 옵션에 "건" 단위 표기를 지원하지 않아, 패널 왼쪽 여백
          (index.css의 .mp-admin-grid .ag-paging-panel 패딩)에 자체 select를 겹쳐 배치 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-11 items-center px-4">
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="pointer-events-auto rounded-md border border-[#ced4da] bg-white px-2 py-1 text-[11px] font-medium text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
        >
          {ADMIN_GRID_PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}건
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const DataGrid = forwardRef(DataGridInner) as <TData>(
  props: DataGridProps<TData> & { ref?: ForwardedRef<AgGridReact<TData>> },
) => ReturnType<typeof DataGridInner>;

export default DataGrid;
