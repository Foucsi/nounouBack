var express = require("express");
var router = express.Router();
require("../models/connection");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const cloudinary = require("cloudinary").v2;
const uniqid = require("uniqid");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const User = require("../models/users");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/*recupere les info d'un user avec en parametre son token */
router.get("/getInfo/:token", async (req, res) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({ token });
    user
      ? res.json({ result: true, user })
      : res.status(404).json({ result: false, error: "User not found!" });
  } catch (err) {
    next(err);
  }
});

/*route qui mermet de modifier le price */
router.put("/updatePrice/:token", async (req, res) => {
  const token = req.params.token;
  const price = req.body.price;
  try {
    const user = await User.findOneAndUpdate(
      { token },
      {
        $set: { price: price },
      },
      { new: true }
    );
    user
      ? res.json({ result: true, user })
      : res.status(404).json({ result: false, error: "User not found" });
  } catch (err) {
    next(err);
  }
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
        price: 0,
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

/*ajoute une photo de profil */
router.post("/addPhoto/:token", (req, res) => {
  const token = req.params.token;
  const photo = req.body.photo;
  User.findOneAndUpdate({ token }, { $set: { photo: photo } })
    .then((data) => {
      if (!data) {
        res.status(404).json({ result: false, error: "User note found" });
      }
      res.json({ result: true, data: data });
    })
    .catch((err) => {
      res.status(500).json({ result: false, error: err });
    });
});

/* recupere la photo en db */
router.get("/getPhoto/:username", (req, res) => {
  const username = req.params.username;
  User.findOne({ username }).then((data) => {
    if (data) {
      res.json({ result: true, data: data.photo });
    }
  });
});

/* enregistrement sur cloudinary de la photo */
router.put("/upload/:token", async (req, res) => {
  const photoPath = `./tmp/${uniqid()}.jpg`;
  console.log("req.file", req.files.userPhoto);
  const resultMove = await req.files.userPhoto.mv(photoPath);
  console.log("resultMove", resultMove);
  if (!resultMove) {
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);
    User.findOneAndUpdate(
      { token: req.params.token },
      //The $set operator is a MongoDB operator that is used to update specific fields in a document. It replaces the value of a field with the specified value.
      { $set: { photo: resultCloudinary.secure_url } },
      //The new: true option is used in MongoDB to specify that the updated document should be returned in the response.
      { new: true }
    ).then((updatedUser) => {
      if (!updatedUser) {
        res.json({ error: "User not found" });
      } else {
        res.json({ result: true, user: updatedUser });
      }
    });
    fs.unlinkSync(photoPath);
  }
});

module.exports = router;
