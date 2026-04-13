-- Alumni Influencer Platform Database Schema (3NF)
-- MySQL Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS alumni_platform;
USE alumni_platform;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS api_usage_logs;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS event_attendance;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS daily_winners;
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS TABLE - Authentication and core user data
-- ============================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Bcrypt hashed password
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('alumni', 'admin') DEFAULT 'alumni',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROFILES TABLE - Alumni profile information (1:1 with users)
-- ============================================================
CREATE TABLE profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    linkedin_url VARCHAR(500),
    bio TEXT,
    profile_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EDUCATION TABLE - Educational background (1:N with users)
-- ============================================================
CREATE TABLE education (
    education_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EXPERIENCE TABLE - Employment history (1:N with users)
-- ============================================================
CREATE TABLE experience (
    experience_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMAIL_VERIFICATION_TOKENS TABLE - Secure, expiring tokens
-- ============================================================
CREATE TABLE email_verification_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SESSIONS TABLE - Session management
-- ============================================================
CREATE TABLE sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id),
    INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EVENTS TABLE - Events for attendance tracking
-- ============================================================
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EVENT_ATTENDANCE TABLE - Junction table for user-event relationship
-- ============================================================
CREATE TABLE event_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    attended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event (user_id, event_id),
    INDEX idx_user_id (user_id),
    INDEX idx_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BIDS TABLE - Blind bidding system
-- ============================================================
CREATE TABLE bids (
    bid_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bid_amount DECIMAL(10, 2) NOT NULL,
    target_date DATE NOT NULL, -- The date they want to be Alumni of the Day
    status ENUM('active', 'won', 'lost', 'withdrawn') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_target_date (target_date),
    INDEX idx_status (status),
    INDEX idx_target_status (target_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DAILY_WINNERS TABLE - Alumni of the Day winners
-- ============================================================
CREATE TABLE daily_winners (
    winner_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bid_id INT NOT NULL,
    winner_date DATE NOT NULL UNIQUE, -- The date they are Alumni of the Day
    winning_bid_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (bid_id) REFERENCES bids(bid_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_winner_date (winner_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- API_KEYS TABLE - API key management and scoping
-- ============================================================
CREATE TABLE api_keys (
    key_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scopes JSON NOT NULL, -- e.g., ["read:alumni", "read:analytics", "read:donations", "read:alumni_of_day"]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_key_hash (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- API_USAGE_LOGS TABLE - Track API usage for endpoints
-- ============================================================
CREATE TABLE api_usage_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    key_id INT NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (key_id) REFERENCES api_keys(key_id) ON DELETE CASCADE,
    INDEX idx_key_id (key_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DONATIONS TABLE - Track alumni donations
-- ============================================================
CREATE TABLE donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    donation_date DATE NOT NULL,
    fund_name VARCHAR(255) DEFAULT 'General Alumni Fund',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_donation_date (donation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SKILLS TABLE - Track skills for analytics (skills gap)
-- ============================================================
CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_skill_name (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STORED PROCEDURES & FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS count_monthly_wins;
DROP FUNCTION IF EXISTS attended_event_in_month;
DROP FUNCTION IF EXISTS get_monthly_limit;
DROP TRIGGER IF EXISTS after_user_insert;

CREATE FUNCTION count_monthly_wins(p_user_id INT, p_year INT, p_month INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE win_count INT;
    
    SELECT COUNT(*) INTO win_count
    FROM daily_winners
    WHERE user_id = p_user_id
    AND YEAR(winner_date) = p_year
    AND MONTH(winner_date) = p_month;
    
    RETURN win_count;
END;

-- Function to check if user attended any event in a given month
CREATE FUNCTION attended_event_in_month(p_user_id INT, p_year INT, p_month INT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE has_attended BOOLEAN;
    
    SELECT COUNT(*) > 0 INTO has_attended
    FROM event_attendance ea
    JOIN events e ON ea.event_id = e.event_id
    WHERE ea.user_id = p_user_id
    AND YEAR(e.event_date) = p_year
    AND MONTH(e.event_date) = p_month;
    
    RETURN has_attended;
END;

-- Function to get monthly win limit for a user
CREATE FUNCTION get_monthly_limit(p_user_id INT, p_year INT, p_month INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE base_limit INT DEFAULT 3;
    DECLARE bonus_limit INT DEFAULT 1;
    DECLARE has_attended BOOLEAN;
    
    SET has_attended = attended_event_in_month(p_user_id, p_year, p_month);
    
    IF has_attended THEN
        RETURN base_limit + bonus_limit; -- 4 wins if attended event
    ELSE
        RETURN base_limit; -- 3 wins otherwise
    END IF;
END;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger to automatically create profile when user is created
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.user_id);
END;

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Insert sample admin user (password: Admin123!)
-- Password hash for 'Admin123!' using bcrypt with 10 rounds
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) 
VALUES ('admin@university.edu', '$2b$10$rQZ9vXKZ8xKZ8xKZ8xKZ8.xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ', 'Admin', 'User', 'admin', TRUE);

-- Insert sample event
INSERT INTO events (event_name, event_description, event_date, location)
VALUES ('Alumni Networking Night', 'Annual networking event for alumni', '2026-02-20', 'University Campus');

-- ============================================================
-- VIEWS (for easier querying)
-- ============================================================

DROP VIEW IF EXISTS vw_user_profiles;
DROP VIEW IF EXISTS vw_active_bids;
DROP VIEW IF EXISTS vw_monthly_stats;

CREATE VIEW vw_user_profiles AS
SELECT 
    u.user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_verified,
    p.linkedin_url,
    p.bio,
    p.profile_image_path,
    u.created_at
FROM users u
LEFT JOIN profiles p ON u.user_id = p.user_id;

-- View for active bids with user information
CREATE VIEW vw_active_bids AS
SELECT 
    b.bid_id,
    b.user_id,
    u.first_name,
    u.last_name,
    u.email,
    b.bid_amount,
    b.target_date,
    b.status,
    b.created_at,
    b.updated_at
FROM bids b
JOIN users u ON b.user_id = u.user_id
WHERE b.status = 'active';

-- View for monthly winner statistics
CREATE VIEW vw_monthly_stats AS
SELECT 
    u.user_id,
    u.first_name,
    u.last_name,
    YEAR(dw.winner_date) AS year,
    MONTH(dw.winner_date) AS month,
    COUNT(*) AS wins_count,
    SUM(dw.winning_bid_amount) AS total_bid_amount
FROM daily_winners dw
JOIN users u ON dw.user_id = u.user_id
GROUP BY u.user_id, YEAR(dw.winner_date), MONTH(dw.winner_date);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_bids_user_target ON bids(user_id, target_date);
CREATE INDEX idx_winners_date_user ON daily_winners(winner_date, user_id);
CREATE INDEX idx_education_user_dates ON education(user_id, start_date, end_date);
CREATE INDEX idx_experience_user_dates ON experience(user_id, start_date, end_date);

-- ============================================================
-- GRANT PERMISSIONS (adjust as needed)
-- ============================================================

-- Create application user (replace with your credentials)
-- CREATE USER 'alumni_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alumni_platform.* TO 'alumni_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================
-- MOCK DATA SEEDING (FOR DEMO PURPOSES)
-- ============================================================

INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_verified) VALUES 
(2, 'jdoe@university.edu', '$2b$10$rQZ9vXKZ8xKZ8xKZ8xKZ8.xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ', 'John', 'Doe', 'alumni', TRUE),
(3, 'asmith@university.edu', '$2b$10$rQZ9vXKZ8xKZ8xKZ8xKZ8.xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ', 'Alice', 'Smith', 'alumni', TRUE),
(4, 'mjohnson@university.edu', '$2b$10$rQZ9vXKZ8xKZ8xKZ8xKZ8.xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ', 'Michael', 'Johnson', 'alumni', TRUE),
(5, 'ewilliams@university.edu', '$2b$10$rQZ9vXKZ8xKZ8xKZ8xKZ8.xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ', 'Emma', 'Williams', 'alumni', TRUE),
(6, 'drown@university.edu', '$2b$10$rQZ9vXKZ8xKZ8xKZ8xKZ8.xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ8xKZ', 'David', 'Brown', 'alumni', TRUE);

-- Profile triggers auto-create profiles. We just need to update them if we want to add bio/links.
UPDATE IGNORE profiles SET bio = 'Senior Software Engineer with 5 years experience', linkedin_url = 'https://linkedin.com/in/johndoe' WHERE user_id = 2;
UPDATE IGNORE profiles SET bio = 'Data Scientist specializing in ML', linkedin_url = 'https://linkedin.com/in/alicesmith' WHERE user_id = 3;
UPDATE IGNORE profiles SET bio = 'Product Manager driving innovation', linkedin_url = 'https://linkedin.com/in/michaelj' WHERE user_id = 4;
UPDATE IGNORE profiles SET bio = 'Frontend Developer focusing on React', linkedin_url = 'https://linkedin.com/in/emmaw' WHERE user_id = 5;
UPDATE IGNORE profiles SET bio = 'Cloud Systems Architect', linkedin_url = 'https://linkedin.com/in/davidb' WHERE user_id = 6;

INSERT IGNORE INTO experience (user_id, company, position, location, start_date, is_current) VALUES 
(2, 'Google', 'Senior Engineer', 'Mountain View', '2019-01-01', TRUE),
(3, 'Amazon', 'Data Scientist', 'Seattle', '2020-03-15', TRUE),
(4, 'Meta', 'Product Manager', 'Menlo Park', '2021-06-01', TRUE),
(5, 'Microsoft', 'Frontend Dev', 'Redmond', '2022-09-01', TRUE),
(6, 'Apple', 'Systems Architect', 'Cupertino', '2018-05-10', TRUE);

INSERT IGNORE INTO skills (user_id, skill_name, proficiency) VALUES 
(2, 'JavaScript', 'advanced'), (2, 'Node.js', 'expert'), (2, 'React', 'advanced'),
(3, 'Python', 'expert'), (3, 'Machine Learning', 'advanced'), (3, 'Data Science', 'expert'),
(4, 'Product Management', 'advanced'), (4, 'Agile', 'expert'),
(5, 'React', 'expert'), (5, 'JavaScript', 'advanced'), (5, 'CSS', 'expert'),
(6, 'Cloud Compute', 'advanced'), (6, 'AWS', 'expert'), (6, 'DevOps', 'advanced');

INSERT IGNORE INTO donations (user_id, amount, donation_date) VALUES 
(2, 500.00, '2026-01-15'), (3, 1500.00, '2026-02-10'), (4, 250.00, '2026-03-05');

INSERT IGNORE INTO bids (bid_id, user_id, bid_amount, target_date, status) VALUES 
(1, 2, 50.00, CURDATE() + INTERVAL 2 DAY, 'active'),
(2, 3, 120.00, CURDATE() + INTERVAL 3 DAY, 'active'),
(3, 4, 30.00, CURDATE() + INTERVAL 4 DAY, 'active');
