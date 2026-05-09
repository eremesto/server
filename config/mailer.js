const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendVerificationEmail(email, code) {
  // Создаём новый транспорт для каждого письма
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Добавляем таймауты на всякий случай
    connectionTimeout: 15000,
    socketTimeout: 15000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"STO Helper" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Код подтверждения для STO Helper',
      text: `Ваш код подтверждения: ${code}\nКод действителен 5 минут.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 500px;">
          <h2>STO Helper</h2>
          <p>Ваш код подтверждения:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center;">${code}</h1>
          <p>Код действителен <strong>5 минут</strong>.</p>
          <hr />
          <small>Если вы не запрашивали код, просто проигнорируйте это письмо.</small>
        </div>`,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw error;
  } finally {
    // Закрываем соединение, чтобы не висеть
    transporter.close();
  }
}

module.exports = { sendVerificationEmail };