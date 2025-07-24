import nodemailer from 'nodemailer';
import logger from './logger.js';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: 'ExpenseManager <no-reply@expensemanager.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.logEvent('INFO', `Email sent to ${options.email}`);
  } catch (error) {
    logger.logEvent('ERROR', `Failed to send email to ${options.email}: ${error.message}`);
    throw new Error('Houve um problema ao enviar o email de verificação.');
  }
};

export default sendEmail;