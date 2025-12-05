function logAction(db, user, action, details = "") {
    const query = "INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)";
    db.query(query, [user, action, details], (err) => {
        if (err) console.error("Failed to write to audit log DB:", err);
    });
}

module.exports = logAction;
