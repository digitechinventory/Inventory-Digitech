import ExcelJS from 'exceljs';

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

const HEADER_BORDER = {
  top: { style: 'thin', color: { argb: 'FF1E3A8A' } },
  left: { style: 'thin', color: { argb: 'FF2563EB' } },
  bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
  right: { style: 'thin', color: { argb: 'FF2563EB' } }
};

async function fetchLogoBuffer() {
  try {
    const res = await fetch('/digitech-emblem.png');
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function triggerDownload(buffer, filename) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates and downloads a branded Digitech Excel (.xlsx) file with embedded logo,
 * corporate header, blue styled table headers, borders, and alternating row shading.
 */
export async function exportStyledExcel({
  filename,
  sheetName = 'Laporan',
  title,
  subtitle,
  summaryText,
  columns = [],
  sections = []
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PT Digitech - Inventory Management System';
  workbook.created = new Date();

  const totalCols = Math.max(columns.length, 6);
  const ws = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ showGridLines: true }]
  });

  // Set column widths
  ws.columns = columns.map((col) => ({
    width: col.width || 18
  }));

  // Row 1-3: Corporate Letterhead with Digitech Logo
  ws.getRow(1).height = 24;
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 18;

  const logoBuffer = await fetchLogoBuffer();
  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png'
    });
    ws.addImage(imageId, {
      tl: { col: 0.15, row: 0.2 },
      ext: { width: 46, height: 46 }
    });
  }

  // Merge B1:lastCol, B2:lastCol, B3:lastCol so logo fits cleanly in A1:A3
  ws.mergeCells(1, 2, 1, totalCols);
  ws.mergeCells(2, 2, 2, totalCols);
  ws.mergeCells(3, 2, 3, totalCols);

  const brandCell = ws.getCell(1, 2);
  brandCell.value = 'DIGITECH — INVENTORY MANAGEMENT SYSTEM';
  brandCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  brandCell.alignment = { vertical: 'middle', horizontal: 'left' };

  const titleCell = ws.getCell(2, 2);
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1D4ED8' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  const subCell = ws.getCell(3, 2);
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Blue bottom rule under letterhead (Row 3 across all columns)
  for (let c = 1; c <= totalCols; c++) {
    ws.getCell(3, c).border = {
      bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } }
    };
  }

  let currentRow = 4;

  if (summaryText) {
    ws.mergeCells(currentRow, 1, currentRow, totalCols);
    const sumRow = ws.getRow(currentRow);
    sumRow.height = 22;
    const sumCell = ws.getCell(currentRow, 1);
    sumCell.value = summaryText;
    sumCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
    sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    sumCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    for (let c = 1; c <= totalCols; c++) {
      ws.getCell(currentRow, c).border = {
        top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
        bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
        left: c === 1 ? { style: 'thin', color: { argb: 'FFBFDBFE' } } : undefined,
        right: c === totalCols ? { style: 'thin', color: { argb: 'FFBFDBFE' } } : undefined
      };
    }
    currentRow += 1;
  }

  currentRow += 1; // Blank spacer row

  for (const section of sections) {
    const secCols = section.headers.length;

    if (section.title) {
      ws.mergeCells(currentRow, 1, currentRow, secCols);
      const secTitleRow = ws.getRow(currentRow);
      secTitleRow.height = 22;
      const secCell = ws.getCell(currentRow, 1);
      secCell.value = section.title;
      secCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };
      secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      secCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      for (let c = 1; c <= secCols; c++) {
        ws.getCell(currentRow, c).border = {
          top: { style: 'thin', color: { argb: 'FF93C5FD' } },
          bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
          left: c === 1 ? { style: 'thin', color: { argb: 'FF93C5FD' } } : undefined,
          right: c === secCols ? { style: 'thin', color: { argb: 'FF93C5FD' } } : undefined
        };
      }
      currentRow += 1;
    }

    // Blue Table Header Row
    const headerRow = ws.getRow(currentRow);
    headerRow.height = 24;
    section.headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: section.alignments?.[idx] || 'left',
        wrapText: true
      };
      cell.border = HEADER_BORDER;
    });
    currentRow += 1;

    // Data Rows
    section.rows.forEach((rowVals, rowIdx) => {
      const row = ws.getRow(currentRow);
      row.height = 20;
      const isEven = rowIdx % 2 === 1;
      rowVals.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: section.alignments?.[colIdx] || (typeof val === 'number' ? 'right' : 'left'),
          wrapText: true
        };
        cell.border = THIN_BORDER;
      });
      currentRow += 1;
    });

    currentRow += 1; // Blank row between sections
  }

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}
