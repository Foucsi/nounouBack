const mongoose = require("mongoose");

const avisSchema = mongoose.Schema({
  avis: String,
});

const profilSchema = mongoose.Schema({
  profil: String,
});

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  token: String,
  profil: [profilSchema],
  avis: [avisSchema],
  photo: String,
  price: Number,
});

const User = mongoose.model("users", userSchema);
module.exports = User;
