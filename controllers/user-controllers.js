const connection = require("../database/mysql");
const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const logIn = async (req, res, next) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  const [existingUser] = await connection.query(sql, [username]);

  if (!existingUser) {
    const error = new Error("Λάθος όνομα χρήστη ή κωδικός πρόσβασης.");
    error.status = 403;
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser[0].password);
  } catch (err) {
    console.log(err);
    const error = new Error("Λάθος όνομα χρήστη ή κωδικός πρόσβασης.");
    error.status = 500;
    return next(error);
  }

  if (!isValidPassword) {
    const error = new Error("Λάθος όνομα χρήστη ή κωδικός πρόσβασης.");
    error.status = 403;
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser[0].id, username: existingUser[0].username },
      "supersecret",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new Error("Λάθος όνομα χρήστη ή κωδικός πρόσβασης.");
    error.status = 500;
    return next(error);
  }

  res.json({
    user: existingUser,
    userId: existingUser.id,
    email: existingUser.username,
    token: token,
  });
};

exports.logIn = logIn;
