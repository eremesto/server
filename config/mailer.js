const { Resend } = require('resend');

// Сопоставляем email-адреса с соответствующими API-ключами
const emailToApiKey = {
  'solvenbause@gmail.com': process.env.RESEND_API_KEY_1,
  'solvenbause+service@gmail.com': process.env.RESEND_API_KEY_2,
};

async function sendVerificationEmail(email, code) {
  // По умолчанию считаем, что письмо отправлять не будем (будет fallback)
  let sent = false;
  let errorMessage = null;

  // Проверяем, есть ли специальный ключ для этого email
  const apiKey = emailToApiKey[email];
  if (apiKey) {
    const resend = new Resend(apiKey);
    try {
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Код подтверждения для STO Helper',
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px;">
          <h2>STO Helper</h2>
          <p>Ваш код подтверждения:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center;">${code}</h1>
          <p>Код действителен <strong>5 минут</strong>.</p>
          <hr />
          <small>Если вы не запрашивали код, просто проигнорируйте это письмо.</small>
        </div>`,
      });
      if (error) {
        errorMessage = error.message;
        console.error(`Resend error for ${email}:`, error);
      } else {
        sent = true;
        console.log(`✅ Email sent to ${email}, id: ${data.id}`);
      }
    } catch (err) {
      errorMessage = err.message;
      console.error(`Exception sending to ${email}:`, err);
    }
  } else {
    console.log(`ℹ️ No dedicated API key for ${email}, skipping real email.`);
  }

  // ВСЕГДА выводим код в консоль (для отладки и fallback)
  console.log('\n========== КОД ПОДТВЕРЖДЕНИЯ ==========');
  console.log(`📧 Email: ${email}`);
  console.log(`🔢 Код:   ${code}`);
  console.log(`📬 Реальное письмо: ${sent ? '✅ отправлено' : '❌ не отправлено (код только в логах)'}`);
  if (errorMessage) console.log(`❗ Причина: ${errorMessage}`);
  console.log('=======================================\n');

  // Не выбрасываем ошибку, чтобы регистрация продолжалась даже при проблемах с почтой
  return { sent, code };
}

module.exports = { sendVerificationEmail };