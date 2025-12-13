const express = require("express");
const router = express.Router();

const { check, validationResult } = require("express-validator");
const auditLog = require("./audit");

const requireLogin = (req, res, next) => {
    if (req.session.loggedin) return next();
    const rootPrefix = res.locals.baseUrl || "" || req.baseUrl.replace(/\/fitness$/, "");
    res.redirect(rootPrefix + "/users/login");
};

router.use(requireLogin);

router.get("/add", (req, res) => {
    res.render("add_workout", {
        title: "Bitality - Add Workout",
        errors: null,
        success: null,
        activity_type: req.query.activity_name || "",
        basePath: res.locals.baseUrl,
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
            return res.render("add_workout", {
                title: "Bitality - Add Workout",
                errors: errors.array(),
                success: null,
                activity_type: req.body.activity_type || "",
                basePath: res.locals.baseUrl,
            });
        }

        const { activity_type, duration, calories, intensity } = req.body;
        const userId = req.session.userId || 1;

        const query =
            "INSERT INTO fitness_logs (activity_type, duration, calories_burned, intensity, user_id) VALUES (?, ?, ?, ?, ?)";
        req.db.query(query, [activity_type, duration, calories, intensity, userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.render("add_workout", {
                    title: "Bitality - Add Workout",
                    errors: [{ msg: "Database error" }],
                    success: null,
                    activity_type: activity_type,
                    basePath: res.locals.baseUrl,
                });
            }

            auditLog(
                req.db,
                req.session.username,
                "ADD_WORKOUT",
                `Type: ${activity_type}, Duration: ${duration}, Cal: ${calories}, Intensity: ${intensity}`
            );

            res.render("add_workout", {
                title: "Bitality - Add Workout",
                errors: null,
                success: "Workout added successfully!",
                activity_type: "",
                basePath: res.locals.baseUrl,
            });
        });
    }
);

router.get("/exercises", (req, res) => {
    res.render("exercises", {
        title: "Bitality - Find Exercises",
        exercises: null,
        selectedMuscle: "",
        basePath: res.locals.baseUrl,
    });
});

router.get("/exercises/search", async (req, res) => {
    const muscle = req.query.muscle;
    if (!muscle) return res.redirect((res.locals.baseUrl || "") + "/fitness/exercises");

    try {
        const response = await fetch(`https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`, {
            headers: { "X-Api-Key": process.env.API_NINJAS_KEY },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        res.render("exercises", {
            title: "Bitality - Find Exercises",
            exercises: data,
            selectedMuscle: muscle,
            basePath: res.locals.baseUrl,
        });
    } catch (error) {
        console.error(error);
        res.render("exercises", {
            title: "Bitality - Find Exercises",
            exercises: [],
            selectedMuscle: muscle,
            basePath: res.locals.baseUrl,
        });
    }
});

router.get("/nutrition", (req, res) => {
    const userId = req.session.userId || 1;
    const query = "SELECT * FROM nutrition_logs WHERE user_id = ? ORDER BY date DESC LIMIT 10";

    req.db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.render("nutrition", {
                title: "Bitality - Nutrition Tracker",
                analysis: null,
                history: [],
                query: "",
                basePath: res.locals.baseUrl,
            });
        }
        res.render("nutrition", {
            title: "Bitality - Nutrition Tracker",
            analysis: null,
            history: results,
            query: "",
            basePath: res.locals.baseUrl,
        });
    });
});

router.post("/nutrition/analyze", async (req, res) => {
    const queryText = req.body.query;
    const userId = req.session.userId || 1;

    const historySql = "SELECT * FROM nutrition_logs WHERE user_id = ? ORDER BY date DESC LIMIT 10";

    req.db.query(historySql, [userId], async (dbErr, historyResults) => {
        if (!queryText) return res.redirect((res.locals.baseUrl || "") + "/fitness/nutrition");

        try {
            const response = await fetch(
                `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(queryText)}`,
                {
                    headers: { "X-Api-Key": process.env.CALORIE_NINJAS_KEY },
                }
            );

            if (!response.ok) throw new Error("API Error");
            const data = await response.json();

            res.render("nutrition", {
                title: "Bitality - Nutrition Tracker",
                analysis: data, // { items: [...] }
                history: historyResults || [],
                query: queryText,
                basePath: res.locals.baseUrl,
            });
        } catch (error) {
            console.error(error);
            res.render("nutrition", {
                title: "Bitality - Nutrition Tracker",
                analysis: null,
                history: historyResults || [],
                query: queryText,
                error: "Could not analyze food.",
                basePath: res.locals.baseUrl,
            });
        }
    });
});

router.post("/nutrition/log", (req, res) => {
    const { meal_name, calories, protein, fat, carbs } = req.body;
    const userId = req.session.userId || 1;

    const sql =
        "INSERT INTO nutrition_logs (meal_name, calories, protein, fat, carbs, user_id) VALUES (?, ?, ?, ?, ?, ?)";
    req.db.query(sql, [meal_name, calories, protein, fat, carbs, userId], (err, result) => {
        if (err) console.error(err);

        auditLog(req.db, req.session.username, "LOG_MEAL", `Meal: ${meal_name}, Cal: ${Number(calories).toFixed(0)}`);
        res.redirect((res.locals.baseUrl || "") + "/fitness/nutrition");
    });
});

router.get("/search", (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.render("search", {
            title: "Bitality - Search",
            workouts: [],
            search_term: "",
            basePath: res.locals.baseUrl,
        });
    }

    const sql = "SELECT * FROM fitness_logs WHERE activity_type LIKE ? ORDER BY date DESC";
    req.db.query(sql, ["%" + query + "%"], (err, results) => {
        if (err) {
            console.error(err);
            return res.send("Database error");
        }

        auditLog(req.db, req.session.username, "SEARCH_WORKOUT", `Query: ${query}`);

        res.render("search", {
            title: "Bitality - Search Results",
            workouts: results,
            search_term: query,
            basePath: res.locals.baseUrl,
        });
    });
});

