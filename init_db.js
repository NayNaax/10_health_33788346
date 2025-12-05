const mysql = require("mysql2");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const dbConfig = {
    host: process.env.HEALTH_HOST || "localhost",
    user: process.env.HEALTH_USER || "health_app",
    password: process.env.HEALTH_PASSWORD || "qwertyuiop",
    multipleStatements: true,
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        process.exit(1);
    }
    console.log("Connected to MySQL");

    const createDbSql = fs.readFileSync(path.join(__dirname, "database", "create_db.sql"), "utf8");
    const insertDataSql = fs.readFileSync(path.join(__dirname, "database", "insert_test_data.sql"), "utf8");

    connection.query(createDbSql, (err, results) => {
        if (err) {
            console.error("Error creating database:", err);
            process.exit(1);
        }
        console.log("Database created/checked.");

        connection.query(insertDataSql, (err, results) => {
            if (err) {
                console.error("Error inserting data:", err);
                process.exit(1);
            }
            console.log("Test data inserted.");
            connection.end();
            process.exit(0);
        });
    });
});
