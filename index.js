require('dotenv').config(); // ДОБАВИТЬ В САМОМ ВЕРХУ

const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const Services = require("./models/AutoService");

const PORT = process.env.PORT || 3000;
const userRouter = require("./User/userRouter");
const serviceRouter = require("./AutoService/autoServiceRouter");
const chatRouter = require("./Chat/chatRouter");
const verificationRouter = require("./routes/verificationRouter"); // НОВЫЙ ИМПОРТ

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`>>> ${req.method} ${req.url}`, JSON.stringify(req.body));
  next();
});

app.use("/user", userRouter);
app.use("/service", serviceRouter);
app.use("/chat", chatRouter);
app.use("/verification", verificationRouter); // НОВЫЙ МАРШРУТ

app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found: ${req.method} ${req.url}` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/StoHelperBackendRemastered", {
      writeConcern: { w: 1 }
    });
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