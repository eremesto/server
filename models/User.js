const { Schema, model } = require("mongoose");

const User = new Schema({
  login: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  displayName: { type: String, default: "" },        // ← новое поле (имя)
  bio: { type: String, default: "" },               // ← новое поле (о себе)
  city: { type: String, default: "" },              // ← новое поле (город)
  birthDate: { type: String, default: "" },         // ← новое поле (дата рождения)
  phone: { type: String, default: "" },
  carBrand: { type: String, default: "" },
  carModel: { type: String, default: "" },
  carYear: { type: String, default: "" },
  carNumber: { type: String, default: "" },
  vinNumber: { type: String, default: "" },
  favorites: [{ type: Schema.Types.ObjectId, ref: "AutoService" }],
  searchHistory: [{ type: String }],
  myApplications: [
    {
      serviceId: { type: Schema.Types.ObjectId, ref: "AutoService" },
      serviceName: String,
      listAssistances: [String],
      date: { type: Date },
      time: String,
      declarationId: String,
      carInfo: {
        phone: { type: String, default: "" },
        carBrand: { type: String, default: "" },
        carModel: { type: String, default: "" },
        carYear: { type: String, default: "" },
        carNumber: { type: String, default: "" },
        vinNumber: { type: String, default: "" },
        displayName: { type: String, default: "" },  // ← новое поле в carInfo
        bio: { type: String, default: "" },
        city: { type: String, default: "" },
        birthDate: { type: String, default: "" },
      },
      status: { type: String, enum: ["active", "done"], default: "active" },
      createdAt: { type: Date, default: Date.now },
    }
  ],
});

module.exports = model("User", User);