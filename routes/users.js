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

router.post("/addProfil/:token", async (req, res) => {
  const token = req.params.token;
  const profil = req.body.profil;
  try {
    const user = await User.findOneAndUpdate(
      { token },
      { $push: { profil: { profil } } },
      { new: true }
    );
    user
      ? res.json({ result: true, user })
      : res.status(404).json({ result: false, error: "User not found!" });
  } catch (err) {
    next(err);
  }
});

/*get all profil */
router.get("/getAllProfil", async (req, res) => {
  try {
    const users = await User.find({}); // here you could add some filter or query conditions
    users.length > 0
      ? res.json({ result: true, users: users })
      : res.json({ result: false });
  } catch (err) {
    res.json({ result: false, error: err });
  }
});

/*permet de modifier son profil */

router.post("/editProfil/:token", async (req, res) => {
  const token = req.params.token;
  const profil = req.body.profil;
  try {
    // Utilisez la méthode findOneAndUpdate de Mongoose pour trouver et mettre à jour l'utilisateur avec le jeton correspondant
    // L'option { new: true } renvoie l'objet utilisateur mis à jour
    const user = await User.findOneAndUpdate(
      { token },
      { $set: { profil: { profil } } },
      { new: true }
    );
    // Vérifiez si l'utilisateur existe, s'il existe alors retourne l'utilisateur mis à jour avec une réponse de succès, sinon retourne une erreur de non trouvé
    user
      ? res.json({ result: true, user })
      : res.status(404).json({ result: false, error: "User not found!" });
  } catch (err) {
    // s'il y a une erreur, appelez la fonction suivante pour gérer l'erreur
    next(err);
  }
});

router.post("/signup", (req, res) => {
  const { username, email, password, photo } = req.body;
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ username: req.body.username }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(password, 10);
      const newUser = new User({
        username,
        email,
        password: hash,
        token: uid2(32),
        profil: [],
        photo,
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
