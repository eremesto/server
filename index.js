require('dotenv').config(); // В САМОМ ВЕРХУ

const express = require("express");
const mongoose = require("mongoose");

// Импорты роутеров
const userRouter = require("./User/userRouter");
const serviceRouter = require("./AutoService/autoServiceRouter");
const chatRouter = require("./Chat/chatRouter");
const verificationRouter = require("./routes/verificationRouter");

const PORT = process.env.PORT || 3000;

// СОЗДАЁМ app ДО ТОГО, КАК ИСПОЛЬЗУЕМ
const app = express();

app.use(express.json());

// Лог всех входящих запросов
app.use((req, res, next) => {
  console.log(`>>> ${req.method} ${req.url}`, JSON.stringify(req.body));
  next();
});

// ПОДКЛЮЧАЕМ РОУТЕРЫ (теперь app уже существует)
app.use("/user", userRouter);
app.use("/service", serviceRouter);
app.use("/chat", chatRouter);
app.use("/verification", verificationRouter);

// 404 и обработка ошибок
app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found: ${req.method} ${req.url}` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});

// Подключение к MongoDB
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<db_username>:<BHHaD853LCvGYjXA>@cluster0.vlcj51k.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGO_URI, { writeConcern: { w: 1 } });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
};

start();