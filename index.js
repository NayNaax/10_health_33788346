const express = require("express");
require("dotenv").config();
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const session = require("express-session");
const expressValidator = require("express-validator");
const path = require("path");

const app = express();
const port = 8000;
// Optional base path for hosting under a subdirectory (e.g., /usr/355)
// Supports either `BASE_PATH` (path) or `HEALTH_BASE_PATH` (full URL or path).
// If a full URL is provided, the pathname will be extracted.
function resolveBasePath() {
    const raw = (process.env.HEALTH_BASE_PATH || process.env.BASE_PATH || "").trim();
    if (!raw) return "";
    try {
        // Try to parse as URL to extract pathname if needed
        const url = new URL(raw);
        const pathname = url.pathname || "/";
        return pathname === "/" ? "" : pathname.replace(/\/$/, "");
    } catch (_) {
        // Not a URL, assume it's a path
        if (raw === "/") return "";
        return raw.replace(/\/$/, "");
    }
}

const basePath = resolveBasePath();

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
// Serve static files appropriately for local and VM
if (basePath) {
    app.use(basePath, express.static(path.join(__dirname, "public")));
} else {
    app.use(express.static(path.join(__dirname, "public")));
}
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
    // Expose base path to views for building links
    // Prefer configured basePath; if not set, infer '/usr/<id>' from request path on hosted VM.
    let inferredBase = basePath || "";
    if (!inferredBase && typeof req.originalUrl === "string") {
        const match = req.originalUrl.match(/^\/(usr\/\d+)(?:\/|$)/);
        if (match && match[1]) {
            inferredBase = "/" + match[1];
        }
    }
    res.locals.baseUrl = inferredBase;
    next();
});

const mainRoutes = require("./routes/main");
const fitnessRoutes = require("./routes/fitness");
const userRoutes = require("./routes/users");

// Mount routes: under base path on VM, root for localhost
if (basePath) {
    app.use(basePath + "/", mainRoutes);
    app.use(basePath + "/fitness", fitnessRoutes);
    app.use(basePath + "/users", userRoutes);
} else {
    app.use("/", mainRoutes);
    app.use("/fitness", fitnessRoutes);
    app.use("/users", userRoutes);
}

// 404 handler (kept generic)
app.use((req, res, next) => {
    res.status(404).send("Page not found");
});

app.listen(port, () => {
    console.log(`Bitality Health App listening on port ${port}!`);
});
