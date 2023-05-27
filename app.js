const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeDbAndServer();

//API to register user
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryToSelectUser = `
    SELECT
        *
    FROM
        user
    WHERE 
        username = "${username}";
    `;
  const queryToRegisterNewUser = `
    INSERT INTO
        user (username, name, password, gender, location)
    VALUES ("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}");
    `;
  const dbUser = await db.get(queryToSelectUser);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(queryToRegisterNewUser);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const queryToSelectUser = `
    SELECT
        *
    FROM
        user
    WHERE 
        username = "${username}";
    `;
  const dbUser = await db.get(queryToSelectUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordSame = await bcrypt.compare(password, dbUser.password);
    if (isPasswordSame) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API to change password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const queryToGetUser = `
    SELECT
        *
    FROM
        user
    WHERE
        username = "${username}";
    `;
  const queryToUpdatePassword = `
    UPDATE
        user
    SET
        password = "${hashedPassword}"
    WHERE
        username = "${username}"
    `;
  const dbUser = await db.get(queryToGetUser);
  const isPasswordAndOldPasswordSame = await bcrypt.compare(
    oldPassword,
    dbUser.password
  );
  if (isPasswordAndOldPasswordSame) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(queryToUpdatePassword);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
