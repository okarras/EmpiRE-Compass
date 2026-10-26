interface ReportTableCell {
  html: string;
  header: boolean;
  rowSpan: number;
  colSpan: number;
}

export function readReportTable(table: HTMLTableElement) {
  const htmlRows = Array.from(table.rows);
  const rows: (ReportTableCell | null)[][] = htmlRows.map(() => []);

  htmlRows.forEach((row, rowIndex) => {
    let column = 0;

    Array.from(row.cells).forEach((cell) => {
      // Skip positions occupied by cells from previous rows.
      while (rows[rowIndex][column] !== undefined) {
        column += 1;
      }

      const groupRows = Array.from(row.parentElement?.children ?? []);
      const remainingGroupRows = groupRows.length - groupRows.indexOf(row);

      const rowSpan = Math.min(
        cell.rowSpan === 0 ? remainingGroupRows : cell.rowSpan,
        htmlRows.length - rowIndex
      );
      const colSpan = cell.colSpan;

      // Reserve all positions covered by the merged cell.
      for (let r = 0; r < rowSpan; r += 1) {
        for (let c = 0; c < colSpan; c += 1) {
          rows[rowIndex + r][column + c] = null;
        }
      }

      rows[rowIndex][column] = {
        html: cell.innerHTML,
        header: cell.tagName === 'TH',
        rowSpan,
        colSpan,
      };

      column += colSpan;
    });
  });

  const columnCount = Math.max(0, ...rows.map((row) => row.length));

  // Keep every row rectangular, including empty positions.
  for (const row of rows) {
    for (let column = 0; column < columnCount; column += 1) {
      if (row[column] === undefined) {
        row[column] = {
          html: '',
          header: false,
          rowSpan: 1,
          colSpan: 1,
        };
      }
    }
  }

  return {
    rows,
    columnCount,
    headerRows: table.tHead?.rows.length ?? 0,
  };
}

export function splitReportTable(table: ReturnType<typeof readReportTable>) {
  if (!table.columnCount) return [];
  const parts: number[][] = [];
  for (let start = 1; start < table.columnCount || start === 1; ) {
    let end = Math.min(start + 8, table.columnCount);
    // Keep grouped columns together whenever a group fits in one part.
    while (
      end > start &&
      end < table.columnCount &&
      table.rows.some((row) =>
        row.some(
          (cell, column) =>
            cell &&
            cell.colSpan < table.columnCount &&
            column < end &&
            column + cell.colSpan > end
        )
      )
    )
      end -= 1;
    if (end === start) end = Math.min(start + 8, table.columnCount);
    parts.push([
      0,
      ...Array.from({ length: end - start }, (_, index) => start + index),
    ]);
    if (end >= table.columnCount) break;
    start = end;
  }

  return parts.map((columns) => ({
    headerRows: table.headerRows,
    columnCount: columns.length,
    rows: table.rows.map((row) => {
      const cells: (ReportTableCell | null)[] = columns.map(() => null);
      row.forEach((cell, column) => {
        if (!cell) return;
        const included = columns.filter(
          (index) => index >= column && index < column + cell.colSpan
        );
        if (included.length)
          cells[columns.indexOf(included[0])] = {
            ...cell,
            colSpan: included.length,
          };
      });
      return cells;
    }),
  }));
}
