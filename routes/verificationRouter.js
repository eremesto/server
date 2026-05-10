const Router = require('express');
const router = new Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const VerificationCode = require('../models/VerificationCode');
const User = require('../models/User');
const AutoService = require('../models/AutoService');
const { sendVerificationEmail } = require('../config/mailer'); 
const { secret } = require('../config');

// Функция генерации 6-значного кода
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. Отправка кода
router.post('/send-code', async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ message: 'Email и цель обязательны' });
    }

    // Проверка для регистрации
    if (purpose === 'registration') {
      const userExists = await User.findOne({ login: email });
      const serviceExists = await AutoService.findOne({ login: email });
      if (userExists || serviceExists) {
        return res.status(400).json({ message: 'Этот email уже зарегистрирован' });
      }
    } 
    // Проверка для сброса пароля
    else if (purpose === 'reset-password') {
      const userExists = await User.findOne({ login: email });
      const serviceExists = await AutoService.findOne({ login: email });
      if (!userExists && !serviceExists) {
        return res.status(404).json({ message: 'Пользователь с таким email не найден' });
      }
    } 
    else {
      return res.status(400).json({ message: 'Некорректная цель' });
    }

    // Удаляем старые коды
    await VerificationCode.deleteMany({ email });

    // Генерируем случайный код
    const code = generateCode();
    await VerificationCode.create({ email, code });

    // ✅ ВРЕМЕННО: печатаем код в консоль вместо отправки email
    console.log('\n========== КОД ПОДТВЕРЖДЕНИЯ ==========');
    console.log(`Email: ${email}`);
    console.log(`Код:   ${code}`);
    console.log('=======================================\n');

    
    await sendVerificationEmail(email, code);

    res.json({ message: 'Код отправлен на email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при отправке кода' });
  }
});

// 2. Подтверждение кода и получение временного токена
router.post('/confirm-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await VerificationCode.findOne({ email, code });
    if (!record) {
      return res.status(400).json({ message: 'Неверный или просроченный код' });
    }
    await VerificationCode.deleteOne({ _id: record._id });

    const tempToken = jwt.sign({ email, purpose: 'registration' }, secret, { expiresIn: '5m' });
    res.json({ tempToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка подтверждения кода' });
  }
});

// 3. Сброс пароля
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
    const record = await VerificationCode.findOne({ email, code });
    if (!record) {
      return res.status(400).json({ message: 'Неверный или просроченный код' });
    }
    await VerificationCode.deleteOne({ _id: record._id });

    let account = await User.findOne({ login: email });
    if (!account) {
      account = await AutoService.findOne({ login: email });
    }
    if (!account) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 7);
    account.password = hashedPassword;
    await account.save();

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сброса пароля' });
  }
});

module.exports = router;