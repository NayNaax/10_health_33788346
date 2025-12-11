const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    if (req.session.loggedin) {
        const userId = req.session.userId || 1;

        const recentQuery = "SELECT * FROM fitness_logs WHERE user_id = ? ORDER BY date DESC LIMIT 3";
        const statsQuery = `
            SELECT
                COALESCE((SELECT SUM(calories_burned) FROM fitness_logs WHERE user_id = ?), 0) as totalCalories,
                COALESCE((SELECT COUNT(*) FROM fitness_logs WHERE user_id = ?), 0) as totalWorkouts,
                COALESCE((SELECT SUM(amount) FROM water_logs WHERE user_id = ? AND DATE(date) = CURDATE()), 0) as todayWater
        `;

        req.db.query(recentQuery, [userId], (err, recentResults) => {
            if (err) {
                console.error(err);
                return res.render("index", {
                    title: "Bitality - Home",
                    recentActivity: [],
                    stats: null,
                });
            }

            req.db.query(statsQuery, [userId, userId, userId], (err, statsResults) => {
                if (err) {
                    console.error(err);
                    return res.render("index", {
                        title: "Bitality - Home",
                        recentActivity: recentResults,
                        stats: null,
                    });
                }

                res.render("index", {
                    title: "Bitality - Home",
                    recentActivity: recentResults,
                    stats: statsResults[0],
                });
            });
        });
    } else {
        res.render("index", {
            title: "Bitality - Home",
            recentActivity: null,
            stats: null,
        });
    }
});

router.get("/about", (req, res) => {
    res.render("about", {
        title: "Bitality - About",
    });
});

module.exports = router;
