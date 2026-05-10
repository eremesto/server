const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, code) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',  
      to: email,
      subject: 'Код подтверждения для STO Helper',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px;">
          <h2>STO Helper</h2>
          <p>Ваш код подтверждения:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center;">${code}</h1>
          <p>Код действителен <strong>5 минут</strong>.</p>
          <hr />
          <small>Если вы не запрашивали код, просто проигнорируйте это письмо.</small>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    console.log(`Email sent to ${email}, id: ${data.id}`);
    return data;
  } catch (err) {
    console.error('Failed to send email:', err);
    throw err;
  }
}

module.exports = { sendVerificationEmail };