router.get("/bmi", (req, res) => {
    res.render("bmi", {
        title: "Bitality - BMI Calculator",
        bmi: null,
        status: null,
        basePath: res.locals.baseUrl,
    });
});

router.post("/bmi", (req, res) => {
    const { weight, height } = req.body;
    if (!weight || !height) {
        return res.render("bmi", {
            title: "Bitality - BMI Calculator",
            bmi: null,
            status: "Please enter both weight and height.",
            basePath: res.locals.baseUrl,
        });
    }

    const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);
    let status = "";

    if (bmi < 18.5) status = "Underweight";
    else if (bmi < 24.9) status = "Normal weight";
    else if (bmi < 29.9) status = "Overweight";
    else status = "Obesity";

    auditLog(req.db, req.session.username, "CALCULATE_BMI", `BMI: ${bmi}, Status: ${status}`);

    res.render("bmi", {
        title: "Bitality - BMI Calculator",
        bmi: bmi,
        status: `Status: ${status}`,
        basePath: res.locals.baseUrl,
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
    res.render("tips", {
        title: "Bitality - Health Tips",
        tips: tips,
        basePath: res.locals.baseUrl,
    });
});

router.get("/water", (req, res) => {
    const userId = req.session.userId || 1;
    const query = "SELECT SUM(amount) as total FROM water_logs WHERE user_id = ? AND DATE(date) = CURDATE()";
    req.db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.render("water", {
                title: "Bitality - Water Tracker",
                totalWater: 0,
                message: "Error fetching data",
                basePath: res.locals.baseUrl, // fix: use basePath
            });
        }
        res.render("water", {
            title: "Bitality - Water Tracker",
            totalWater: results[0].total || 0,
            message: null,
            basePath: res.locals.baseUrl, // fix: use basePath
        });
    });
});

router.post("/water", (req, res) => {
    const amount = parseInt(req.body.amount);
    const userId = req.session.userId || 1;

    if (amount > 0) {
        const query = "INSERT INTO water_logs (amount, user_id) VALUES (?, ?)";
        req.db.query(query, [amount, userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.render("water", {
                    title: "Bitality - Water Tracker",
                    totalWater: 0,
                    message: "Database error",
                    basePath: res.locals.baseUrl,
                });
            }

            auditLog(req.db, req.session.username, "ADD_WATER", `Amount: ${amount}ml`);

            const totalQuery =
                "SELECT SUM(amount) as total FROM water_logs WHERE user_id = ? AND DATE(date) = CURDATE()";
            req.db.query(totalQuery, [userId], (err, results) => {
                res.render("water", {
                    title: "Bitality - Water Tracker",
                    totalWater: results[0].total || 0,
                    message: `Added ${amount}ml!`,
                    basePath: res.locals.baseUrl,
                });
            });
        });
    } else {
        const query = "SELECT SUM(amount) as total FROM water_logs WHERE user_id = ? AND DATE(date) = CURDATE()";
        req.db.query(query, [userId], (err, results) => {
            res.render("water", {
                title: "Bitality - Water Tracker",
                totalWater: results ? results[0].total || 0 : 0,
                message: "Please enter a valid amount.",
                basePath: res.locals.baseUrl,
            });
        });
    }
});

router.get("/bmr", (req, res) => {
    res.render("bmr", {
        title: "Bitality - BMR Calculator",
        bmr: null,
        basePath: res.locals.baseUrl,
    });
});

router.post("/bmr", (req, res) => {
    const { gender, weight, height, age } = req.body;

    if (!weight || !height || !age) {
        return res.render("bmr", {
            title: "Bitality - BMR Calculator",
            bmr: null,
            basePath: res.locals.baseUrl,
        });
    }

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender === "male") {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    auditLog(req.db, req.session.username, "CALCULATE_BMR", `BMR: ${Math.round(bmr)}`);

    res.render("bmr", {
        title: "Bitality - BMR Calculator",
        bmr: Math.round(bmr),
        basePath: res.locals.baseUrl,
    });
});

router.get("/macros", (req, res) => {
    res.render("macros", {
        title: "Bitality - Macro Calculator",
        results: null,
        basePath: res.locals.baseUrl,
    });
});

router.post("/macros", (req, res) => {
    const { weight, goal, activity } = req.body;

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

    res.render("macros", {
        title: "Bitality - Macro Calculator",
        results: {
            calories: Math.round(tdee),
            protein: protein,
            carbs: carbs > 0 ? carbs : 0,
            fats: fats,
        },
        basePath: res.locals.baseUrl,
    });
});

router.get("/profile", (req, res) => {
    const userId = req.session.userId || 1;

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
                basePath: res.locals.baseUrl,
            });
        }

        const recentQuery = "SELECT * FROM fitness_logs WHERE user_id = ? ORDER BY date DESC LIMIT 5";
        req.db.query(recentQuery, [userId], (err, recentResult) => {
            if (err) {
                console.error(err);
                return res.render("profile", {
                    title: "Bitality - Profile",
                    user: req.session.username,
                    stats: {
                        totalWorkouts: statsResult[0].count,
                        totalCalories: statsResult[0].calories || 0,
                        totalDuration: statsResult[0].duration || 0,
                    },
                    recentActivity: [],
                    basePath: res.locals.baseUrl,
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
                basePath: res.locals.baseUrl,
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
        res.render("audit_log", {
            title: "Bitality - Audit Logs",
            logs: results,
            basePath: res.locals.baseUrl,
        });
    });
});

module.exports = router;
