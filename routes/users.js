const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auditLog = require("./audit");

router.get("/login", (req, res) => {
    res.render("login", {
        title: "Bitality - Login",
        error: null,
        basePath: res.locals.baseUrl,
    });
});

router.post("/login", (req, res) => {
    let { username, password } = req.body;

    if (Array.isArray(username)) username = username[0];
    if (Array.isArray(password)) password = password[0];

    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    req.db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.render("login", {
                title: "Bitality - Login",
                error: "An error occurred. Please try again.",
                basePath: res.locals.baseUrl,
            });
        }

        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            req.session.userId = results[0].id;

            auditLog(req.db, username, "LOGIN", "User logged in successfully");

            res.redirect((res.locals.baseUrl || "") + "/");
        } else {
            auditLog(req.db, username, "LOGIN_FAIL", "Failed login attempt");
            res.render("login", {
                title: "Bitality - Login",
                error: "Invalid username or password",
                basePath: res.locals.baseUrl,
            });
        }
    });
});

router.get("/logout", (req, res) => {
    if (req.session.username) {
        auditLog(req.db, req.session.username, "LOGOUT", "User logged out");
    }
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        const rootPrefix = res.locals.baseUrl || "" || req.baseUrl.replace(/\/users$/, "");
        res.redirect(rootPrefix + "/");
    });
});

router.get("/register", (req, res) => {
    res.render("register", {
        title: "Bitality - Register",
        errors: null,
        basePath: res.locals.baseUrl,
    });
});

router.post(
    "/register",
    [
        check("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
        check("password")
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            .withMessage(
                "Password must be at least 8 chars long and include 1 lowercase, 1 uppercase, 1 number, and 1 special character"
            ),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("register", {
                title: "Bitality - Register",
                errors: errors.array(),
                basePath: res.locals.baseUrl,
            });
        }

        const { username, password } = req.body;

        req.db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
            if (err) {
                console.error(err);
                return res.render("register", {
                    title: "Bitality - Register",
                    errors: [{ msg: "Database error" }],
                    basePath: res.locals.baseUrl,
                });
            }

            if (results.length > 0) {
                return res.render("register", {
                    title: "Bitality - Register",
                    errors: [{ msg: "Username already exists" }],
                    basePath: res.locals.baseUrl,
                });
            }

            req.db.query(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                [username, password],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.render("register", {
                            title: "Bitality - Register",
                            errors: [{ msg: "Error registering user" }],
                            basePath: res.locals.baseUrl,
                        });
                    }
                    auditLog(req.db, username, "REGISTER", "New user registered");
                    res.redirect((res.locals.baseUrl || "") + "/users/login");
                }
            );
        });
    }
);

module.exports = router;
