const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    if (req.session.loggedin) {
        const userId = req.session.userId || 1;
        const query = "SELECT * FROM fitness_logs WHERE user_id = ? ORDER BY date DESC LIMIT 3";
        req.db.query(query, [userId], (err, results) => {
            if (err) {
                console.error(err);
                return res.render("start_page", {
                    title: "Bitality - Home",
                    recentActivity: [],
                });
            }
            res.render("start_page", {
                title: "Bitality - Home",
                recentActivity: results,
            });
        });
    } else {
        res.render("start_page", {
            title: "Bitality - Home",
            recentActivity: null,
        });
    }
});

router.get("/about", (req, res) => {
    res.render("about", {
        title: "Bitality - About",
    });
});

module.exports = router;
