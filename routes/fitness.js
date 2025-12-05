const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auditLog = require("./audit");

const requireLogin = (req, res, next) => {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect("/users/login");
    }
};

router.use(requireLogin);

router.get("/add", (req, res) => {
    res.render("input_page", {
        title: "Bitality - Add Workout",
        errors: null,
        success: null,
    });
});

router.post(
    "/add",
    [
        check("activity_type")
            .custom((value) => {
                return true;
            })
            .escape()
            .trim(),
        check("duration").isInt({ min: 1 }).withMessage("Duration must be a positive number"),
        check("calories").isInt({ min: 0 }).withMessage("Calories must be a positive number"),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("input_page", {
                title: "Bitality - Add Workout",
                errors: errors.array(),
                success: null,
            });
        }

        const { activity_type, duration, calories, intensity } = req.body;
        const userId = req.session.userId || 1;

        const query =
            "INSERT INTO fitness_logs (activity_type, duration, calories_burned, intensity, user_id) VALUES (?, ?, ?, ?, ?)";
        req.db.query(query, [activity_type, duration, calories, intensity, userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.render("input_page", {
                    title: "Bitality - Add Workout",
                    errors: [{ msg: "Database error" }],
                    success: null,
                });
            }

            auditLog(
                req.db,
                req.session.username,
                "ADD_WORKOUT",
                `Type: ${activity_type}, Duration: ${duration}, Cal: ${calories}, Intensity: ${intensity}`
            );

            res.render("input_page", {
                title: "Bitality - Add Workout",
                errors: null,
                success: "Workout added successfully!",
            });
        });
    }
);

router.get("/search", (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.render("search_page", {
            title: "Bitality - Search",
            workouts: [],
            search_term: "",
        });
    }

    const sql = "SELECT * FROM fitness_logs WHERE activity_type LIKE ? ORDER BY date DESC";
    req.db.query(sql, ["%" + query + "%"], (err, results) => {
        if (err) {
            console.error(err);
            return res.send("Database error");
        }

        auditLog(req.db, req.session.username, "SEARCH_WORKOUT", `Query: ${query}`);

        res.render("search_page", {
            title: "Bitality - Search Results",
            workouts: results,
            search_term: query,
        });
    });
});

router.get("/bmi", (req, res) => {
    res.render("bmi_page", {
        title: "Bitality - BMI Calculator",
        bmi: null,
        status: null,
    });
});

router.post("/bmi", (req, res) => {
    const { weight, height } = req.body;
    if (!weight || !height) {
        return res.render("bmi_page", {
            title: "Bitality - BMI Calculator",
            bmi: null,
            status: "Please enter both weight and height.",
        });
    }

    const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);
    let status = "";

    if (bmi < 18.5) status = "Underweight";
    else if (bmi < 24.9) status = "Normal weight";
    else if (bmi < 29.9) status = "Overweight";
    else status = "Obesity";

    auditLog(req.db, req.session.username, "CALCULATE_BMI", `BMI: ${bmi}, Status: ${status}`);

    res.render("bmi_page", {
        title: "Bitality - BMI Calculator",
        bmi: bmi,
        status: `Status: ${status}`,
    });
});

router.get("/tips", (req, res) => {
    auditLog(req.db, req.session.username, "VIEW_TIPS", "Viewed health tips page");
    const tips = [
        { title: "Hydrate", content: "Drink at least 2 litres of water a day to stay hydrated." },
        { title: "Sleep", content: "Aim for 7-9 hours of sleep per night for optimal recovery." },
        { title: "Active Recovery", content: "Take walks on rest days to keep blood flowing." },
        { title: "Protein", content: "Consume protein with every meal to support muscle growth." },
        { title: "Listen to your Body", content: "If you feel pain, stop. Don't push through injury." },
        { title: "Consistency", content: "Consistency is key. Small steps every day add up." },
    ];
    res.render("tips_page", {
        title: "Bitality - Health Tips",
        tips: tips,
    });
});

router.get("/water", (req, res) => {
    const totalWater = req.session.waterIntake || 0;
    res.render("water_page", {
        title: "Bitality - Water Tracker",
        totalWater: totalWater,
        message: null,
    });
});

router.post("/water", (req, res) => {
    const amount = parseInt(req.body.amount);
    if (amount > 0) {
        req.session.waterIntake = (req.session.waterIntake || 0) + amount;

        req.session.save((err) => {
            auditLog(req.db, req.session.username, "ADD_WATER", `Amount: ${amount}ml`);
            res.render("water_page", {
                title: "Bitality - Water Tracker",
                totalWater: req.session.waterIntake,
                message: `Added ${amount}ml!`,
            });
        });
    } else {
        res.render("water_page", {
            title: "Bitality - Water Tracker",
            totalWater: req.session.waterIntake || 0,
            message: "Please enter a valid amount.",
        });
    }
});

