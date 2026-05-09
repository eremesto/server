const mongoose = require("mongoose");

const autoServiceSchema = new mongoose.Schema({
  login: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  nameService: { type: String, required: true, unique: true },
  webAddress: { type: String, required: true },
  startOfWork: { type: String, required: true },
  endOfWork: { type: String, required: true },
  telephoneNumber: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  services: [{ type: String }],
  reviews: [
    {
      review: String,
      userName: String,
    },
  ],
  declaration: [
    {
      login: String,
      listAssistances: [String],
      date: { type: Date },
      time: String,
      carInfo: {
        phone: { type: String, default: "" },
        carBrand: { type: String, default: "" },
        carModel: { type: String, default: "" },
        carYear: { type: String, default: "" },
        carNumber: { type: String, default: "" },
        vinNumber: { type: String, default: "" },
      },
      status: { type: String, enum: ["active", "done"], default: "active" },
    },
  ],
});

const AutoService = mongoose.model("AutoService", autoServiceSchema);
module.exports = AutoService;