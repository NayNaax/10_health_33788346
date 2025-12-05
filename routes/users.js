const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auditLog = require("./audit");

router.get("/login", (req, res) => {
    res.render("login", {
        title: "Bitality - Login",
        error: null,
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
            });
        }

        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            req.session.userId = results[0].id;

            auditLog(req.db, username, "LOGIN", "User logged in successfully");

            res.redirect("/");
        } else {
            auditLog(req.db, username, "LOGIN_FAIL", "Failed login attempt");
            res.render("login", {
                title: "Bitality - Login",
                error: "Invalid username or password",
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
        res.redirect("/");
    });
});

router.get("/register", (req, res) => {
    res.render("register", {
        title: "Bitality - Register",
        errors: null,
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
            });
        }

        const { username, password } = req.body;

        req.db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
            if (err) {
                console.error(err);
                return res.render("register", {
                    title: "Bitality - Register",
                    errors: [{ msg: "Database error" }],
                });
            }

            if (results.length > 0) {
                return res.render("register", {
                    title: "Bitality - Register",
                    errors: [{ msg: "Username already exists" }],
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
                        });
                    }
                    auditLog(req.db, username, "REGISTER", "New user registered");
                    res.redirect("/users/login");
                }
            );
        });
    }
);

module.exports = router;
