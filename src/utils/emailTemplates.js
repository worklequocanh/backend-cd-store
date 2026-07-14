const brandColor = '#4f46e5'; // Brand-600
const brandName = 'CD Store';

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">${brandName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                © ${new Date().getFullYear()} ${brandName}. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8;">
                This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const getWelcomeEmail = (name) => {
  const content = `
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0;">Welcome to ${brandName}! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">We are absolutely thrilled to have you on board! Your account has been successfully created.</p>
    <p style="font-size: 16px; line-height: 1.6;">Get ready to explore our exclusive collection of CDs and enjoy a premium shopping experience.</p>
    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/shop" style="background-color: ${brandColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Start Shopping Now</a>
    </div>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Best regards,<br>The ${brandName} Team</p>
  `;
  return baseTemplate(`Welcome to ${brandName}`, content);
};

export const getLoginAlertEmail = (name, loginTime) => {
  const content = `
    <h2 style="color: #ef4444; font-size: 24px; margin-top: 0;">Security Alert: New Login</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">We noticed a new login to your ${brandName} account on <strong>${loginTime}</strong>.</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="margin: 0; color: #991b1b; font-size: 15px;">If this was you, you can safely ignore this email.</p>
    </div>
    <p style="font-size: 16px; line-height: 1.6;">If you did not log in, please secure your account by changing your password immediately and contacting our support team.</p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Stay safe,<br>The ${brandName} Security Team</p>
  `;
  return baseTemplate('Security Alert - New Login', content);
};

export const getOtpEmail = (otp) => {
  const content = `
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0;">Password Reset Request</h2>
    <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password for your ${brandName} account.</p>
    <p style="font-size: 16px; line-height: 1.6;">Please use the following One-Time Password (OTP) to proceed:</p>
    <div style="text-align: center; margin: 35px 0;">
      <div style="background-color: #f1f5f9; border: 2px dashed ${brandColor}; color: ${brandColor}; padding: 20px 40px; border-radius: 12px; font-weight: 800; font-size: 32px; letter-spacing: 4px; display: inline-block;">
        ${otp}
      </div>
    </div>
    <p style="font-size: 15px; color: #64748b; line-height: 1.6;">This OTP is valid for the next <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
  `;
  return baseTemplate('Your Password Reset OTP', content);
};

export const getProfileUpdateEmail = (name) => {
  const content = `
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0;">Profile Updated</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">This is a quick notification to let you know that your profile information (such as name, phone, address, or avatar) has been successfully updated.</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="margin: 0; color: #1e3a8a; font-size: 15px;">For your security, we don't display the updated details in this email. You can review your changes by logging into your account.</p>
    </div>
    <p style="font-size: 16px; line-height: 1.6;">If you did not make these changes, please contact support immediately to secure your account.</p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Best regards,<br>The ${brandName} Team</p>
  `;
  return baseTemplate('Security Alert - Profile Updated', content);
};

export const getOrderStatusEmail = (order, user) => {
  const statusColors = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444'
  };
  const statusColor = statusColors[order.orderStatus] || '#64748b';
  
  const content = `
    <h2 style="color: #0f172a; font-size: 24px; margin-top: 0;">Order Status Update</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${user.name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">There is an update on your order <strong>#${order.orderNumber}</strong>.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 16px; color: #0f172a; font-size: 18px;">Order Summary</h3>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;">Order Total</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold; text-align: right;">$${order.total?.toFixed(2) || order.total}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Payment Method</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold; text-align: right;">${order.paymentMethod === 'qr' ? 'PayOS' : 'COD'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Payment Status</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold; text-align: right; text-transform: uppercase;">${order.paymentStatus}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 4px; color: #64748b; font-weight: 600;">Current Order Status</td>
          <td style="padding: 12px 0 4px; text-align: right;">
            <span style="background-color: ${statusColor}15; color: ${statusColor}; padding: 6px 12px; border-radius: 99px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${order.orderStatus}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">You can track your order details anytime by logging into your account.</p>
    <div style="text-align: center; margin: 30px 0 10px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">View Order Details</a>
    </div>
  `;
  return baseTemplate(`Update on Order #${order.orderNumber}`, content);
};
