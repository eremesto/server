const mongoose = require("mongoose");
const Service = require("../models/AutoService");
const User = require("../models/User");
const Assistance = require("../models/Services");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { secret } = require("../config");
const Services = require("../models/Services");

const handleResponse = (res, data, errorMessage) => {
  if (!data || data.length === 0) {
    return res.status(404).json({ message: errorMessage });
  }
  return res.status(200).json(data);
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, secret, { expiresIn: "24h" });
};

class userController {
  // ========== ИЗМЕНЁННЫЙ МЕТОД РЕГИСТРАЦИИ ==========
  async registrationUser(req, res) {
    try {
      const { tempToken, password } = req.body;
      if (!tempToken) {
        return res.status(400).json({ message: "Требуется подтверждение email" });
      }

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

      const existingUser = await User.findOne({ login: email });
      const existingService = await Service.findOne({ login: email });
      if (existingUser || existingService) {
        return res.status(400).json({ message: "Этот email уже зарегистрирован" });
      }

      const hashPassword = await bcrypt.hash(password, 7);
      const user = new User({ login: email, password: hashPassword });
      await user.save();

      const token = generateAccessToken(user._id);
      return res.json({ user, token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Ошибка регистрации" });
    }
  }

  // ========== ОСТАЛЬНЫЕ МЕТОДЫ (БЕЗ ИЗМЕНЕНИЙ) ==========
  async loginUser(req, res) {
    try {
      const { login, password } = req.body;
      if (!login || !password) {
        return res.status(400).json({ message: "Необходимо ввести логин и пароль" });
      }
      const user = await User.findOne({ login });
      if (!user) {
        return res.status(400).json({ message: `Пользователь с логином ${login} не найден` });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Неверный пароль" });
      }
      const token = generateAccessToken(user._id);
      return res.json({ user, token });
    } catch (error) {
      console.error("Ошибка авторизации:", error.message);
      return res.status(500).json({ message: "Ошибка авторизации" });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await User.find();
      handleResponse(res, users, "Пользователи не найдены");
    } catch (error) {
      console.error("Ошибка при получении пользователей:", error.message);
      return res.status(500).json({ message: "Ошибка сервера при получении пользователей" });
    }
  }

  async getServices(req, res) {
    try {
      const assistance = await Services.find();
      handleResponse(res, assistance, "Сервисы не найдены");
    } catch (error) {
      console.error("Ошибка при получении сервисов:", error.message);
      return res.status(500).json({ message: "Ошибка сервера при получении сервисов" });
    }
  }

  async sendApplication(req, res) {
    try {
      const { nameService, login, listAssistances, date, time } = req.body;
      const service = await Service.findOne({ nameService });
      if (!service) {
        return res.status(400).json({ message: `Сервис ${nameService} не найден` });
      }
      service.application.push({ login, listAssistances, date, time });
      await service.save();
      return res.json({ message: "Заявка успешно отправлена" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Ошибка при отправке заявки" });
    }
  }

  async addFavorite(req, res) {
    try {
      const { login, serviceId } = req.body;
      const user = await User.findOne({ login });
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });
      const objectId = new mongoose.Types.ObjectId(serviceId);
      if (!user.favorites.some(id => id.toString() === serviceId)) {
        user.favorites.push(objectId);
        await user.save();
      }
      return res.json({ favorites: user.favorites });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async removeFavorite(req, res) {
    try {
      const { login, serviceId } = req.body;
      const user = await User.findOne({ login });
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });
      user.favorites = user.favorites.filter(id => id.toString() !== serviceId);
      await user.save();
      return res.json({ favorites: user.favorites });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async addSearchHistory(req, res) {
    try {
      const { login, query } = req.body;
      const user = await User.findOne({ login });
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });
      user.searchHistory = [query, ...user.searchHistory.filter((q) => q !== query)].slice(0, 20);
      await user.save();
      return res.json({ searchHistory: user.searchHistory });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async updateProfile(req, res) {
  try {
    const { login, displayName, bio, city, birthDate, phone, carBrand, carModel, carYear, carNumber, vinNumber } = req.body;
    const user = await User.findOne({ login });
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });
    
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (city !== undefined) user.city = city;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (phone !== undefined) user.phone = phone;
    if (carBrand !== undefined) user.carBrand = carBrand;
    if (carModel !== undefined) user.carModel = carModel;
    if (carYear !== undefined) user.carYear = carYear;
    if (carNumber !== undefined) user.carNumber = carNumber;
    if (vinNumber !== undefined) user.vinNumber = vinNumber;
    
    await user.save();
    return res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка сервера" });
  }
}

  async addMyApplication(req, res) {
  try {
    const { login, serviceId, serviceName, listAssistances, date, time, declarationId, carInfo } = req.body;
    const user = await User.findOne({ login });
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });

    // Добавляем личную информацию пользователя
    const fullCarInfo = {
      ...carInfo,
      displayName: user.displayName || login,
      bio: user.bio || "",
      city: user.city || "",
      birthDate: user.birthDate || "",
    };

    const [dd, mm, yyyy] = date.split(".");
    const parsedDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    user.myApplications.push({ 
      serviceId, 
      serviceName, 
      listAssistances, 
      date: parsedDate, 
      time, 
      declarationId, 
      carInfo: fullCarInfo 
    });
    await user.save();
    return res.json({ myApplications: user.myApplications });
  } catch (e) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
}

  async getFavoriteServices(req, res) {
    try {
      const { login } = req.body;
      const user = await User.findOne({ login });
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });
      const AutoService = require("../models/AutoService");
      const services = await AutoService.find({ _id: { $in: user.favorites } });
      return res.json({ services });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async migrateUsers(req, res) {
    try {
      await User.updateMany(
        { favorites: { $exists: false } },
        { $set: { favorites: [], searchHistory: [], myApplications: [], phone: "", carBrand: "", carModel: "", carYear: "", carNumber: "", vinNumber: "" } }
      );
      res.json({ message: "Миграция выполнена" });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  async updateApplicationStatus(req, res) {
    try {
      const { login, declarationId, status } = req.body;
      const user = await User.findOne({ login });
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });
      const app = user.myApplications.find(a => a.declarationId === declarationId);
      if (app) { app.status = status; await user.save(); }
      return res.json({ message: "Статус обновлён" });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }

  async cancelApplication(req, res) {
    try {
      const { login, declarationId } = req.body;
      const user = await User.findOne({ login });
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });
      user.myApplications = user.myApplications.filter(a => a.declarationId !== declarationId);
      await user.save();
      const AutoService = require("../models/AutoService");
      const service = await AutoService.findOne({ "declaration._id": declarationId });
      if (service) {
        service.declaration = service.declaration.filter(d => d._id.toString() !== declarationId);
        await service.save();
      }
      return res.json({ myApplications: user.myApplications });
    } catch (e) {
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
}

module.exports = new userController();