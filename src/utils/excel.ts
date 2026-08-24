import dayjs from "dayjs";
import * as XLSX from "xlsx";

/** Export any array of flat records to a downloadable .xlsx file. */
export function exportToExcel(rows: Record<string, unknown>[], fileName: string, sheet = "Sheet1") {
  if (!rows.length) throw new Error("Nothing to export yet.");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
  XLSX.writeFile(workbook, `${fileName}-${dayjs().format("YYYY-MM-DD")}.xlsx`);
}
