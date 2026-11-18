import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (process.env.NODE_ENV === 'test' || !process.env.SMTP_USER || process.env.SMTP_USER === 'test_user') {
      console.log(`[EMAIL DISPATCH - DEV/DEMO MODE] To: ${to} | Subject: ${subject}`);
      return { messageId: 'simulated-email-' + Date.now() };
    }

    const t = getTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || 'CollabSpace <noreply@collabspace.io>',
      to,
      subject,
      text: text || '',
      html
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.warn(`Email delivery notice: ${error.message}`);
    return null;
  }
};
