import ExcelJS from 'exceljs';

/**
 * Helper to escape CSV cell value properly
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export data to Excel (.xlsx) with styled colored headers and auto column width
 */
export async function exportToExcel(res, sheetTitle, columns, data, filename) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetTitle);

  sheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 20
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' } // Brand blue
    };
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' } // White
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // Add data rows
  data.forEach(item => {
    const row = sheet.addRow(item);
    row.height = 22;
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }
      };
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Export data to CSV format with UTF-8 BOM (\uFEFF) to guarantee correct Vietnamese rendering in MS Excel
 */
export function exportToCsv(res, columns, data, filename) {
  const headerLine = columns.map(c => escapeCsv(c.header)).join(',');
  const rowLines = data.map(item => {
    return columns.map(c => escapeCsv(item[c.key])).join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csvContent);
}

/**
 * Universal export controller helper
 */
export async function handleDataExport(res, format, sheetTitle, columns, data, filename) {
  if (format === 'csv') {
    return exportToCsv(res, columns, data, filename);
  }
  return exportToExcel(res, sheetTitle, columns, data, filename);
}
