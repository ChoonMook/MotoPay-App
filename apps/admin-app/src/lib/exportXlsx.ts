// 엑셀(.xlsx) 다운로드 공통 유틸 - ag-grid-community에는 엑셀 내보내기가 없어(Enterprise 전용 기능) exceljs로
// 직접 워크북을 생성한다. "엑셀 다운로드" 버튼이 있는 모든 목록 화면은 이 함수를 사용해 다운로드 포맷을 통일한다.
import ExcelJS from "exceljs";

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
}

export async function exportRowsAsXlsx(params: {
  fileName: string;
  sheetName?: string;
  columns: XlsxColumn[];
  rows: Record<string, unknown>[];
}): Promise<void> {
  const { fileName, sheetName = "Sheet1", columns, rows } = params;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
