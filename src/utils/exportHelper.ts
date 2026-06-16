/**
 * Export Helper Utility
 * Provides fully-functional downloads for tables/lists as CSV, Excel (.xls), Word (.doc) or PDF/Print format.
 * Dynamically outputs exactly the filtered dataset in action.
 */

export function downloadCSV(data: any[], headers: string[], keys: string[], filename: string) {
  const csvContent = [
    headers.map(h => `"${h.toString().replace(/"/g, '""')}"`).join(','),
    ...data.map(row => 
      keys.map(key => {
        const val = row[key] === undefined || row[key] === null ? '' : String(row[key]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadExcel(data: any[], headers: string[], keys: string[], filename: string) {
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n';
  html += '<head><meta charset="utf-8">\n';
  html += '<style>\n';
  html += 'table { border-collapse: collapse; font-family: sans-serif; }\n';
  html += 'th { background-color: #007f6e; color: white; font-weight: bold; padding: 10px; border: 1px solid #ddd; }\n';
  html += 'td { padding: 8px; border: 1px solid #ddd; text-align: left; }\n';
  html += '</style>\n';
  html += '</head><body>\n';
  html += '<h2>' + filename.replace(/_/g, ' ').toUpperCase() + ' REPORT</h2>';
  html += '<table>\n<thead>\n<tr>\n';
  headers.forEach(h => {
    html += `  <th>${h}</th>\n`;
  });
  html += '</tr>\n</thead>\n<tbody>\n';
  data.forEach(row => {
    html += '<tr>\n';
    keys.forEach(key => {
      const val = row[key] === undefined || row[key] === null ? '' : String(row[key]);
      html += `  <td>${val}</td>\n`;
    });
    html += '</tr>\n';
  });
  html += '</tbody>\n</table>\n</body>\n</html>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadWord(data: any[], headers: string[], keys: string[], filename: string, title: string) {
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n';
  html += '<head><meta charset="utf-8">\n';
  html += '<style>\n';
  html += 'body { font-family: "Segoe UI", sans-serif; margin: 40px; color: #333; }\n';
  html += 'h1 { color: #007f6e; border-bottom: 2px solid #007f6e; padding-bottom: 8px; font-size: 24px; }\n';
  html += 'p { font-size: 11px; color: #666; }\n';
  html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }\n';
  html += 'th { background-color: #f3f4f6; color: #111; font-weight: bold; padding: 10px; border: 1px solid #ccc; text-align: left; font-size: 11px; }\n';
  html += 'td { padding: 8px; border: 1px solid #eee; font-size: 11px; }\n';
  html += '</style>\n';
  html += '</head><body>\n';
  html += `<h1>${title} Log Report</h1>\n`;
  html += `<p>Generated on ${new Date().toLocaleString()}</p>\n`;
  html += `<p>Records count: ${data.length}</p>\n`;
  html += '<table>\n<thead>\n<tr>\n';
  headers.forEach(h => {
    html += `  <th>${h}</th>\n`;
  });
  html += '</tr>\n</thead>\n<tbody>\n';
  data.forEach(row => {
    html += '<tr>\n';
    keys.forEach(key => {
      const val = row[key] === undefined || row[key] === null ? '' : String(row[key]);
      html += `  <td>${val}</td>\n`;
    });
    html += '</tr>\n';
  });
  html += '</tbody>\n</table>\n</body>\n</html>';

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.doc`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadPDFFile(data: any[], headers: string[], keys: string[], filename: string, title: string) {
  let html = '<html>\n';
  html += '<head><meta charset="utf-8"><title>' + title + '</title>\n';
  html += '<style>\n';
  html += 'body { font-family: system-ui, sans-serif; padding: 30px; color: #1e293b; background-color: #ffffff; }\n';
  html += '.header { border-bottom: 3px solid #007f6e; padding-bottom: 12px; margin-bottom: 20px; }\n';
  html += 'h1 { color: #0f172a; margin: 0 0 6px 0; font-size: 22px; }\n';
  html += '.meta { font-size: 11px; color: #64748b; font-family: monospace; }\n';
  html += 'table { width: 100%; border-collapse: collapse; margin-top: 25px; }\n';
  html += 'th { background-color: #0f172a; color: #ffffff; font-weight: 600; padding: 10px 12px; border: 1px solid #1e293b; font-size: 11px; text-align: left; text-transform: uppercase; }\n';
  html += 'td { padding: 9px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #334155; }\n';
  html += 'tr:nth-child(even) { background-color: #f8fafc; }\n';
  html += '.footer { margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; }\n';
  html += '</style>\n';
  html += '</head><body>\n';
  html += '<div class="header">\n';
  html += `  <h1>${title} Clinical Ledger Report</h1>\n`;
  html += `  <div class="meta">Exported: ${new Date().toLocaleString()} | Size: ${data.length} entries</div>\n`;
  html += '</div>\n';
  html += '<table>\n<thead>\n<tr>\n';
  headers.forEach(h => {
    html += `  <th>${h}</th>\n`;
  });
  html += '</tr>\n</thead>\n<tbody>\n';
  data.forEach(row => {
    html += '<tr>\n';
    keys.forEach(key => {
      const val = row[key] === undefined || row[key] === null ? '' : String(row[key]);
      html += `  <td>${val}</td>\n`;
    });
    html += '</tr>\n';
  });
  html += '</tbody>\n</table>\n';
  html += '<div class="footer">Confidential Hospital Audit Dossier - Generated Dynamically</div>\n';
  html += '</body>\n</html>';

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_report.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
