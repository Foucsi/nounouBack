var express = require("express");
var router = express.Router();
require("../models/connection");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const User = require("../models/users");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/* permet d'ajouter un prodil */
router.post("/addProfil/:token", (req, res) => {
  const token = req.params.token;
  const profil = req.body.profil;
  User.findOneAndUpdate(
    { token },
    {
      $push: { profil: { profil } },
    }
  )
    .then((data) => {
      if (!data) {
        res.status(404).json({ result: false, error: "User not found!" });
      }
      res.json({ result: true, users: data });
    })
    .catch((err) => {
      res.json({ result: false, error: err });
    });
});

/*get all profil */
router.get("/getAllProfil", (req, res) => {
  User.find().then((data) => {
    res.json({ result: true, users: data });
  });
});

/*permet de modifier son profil */

router.post("/editProfil/:token", (req, res) => {
  const token = req.params.token;
  const profil = req.body.profil;
  User.findOneAndUpdate(
    { token },
    {
      $set: { profil: { profil } },
    }
  )
    .then((data) => {
      if (!data) {
        res.status(404).json({ result: false, error: "User not found!" });
      }
      res.json({ result: true, users: data });
    })
    .catch((err) => {
      res.json({ result: false, error: err });
    });
});

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ username: req.body.username }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        token: uid2(32),
        profil: [],
        photo: req.body.photo,
      });

      newUser.save().then((data) => {
        res.json({ result: true, user: data });
      });
    } else {
      res.json({ result: false, error: "User already exists" });
    }
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  User.findOne({ username: req.body.username }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

module.exports = router;
