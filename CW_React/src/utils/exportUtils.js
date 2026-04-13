import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

/**
 * Export arbitrary JSON data to CSV and trigger download
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Export report to PDF including a table
 * @param {string} title - Report title
 * @param {Array} headers - Array of string headers e.g. ["Name", "Count"]
 * @param {Array} data - Array of arrays for rows [[ "John", "5" ]]
 * @param {string} filename - Output filename
 */
export const exportToPDF = (title, headers, data, filename = 'report.pdf') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] } // matching --primary-color
  });

  doc.save(filename);
};
