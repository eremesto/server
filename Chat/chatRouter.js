const Router = require("express");
const router = new Router();
const Message = require("../models/Message");
const mongoose = require("mongoose");

router.get("/messages/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { login } = req.query;
    if (login) {
      const db = mongoose.connection.db;
      await db.collection("messages").updateMany(
        { applicationId, senderLogin: { $ne: login }, readBy: { $ne: login } },
        { $addToSet: { readBy: login } }
      );
    }
    const messages = await Message.find({ applicationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/send", async (req, res) => {
  try {
    const { applicationId, senderLogin, senderType, text } = req.body;
    if (!applicationId || !senderLogin || !senderType || !text)
      return res.status(400).json({ message: "Заполните все поля" });
    const msg = await Message.create({ applicationId, senderLogin, senderType, text, readBy: [senderLogin] });
    res.json(msg);
  } catch (e) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/unread", async (req, res) => {
  try {
    const { applicationIds, myLogin } = req.body;
    if (!applicationIds?.length) return res.json({ unread: {} });
    const db = mongoose.connection.db;
    const result = {};
    await Promise.all(
      applicationIds.map(async (id) => {
        const count = await db.collection("messages").countDocuments({
          applicationId: id,
          senderLogin: { $ne: myLogin },
          readBy: { $ne: myLogin },
        });
        if (count > 0) result[id] = count;
      })
    );
    res.json({ unread: result });
  } catch (e) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;