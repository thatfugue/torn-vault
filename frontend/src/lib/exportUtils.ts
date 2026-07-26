import * as XLSX from 'xlsx';

export function exportExcel(data: any[], filename: string) {
  if (!data || !data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);

  const colWidths = Object.keys(data[0]).map((key) => {
    const maxDataLength = data.reduce((max, row) => {
      const value = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
      return Math.max(max, value.length);
    }, 0);

    return { wch: Math.max(key.length, maxDataLength) + 5 };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
