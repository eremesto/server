const AutoService = require("../models/AutoService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { secret } = require("../config");
const User = require("../models/User");

const generateAccessToken = (id) => {
  return jwt.sign({ id }, secret, { expiresIn: "24h" });
};

class authController {
  // ========== ИЗМЕНЁННЫЙ МЕТОД РЕГИСТРАЦИИ ==========
  async registration(req, res) {
  try {
    const { tempToken, password, nameService, webAddress, startOfWork, endOfWork, telephoneNumber, city, address, services } = req.body;
    if (!tempToken) return res.status(400).json({ message: "Требуется подтверждение email" });

    let payload;
    try {
      payload = jwt.verify(tempToken, secret);
    } catch (err) {
      return res.status(401).json({ message: "Недействительный или просроченный токен подтверждения" });
    }
    if (payload.purpose !== "registration") {
      return res.status(400).json({ message: "Неверное использование токена" });
    }
    const email = payload.email;

    // Проверка уникальности
    const existingService = await AutoService.findOne({ login: email });
    const existingUser = await User.findOne({ login: email });
    if (existingService || existingUser) {
      return res.status(400).json({ message: "Этот email уже зарегистрирован" });
    }

    const hashPassword = bcrypt.hashSync(password, 7);
    const newService = new AutoService({
      login: email,                             // <-- ЭТА СТРОКА БЫЛА ПРОПУЩЕНА
      password: hashPassword,
      nameService,
      webAddress,
      startOfWork,
      endOfWork,
      telephoneNumber,
      city,
      address,
      services: services || [],
      servicePrices: {},
      reviews: [],
      declaration: [],
    });

    await newService.save();
    const token = generateAccessToken(newService._id);
    return res.json({ service: newService, token });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Ошибка регистрации" });
  }
}

  // ========== ОСТАЛЬНЫЕ МЕТОДЫ (БЕЗ ИЗМЕНЕНИЙ, КРОМЕ login) ==========
  async login(req, res) {
    try {
      const { login, password } = req.body;
      const service = await AutoService.findOne({ login });
      if (!service) {
        return res.status(400).json({ message: `Сервис с логином ${login} не найден` });
      }
      const validPassword = bcrypt.compareSync(password, service.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Введен неверный пароль" });
      }
      const token = generateAccessToken(service._id);
      return res.json({ service, token });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ошибка авторизации" });
    }
  }

  async getService(req, res) {
    try {
      const { assistanceServices } = req.body;
      const services = await AutoService.find({ services: { $in: assistanceServices } });
      res.json(services);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async getReviews(req, res) {
    try {
      // ВАЖНО: в оригинале была ошибка – используется Service, надо AutoService
      const { nameService } = req.body;
      const services = await AutoService.find({ nameService });
      const reviewsArray = services.flatMap((service) => service.reviews);
      res.json(reviewsArray);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  }

  async addReview(req, res) {
    try {
      const { review, login, nameService } = req.body;
      const existingService = await AutoService.findOne({ nameService });
      const user = await User.findOne({ login });
      if (existingService && user) {
        existingService.reviews.push({ review, userName: login });
        await existingService.save();
        res.status(200).json({ success: true, message: "Отзыв успешно добавлен" });
      } else {
        return res.status(404).json({ success: false, message: "Запись сервиса или пользователь не найдены" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Произошла ошибка при добавлении отзыва" });
    }
  }

  async getApplication(req, res) {
    try {
      const { nameService, login } = req.body;
      const existingService = await AutoService.findOne({ nameService });
      if (existingService) {
        const applications = existingService.declaration; // исправлено: declaration, а не application
        const isSent = applications.some(app => app.login === login);
        res.status(200).json(isSent);
      } else {
        return res.status(404).json({ success: false, message: "Запись сервиса не найдена" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Ошибка получения заявок" });
    }
  }

  async updateProfile(req, res) {
    try {
      const { id, city, telephoneNumber, webAddress, address, startOfWork, endOfWork, services, servicePrices } = req.body;
      const updateData = { city, telephoneNumber, webAddress, address, startOfWork, endOfWork, services };
      if (servicePrices && typeof servicePrices === "object") {
        updateData.servicePrices = servicePrices;
      }
      const updatedService = await AutoService.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      if (!updatedService) return res.status(404).json({ message: "Сервис не найден" });
      return res.json({ service: updatedService });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ошибка обновления профиля" });
    }
  }

  async sendApplication(req, res) {
  try {
    const { serviceId, login, listAssistances, date, time, carInfo } = req.body;
    const service = await AutoService.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Сервис не найден" });

    // Получаем данные пользователя (для личной информации)
    const user = await User.findOne({ login });
    const personalInfo = {
      displayName: user?.displayName || login,
      bio: user?.bio || "",
      city: user?.city || "",
      birthDate: user?.birthDate || "",
      phone: user?.phone || "",
      carBrand: user?.carBrand || "",
      carModel: user?.carModel || "",
      carYear: user?.carYear || "",
      carNumber: user?.carNumber || "",
      vinNumber: user?.vinNumber || "",
    };

    // Проверка рабочих часов (уже есть)
    const startHour = parseInt(service.startOfWork.split(":")[0]);
    const startMin = parseInt(service.startOfWork.split(":")[1]);
    const endHour = parseInt(service.endOfWork.split(":")[0]);
    const endMin = parseInt(service.endOfWork.split(":")[1]);
    const [timeHour, timeMin] = time.split(":").map(Number);
    const timeMinutes = timeHour * 60 + timeMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    if (!(service.startOfWork === "00:00" && service.endOfWork === "23:59")) {
      if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
        return res.status(400).json({ message: `Сервис работает с ${service.startOfWork} до ${service.endOfWork}. Выберите другое время.` });
      }
    }

    const [dd, mm, yyyy] = date.split(".");
    const parsedDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    
    // Сохраняем в declaration вместе с личной информацией
    service.declaration.push({ 
      login, 
      listAssistances, 
      date: parsedDate, 
      time, 
      carInfo: { ...personalInfo, ...carInfo } // объединяем
    });
    await service.save();
    const decl = service.declaration[service.declaration.length - 1];
    return res.json({ message: "Заявка успешно отправлена", declarationId: decl._id });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Ошибка при отправке заявки" });
  }
}

  async getServiceById(req, res) {
    try {
      const { id } = req.body;
      const service = await AutoService.findById(id);
      if (!service) return res.status(404).json({ message: "Сервис не найден" });
      return res.json({ service });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async updateDeclarationStatus(req, res) {
    try {
      const { serviceId, declarationId, status } = req.body;
      const service = await AutoService.findById(serviceId);
      if (!service) return res.status(404).json({ message: "Сервис не найден" });
      const declaration = service.declaration.id(declarationId);
      if (!declaration) return res.status(404).json({ message: "Заявка не найдена" });
      declaration.status = status;
      await service.save();
      return res.json({ service });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async getBookedSlots(req, res) {
    try {
      const { serviceId, date } = req.body;
      const service = await AutoService.findById(serviceId);
      if (!service) return res.status(404).json({ message: "Сервис не найден" });
      const [dd, mm, yyyy] = date.split(".");
      const targetDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
      const bookedTimes = service.declaration
        .filter(d => {
          if (!d.date || d.status === "done") return false;
          const dDate = new Date(d.date);
          return dDate.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10);
        })
        .map(d => d.time);
      return res.json({ bookedTimes });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
}

module.exports = new authController();
