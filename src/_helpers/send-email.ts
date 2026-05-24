// src/_helpers/send-email.ts
import 'dotenv/config';
import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || testAccount.user,
    to,
    subject,
    html
  });

  console.log('📧 ========== EMAIL ==========');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  console.log('📧 ============================');
}