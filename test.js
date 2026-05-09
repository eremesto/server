const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/StoHelperBackendRemastered")
  .then(async () => {
    const db = mongoose.connection.db;
    
    // Смотрим сообщения от user1
    const msgs = await db.collection("messages").find({ senderLogin: "user1" }).limit(3).toArray();
    console.log("Сообщения user1:", JSON.stringify(msgs, null, 2));
    
    // Пробуем нативный updateMany
    const result = await db.collection("messages").updateMany(
      { senderLogin: "user1" },
      { $addToSet: { readBy: "AutoPower" } }
    );
    console.log("Native result:", JSON.stringify(result));
    
    process.exit(0);
  }).catch(e => { console.error(e); process.exit(1); });