const { Schema, model } = require("mongoose");

const Services = new Schema({
  name: { type: String, unique: true, required: true },
  urlServices: { type: String, required: true },
});

module.exports = model("Services", Services);
