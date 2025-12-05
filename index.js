const express = require("express");
require("dotenv").config();
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const session = require("express-session");
const expressValidator = require("express-validator");
const path = require("path");

const app = express();
const port = 8000;

const dbConfig = {
    host: process.env.HEALTH_HOST || "localhost",
    user: process.env.HEALTH_USER || "health_app",
    password: process.env.HEALTH_PASSWORD || "qwertyuiop",
    database: process.env.HEALTH_DATABASE || "health",
    multipleStatements: true,
};

const db = mysql.createPool(dbConfig);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
    req.db = db;
    res.locals.user = req.session.loggedin ? req.session.username : null;
    next();
});

const mainRoutes = require("./routes/main");
const fitnessRoutes = require("./routes/fitness");
const userRoutes = require("./routes/users");

app.use("/", mainRoutes);
app.use("/fitness", fitnessRoutes);
app.use("/users", userRoutes);

app.use((req, res, next) => {
    res.status(404).send("Page not found");
});

app.listen(port, () => {
    console.log(`Bitality Health App listening on port ${port}!`);
});
