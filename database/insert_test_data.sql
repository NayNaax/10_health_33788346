
USE health;

-- Insert default user
INSERT INTO users (username, password) VALUES ('gold', 'smiths')
ON DUPLICATE KEY UPDATE password='smiths';

INSERT INTO fitness_logs (activity_type, duration, calories_burned, user_id) VALUES
('Running', 30, 300, (SELECT id FROM users WHERE username='gold')),
('Swimming', 45, 400, (SELECT id FROM users WHERE username='gold')),
('Cycling', 60, 500, (SELECT id FROM users WHERE username='gold'));
