const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } = require('docx');
const { stringify } = require('csv-stringify/sync');
const fs = require('fs');

module.exports = {
  /**
   * Format orders data for export (consistent columns)
   */
  formatOrdersData(orders, type = 'user') {
    return orders.map(order => {
      const row = {
        'Order ID': order.displayId || `#${order._id.slice(-6)}`,
        'Date': new Date(order.createdAt).toLocaleDateString(),
        'Status': order.orderStatus?.replace('_', ' ').toUpperCase() || 'N/A',
        'Method': order.deliveryMethod?.toUpperCase() || 'N/A',
        'Items': order.itemCount || order.items?.length || 0,
        'Total': `$${Number(order.totalAmount || 0).toFixed(2)}`,
        'Phone': order.phoneNumber || 'N/A'
      };
      
      if (type === 'admin') {
        row.Customer = order.user?.name || 'N/A';
        row['Payment Status'] = order.paymentStatus || 'N/A';
        row['Notes'] = order.notes?.substring(0, 50) || '';
      }
      
      row.ItemsDetail = order.items.map(item => 
        `${item.name} x${item.quantity} @$${item.price?.toFixed(2)}`
      ).join('; ');
      
      return row;
    });
  },

  /**
   * Generate PDF with table
   */
  async generatePDF(data, filename = 'transactions.pdf') {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ layout: 'landscape', margin: 50 });
      const stream = doc.pipe(fs.createWriteStream(filename));
      
      // Header
      doc.fontSize(20).text('Transaction Report', 50, 50);
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);
      
      // Table headers
      const headers = Object.keys(data[0] || {});
      const headerPosition = 150;
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, 50 + i * 120, headerPosition, { width: 120 });
      });
      
      // Rows
      doc.font('Helvetica');
      data.forEach((row, rowIndex) => {
        const yPos = headerPosition + 30 + (rowIndex * 20);
        headers.forEach((header, i) => {
          doc.text(row[header]?.toString().substring(0, 30) || '', 50 + i * 120, yPos, { width: 120 });
        });
      });
      
      doc.end();
      
      stream.on('finish', () => resolve(filename));
      stream.on('error', reject);
    });
  },

  /**
   * Generate DOCX
   */
  async generateDOCX(data, filename = 'transactions.docx') {
    const headers = Object.keys(data[0] || {});
    const rows = [headers, ...data.map(row => headers.map(h => row[h] || ''))];
    
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
              children: row.map(cell => new TableCell({
                children: [new Paragraph(cell.toString())],
                width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
              }))
            }))
          })
        ]
      }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filename, buffer);
    return filename;
  },

  /**
   * Generate CSV
   */
  generateCSV(data, filename = 'transactions.csv') {
    const headers = Object.keys(data[0] || {});
    const csv = stringify(data, { header: true, columns: headers });
    fs.writeFileSync(filename, csv);
    return filename;
  }
};
