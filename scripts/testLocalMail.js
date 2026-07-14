import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testLocalMail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"CD Store Local Test" <${process.env.SMTP_USER}>`,
      to: 'anhlq1208@gmail.com',
      subject: 'Test Plain Email - ' + new Date().toISOString(),
      text: 'This is a test plain text email to see if it reaches your inbox without HTML filtering.',
    });
    console.log('Message sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testLocalMail();
