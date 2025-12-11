
CREATE DATABASE IF NOT EXISTS health;
USE health;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS fitness_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL,
    duration INT NOT NULL, -- in minutes
    calories_burned INT,
    intensity VARCHAR(20), -- 'Low', 'Medium', 'High'
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    action VARCHAR(255),
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount INT NOT NULL, -- in ml
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_name VARCHAR(255),
    calories DECIMAL(10, 2),
    protein DECIMAL(10, 2),
    fat DECIMAL(10, 2),
    carbs DECIMAL(10, 2),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
