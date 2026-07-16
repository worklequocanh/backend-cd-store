import PDFDocument from 'pdfkit';

/**
 * Helper to normalize Vietnamese strings to ASCII to ensure Helvetica renders without missing glyph errors
 */
function removeDiacritics(str) {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x00-\x7F]/g, '');
}

/**
 * Generate a professional PDF invoice for an order and stream it to the Express response
 * @param {Object} order - Mongoose order document with populated items
 * @param {Object} res - Express response object
 */
export const generateInvoicePdf = (order, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe PDF stream to HTTP response
  doc.pipe(res);

  // 1. Header Section
  doc
    .fillColor('#3b82f6')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('CD STORE - CHUYEN DE BACKEND', 50, 50);

  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica')
    .text('High-Quality Music CDs & Vinyl Records', 50, 75)
    .text('Email: support@cdstore.vn | Phone: (028) 3812 3456', 50, 90);

  // Invoice Title & Status
  doc
    .fillColor('#0f172a')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('INVOICE', 400, 50, { align: 'right' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Invoice Number: #${order.invoiceNumber || order._id.toString().slice(-6).toUpperCase()}`, 350, 75, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 350, 90, { align: 'right' });

  // Payment Status Badge
  const statusText = order.paymentStatus === 'completed' ? 'PAID / COMPLETED' : order.paymentStatus.toUpperCase();
  const badgeColor = order.paymentStatus === 'completed' ? '#10b981' : '#f59e0b';
  doc
    .fillColor(badgeColor)
    .font('Helvetica-Bold')
    .text(`Status: ${statusText}`, 350, 105, { align: 'right' });

  // Divider Line
  doc
    .moveTo(50, 130)
    .lineTo(545, 130)
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .stroke();

  // 2. Customer & Shipping Details
  doc
    .fillColor('#0f172a')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('BILL TO & SHIPPING INFO', 50, 145);

  const customerName = removeDiacritics(order.shippingAddress?.fullName || order.userId?.name || 'Valued Customer');
  const phone = order.shippingAddress?.phone || 'N/A';
  const address = removeDiacritics(`${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}`);
  const paymentMethod = removeDiacritics(order.paymentMethod || 'Bank Transfer');

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Customer Name: ${customerName}`, 50, 165)
    .text(`Phone Number: ${phone}`, 50, 180)
    .text(`Shipping Address: ${address}`, 50, 195)
    .text(`Payment Method: ${paymentMethod}`, 50, 210);

  // 3. Table Header
  const tableTop = 245;
  doc
    .rect(50, tableTop, 495, 25)
    .fill('#f8fafc');

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Item Description', 60, tableTop + 8)
    .text('Variant', 280, tableTop + 8)
    .text('Price', 360, tableTop + 8, { width: 60, align: 'right' })
    .text('Qty', 430, tableTop + 8, { width: 30, align: 'right' })
    .text('Total', 470, tableTop + 8, { width: 65, align: 'right' });

  // Table Rows
  let yPosition = tableTop + 35;
  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      const productName = removeDiacritics(item.productId?.name || item.name || 'Audio CD Product');
      const variant = removeDiacritics(item.variant || 'Standard');
      const price = Number(item.price || 0).toLocaleString('en-US');
      const qty = item.quantity || 1;
      const total = (Number(item.price || 0) * qty).toLocaleString('en-US');

      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .text(productName.slice(0, 40), 60, yPosition)
        .text(variant, 280, yPosition)
        .text(`${price} VND`, 360, yPosition, { width: 60, align: 'right' })
        .text(`${qty}`, 430, yPosition, { width: 30, align: 'right' })
        .text(`${total} VND`, 470, yPosition, { width: 65, align: 'right' });

      yPosition += 20;

      // Subtle row divider
      doc
        .moveTo(50, yPosition - 5)
        .lineTo(545, yPosition - 5)
        .strokeColor('#f1f5f9')
        .lineWidth(0.5)
        .stroke();
    });
  }

  // 4. Summary & Totals
  yPosition = Math.max(yPosition + 15, 400);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#475569')
    .text('Subtotal:', 360, yPosition, { width: 80, align: 'right' })
    .text(`${Number(order.totalAmount + (order.discountAmount || 0) - (order.shippingFee || 0)).toLocaleString('en-US')} VND`, 450, yPosition, { width: 85, align: 'right' });

  yPosition += 18;
  doc
    .text('Shipping Fee:', 360, yPosition, { width: 80, align: 'right' })
    .text(`${Number(order.shippingFee || 0).toLocaleString('en-US')} VND`, 450, yPosition, { width: 85, align: 'right' });

  if (order.discountAmount > 0) {
    yPosition += 18;
    doc
      .fillColor('#10b981')
      .text('Discount:', 360, yPosition, { width: 80, align: 'right' })
      .text(`-${Number(order.discountAmount).toLocaleString('en-US')} VND`, 450, yPosition, { width: 85, align: 'right' })
      .fillColor('#475569');
  }

  yPosition += 22;
  doc
    .rect(350, yPosition - 5, 195, 28)
    .fill('#f8fafc');

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Final Total:', 360, yPosition + 3, { width: 80, align: 'right' })
    .fillColor('#3b82f6')
    .text(`${Number(order.totalAmount || 0).toLocaleString('en-US')} VND`, 450, yPosition + 3, { width: 85, align: 'right' });

  // 5. Footer Notes
  const footerY = 740;
  doc
    .moveTo(50, footerY)
    .lineTo(545, footerY)
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .stroke();

  doc
    .fillColor('#64748b')
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text('Thank you for shopping at CD Store Chuyen De Backend! We hope you enjoy your music.', 50, footerY + 15, { align: 'center', width: 495 });

  doc.end();
};

export default generateInvoicePdf;
