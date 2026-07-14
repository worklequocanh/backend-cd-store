import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    // We only create transporter if environment variables are provided
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Mail config missing. Skipping email send to:', to);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"CD Store" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const getOrderConfirmationEmailTemplate = (order, user) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Order Confirmation</h2>
      <p>Hello ${user.name},</p>
      <p>Thank you for your order! We've received your order <strong>#${order.orderNumber}</strong> and are getting it ready.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <p><strong>Total:</strong> $${order.total}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
        <p><strong>Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
      </div>

      <p>We'll notify you when it ships.</p>
      <p>Best regards,<br>CD Store Team</p>
    </div>
  `;
};
