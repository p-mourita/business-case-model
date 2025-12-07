import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ScenarioResult } from "./types";

function buildRows(result: ScenarioResult, currency: string) {
  return result.yearly.map((y) => ({
    Year: y.year,
    "Price per unit": y.pricePerUnit,
    Units: y.units,
    Revenue: y.revenue,
    "Variable cost": y.variableCost,
    "Gross profit": y.grossProfit,
    "Gross margin %": y.grossMarginPct,
    "Fixed cost": y.fixedCost,
    "Net profit": y.netProfit,
    "Net margin %": y.netMarginPct,
    "Cumulative cash flow": y.cumulativeCashFlow
  }));
}

export function exportToCSV(result: ScenarioResult, currency: string) {
  const rows = buildRows(result, currency);

  const header = Object.keys(rows[0] ?? {});
  const csvLines = [
    header.join(","),
    ...rows.map((r) => header.map((h) => String((r as any)[h])).join(","))
  ];
  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;"
  });

  saveAs(blob, `${result.scenario.name}_scenario.csv`);
}

export function exportToXLSX(result: ScenarioResult, currency: string) {
  const rows = buildRows(result, currency);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Business Case");
  XLSX.writeFile(wb, `${result.scenario.name}_scenario.xlsx`);
}

export function exportToPDF(result: ScenarioResult, currency: string) {
  const doc = new jsPDF();
  const title = `Business Case — ${result.scenario.name} scenario`;
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  // Summary
  doc.setFontSize(10);
  doc.text(
    `Total revenue (5y): ${currency} ${result.totalRevenue.toFixed(0)}`,
    14,
    26
  );
  doc.text(
    `Total net profit (5y): ${currency} ${result.totalNetProfit.toFixed(0)}`,
    14,
    32
  );
  doc.text(
    `Payback year: ${
      result.paybackYear ? "Year " + result.paybackYear : "Not reached"
    }`,
    14,
    38
  );

  const rows = result.yearly.map((y) => [
    `Y${y.year}`,
    y.pricePerUnit.toFixed(2),
    y.units.toFixed(0),
    y.revenue.toFixed(0),
    y.netProfit.toFixed(0),
    y.netMarginPct.toFixed(1) + "%"
  ]);

  autoTable(doc, {
    startY: 46,
    head: [["Year", "Price", "Units", "Revenue", "Net profit", "Net margin"]],
    body: rows,
    styles: { fontSize: 8 }
  });

  doc.save(`${result.scenario.name}_scenario.pdf`);
}