router.get("/bmr", (req, res) => {
    res.render("bmr_page", {
        title: "Bitality - BMR Calculator",
        bmr: null,
    });
});

router.post("/bmr", (req, res) => {
    const { gender, weight, height, age } = req.body;

    if (!weight || !height || !age) {
        return res.render("bmr_page", {
            title: "Bitality - BMR Calculator",
            bmr: null,
        });
    }

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender === "male") {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    auditLog(req.db, req.session.username, "CALCULATE_BMR", `BMR: ${Math.round(bmr)}`);

    res.render("bmr_page", {
        title: "Bitality - BMR Calculator",
        bmr: Math.round(bmr),
    });
});

router.get("/macros", (req, res) => {
    res.render("macros_page", {
        title: "Bitality - Macro Calculator",
        results: null,
    });
});

router.post("/macros", (req, res) => {
    const { weight, goal, activity } = req.body;

    // Simple estimation logic
    let multiplier;
    switch (activity) {
        case "sedentary":
            multiplier = 1.2;
            break;
        case "light":
            multiplier = 1.375;
            break;
        case "moderate":
            multiplier = 1.55;
            break;
        case "active":
            multiplier = 1.725;
            break;
        default:
            multiplier = 1.2;
    }

    // Base BMR estimate (very rough simple formula: weight * 24)
    const bmr = weight * 24;
    let tdee = bmr * multiplier;

    if (goal === "lose") tdee -= 500;
    else if (goal === "gain") tdee += 300;

    const protein = Math.round(weight * 2.0);
    const proteinCal = protein * 4;
    const fats = Math.round(weight * 0.9);
    const fatsCal = fats * 9;
    const carbsCal = tdee - proteinCal - fatsCal;
    const carbs = Math.round(carbsCal / 4);

    auditLog(req.db, req.session.username, "CALCULATE_MACROS", `Goal: ${goal}, Result: ${Math.round(tdee)}kcal`);

    res.render("macros_page", {
        title: "Bitality - Macro Calculator",
        results: {
            calories: Math.round(tdee),
            protein: protein,
            carbs: carbs > 0 ? carbs : 0,
            fats: fats,
        },
    });
});

router.get("/profile", (req, res) => {
    const userId = req.session.userId || 1;

    // Get aggregate stats
    const statsQuery =
        "SELECT COUNT(*) as count, SUM(calories_burned) as calories, SUM(duration) as duration FROM fitness_logs WHERE user_id = ?";

    req.db.query(statsQuery, [userId], (err, statsResult) => {
        if (err) {
            console.error(err);
            return res.render("profile", {
                title: "Bitality - Profile",
                user: req.session.username,
                stats: { totalWorkouts: 0, totalCalories: 0, totalDuration: 0 },
                recentActivity: [],
            });
        }

        // Get recent activity
        const recentQuery = "SELECT * FROM fitness_logs WHERE user_id = ? ORDER BY date DESC LIMIT 5";
        req.db.query(recentQuery, [userId], (err, recentResult) => {
            if (err) {
                console.error(err);
                // Render with stats but no recent activity on error
                return res.render("profile", {
                    title: "Bitality - Profile",
                    user: req.session.username,
                    stats: {
                        totalWorkouts: statsResult[0].count,
                        totalCalories: statsResult[0].calories || 0,
                        totalDuration: statsResult[0].duration || 0,
                    },
                    recentActivity: [],
                });
            }

            auditLog(req.db, req.session.username, "VIEW_PROFILE", "Viewed personal profile");

            res.render("profile", {
                title: "Bitality - Profile",
                user: req.session.username,
                stats: {
                    totalWorkouts: statsResult[0].count,
                    totalCalories: statsResult[0].calories || 0,
                    totalDuration: statsResult[0].duration || 0,
                },
                recentActivity: recentResult,
            });
        });
    });
});

router.get("/audit", (req, res) => {
    const query = "SELECT * FROM audit_logs WHERE action NOT LIKE 'LOGIN%' ORDER BY timestamp DESC LIMIT 50";
    req.db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.send("Database error");
        }
        res.render("audit_page", {
            title: "Bitality - Audit Logs",
            logs: results,
        });
    });
});

module.exports = router;
