const mongoose = require("mongoose");

const profilSchema = mongoose.Schema({
  profil: String,
});

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  token: String,
  profil: [profilSchema],
  photo: String,
});

const User = mongoose.model("users", userSchema);
module.exports = User;
