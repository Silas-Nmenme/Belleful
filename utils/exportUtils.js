const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } = require('docx');
const { stringify } = require('csv-stringify/sync');
const { PassThrough } = require('stream');
const fs = require('fs');

module.exports = {
  /**
   * Format orders data for export (consistent columns)
   */
  formatOrdersData(orders, type = 'user') {
    return orders.map(order => {
      const safeOrder = {
        ...order,
        totalAmount: Number(order.totalAmount || 0),
        items: Array.isArray(order.items) ? order.items : []
      };
      
      const row = {
        'Order ID': safeOrder.displayId || `#${safeOrder._id?.slice(-6)}`,
        'Date': new Date(safeOrder.createdAt || Date.now()).toLocaleDateString(),
        'Status': (safeOrder.orderStatus || 'N/A').replace('_', ' ').toUpperCase(),
        'Method': (safeOrder.deliveryMethod || 'N/A').toUpperCase(),
        'Items': safeOrder.itemCount || safeOrder.items.length || 0,
        'Total': `$${safeOrder.totalAmount.toFixed(2)}`,
        'Phone': safeOrder.phoneNumber || 'N/A',
        'ItemsDetail': safeOrder.items.slice(0, 5).map(item => 
          `${item.name || 'N/A'} x${item.quantity || 1} @$${(Number(item.price) || 0).toFixed(2)}`
        ).join('; ') || 'No items'
      };
      
      if (type === 'admin') {
        row.Customer = safeOrder.user?.name || (safeOrder.user?.email || '').split('@')[0] || 'N/A';
        row['Payment Status'] = safeOrder.paymentStatus || 'Pending';
        row['Notes'] = (safeOrder.notes || '').substring(0, 50);
      }
      
      return row;
    });
  },

  /**
   * Generate PDF with table
   */
  async generatePDF(data, filename = 'transactions.pdf') {
    return new Promise((resolve, reject) => {
      const buffers = [];
      const doc = new PDFDocument({ layout: 'landscape', margin: 50 });
      const stream = new PassThrough();
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('Transaction Report', 50, 50);
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);
      
      // Table headers
      const headers = Object.keys(data[0] || {});
      const headerPosition = 150;
      doc.fontSize(10).font('Helvetica-Bold');
      headers.slice(0, 8).forEach((header, i) => {  // Limit columns
        doc.text(header, 50 + i * 80, headerPosition, { width: 80 });
      });
      
      // Rows - truncate long text
      doc.font('Helvetica');
      data.slice(0, 50).forEach((row, rowIndex) => {  // Limit rows
        const yPos = headerPosition + 30 + (rowIndex * 15);
        headers.slice(0, 8).forEach((header, i) => {
          const cellText = (row[header]?.toString() || '').substring(0, 25);
          doc.text(cellText, 50 + i * 80, yPos, { width: 80 });
        });
      });
      
      doc.end();
      
      stream.on('data', chunk => buffers.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(buffers)));
      stream.on('error', reject);
    });
  },

  /**
   * Generate DOCX
   */
  async generateDOCX(data, filename = 'transactions.docx') {
    const headers = Object.keys(data[0] || {});
    const rows = [headers, ...data.slice(0, 100).map(row => headers.slice(0, 8).map(h => (row[h] || '').toString().substring(0, 50)))];
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new docx.TextRun({
                text: "Transaction Report",
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            children: [new docx.TextRun(`Generated: ${new Date().toLocaleString()}`)]
          }),
          new Table({
            rows: rows.map(row => new TableRow({
              children: row.map((cell, colIdx) => new TableCell({
                children: [new Paragraph(cell.toString())],
                width: { size: 100 / Math.min(8, headers.length), type: WidthType.PERCENTAGE }
              }))
            }))
          })
        ]
      }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  },

  /**
   * Generate CSV
   */
  generateCSV(data, filename = 'transactions.csv') {
    const headers = Object.keys(data[0] || {});
    return stringify(data, { header: true, columns: headers });
  }
};
