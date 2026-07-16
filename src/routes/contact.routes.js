import express from 'express';
import Contact from '../models/Contact.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// POST /api/contact - Submit a contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return sendError(res, 'Vui lòng nhập đầy đủ Họ tên, Email, Chủ đề và Nội dung lời nhắn.', 400);
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Địa chỉ email không hợp lệ.', 400);
    }

    const newContact = await Contact.create({
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'unread'
    });

    // Asynchronously send confirmation email to customer (non-blocking)
    sendEmail({
      to: email,
      subject: `[CD Store] Xác nhận nhận được lời nhắn: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">Xin chào ${name},</h2>
          <p>Cảm ơn bạn đã liên hệ với <strong>CD Store</strong>. Chúng tôi đã nhận được lời nhắn của bạn và đội ngũ chăm sóc khách hàng sẽ phản hồi trong thời gian sớm nhất (thường trong vòng 24 giờ làm việc).</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Chủ đề:</strong> ${subject}</p>
            <p style="margin: 0;"><strong>Nội dung:</strong><br />${message.replace(/\n/g, '<br />')}</p>
          </div>
          <p>Trân trọng,<br /><strong>Đội ngũ CD Store</strong></p>
        </div>
      `
    }).catch(err => console.error('Error sending contact confirmation email:', err));

    return sendSuccess(res, newContact, 'Lời nhắn của bạn đã được gửi thành công. Chúng tôi sẽ sớm liên hệ lại với bạn!', 201);
  } catch (error) {
    console.error('Error creating contact message:', error);
    return sendError(res, 'Có lỗi xảy ra khi gửi lời nhắn. Vui lòng thử lại sau.', 500);
  }
});

export default router;
