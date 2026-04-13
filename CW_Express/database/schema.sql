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

-- Password for all users: Admin123!
-- Hash generated with bcrypt 10 rounds
INSERT IGNORE INTO users (user_id, email, password_hash, first_name, last_name, role, is_verified) VALUES
(2,  'jdoe@university.edu',       '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'John',    'Doe',      'alumni', TRUE),
(3,  'asmith@university.edu',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Alice',   'Smith',    'alumni', TRUE),
(4,  'mjohnson@university.edu',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Michael', 'Johnson',  'alumni', TRUE),
(5,  'ewilliams@university.edu',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Emma',    'Williams', 'alumni', TRUE),
(6,  'drown@university.edu',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'David',   'Brown',    'alumni', TRUE),
(7,  'stariq@university.edu',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Sarah',   'Tariq',    'alumni', TRUE),
(8,  'rlee@university.edu',       '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Ryan',    'Lee',      'alumni', TRUE),
(9,  'fnguyen@university.edu',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Fatima',  'Nguyen',   'alumni', TRUE),
(10, 'ogarcia@university.edu',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Omar',    'Garcia',   'alumni', TRUE),
(11, 'admin@university.edu',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  'Admin',   'User',     'admin',  TRUE);

-- Profile triggers auto-create profiles on INSERT. Update to add bio/links.
UPDATE IGNORE profiles SET bio = 'Senior Software Engineer passionate about distributed systems.', linkedin_url = 'https://linkedin.com/in/johndoe'    WHERE user_id = 2;
UPDATE IGNORE profiles SET bio = 'Data Scientist specializing in NLP and computer vision.',         linkedin_url = 'https://linkedin.com/in/alicesmith'  WHERE user_id = 3;
UPDATE IGNORE profiles SET bio = 'Product Manager driving AI-powered product strategy.',            linkedin_url = 'https://linkedin.com/in/michaelj'    WHERE user_id = 4;
UPDATE IGNORE profiles SET bio = 'Frontend Lead focused on accessible, performant UIs.',            linkedin_url = 'https://linkedin.com/in/emmaw'       WHERE user_id = 5;
UPDATE IGNORE profiles SET bio = 'Cloud Architect specialising in multi-cloud migration.',          linkedin_url = 'https://linkedin.com/in/davidb'      WHERE user_id = 6;
UPDATE IGNORE profiles SET bio = 'Cybersecurity analyst protecting fintech infrastructure.',        linkedin_url = 'https://linkedin.com/in/stariq'      WHERE user_id = 7;
UPDATE IGNORE profiles SET bio = 'ML Engineer building recommendation models at scale.',            linkedin_url = 'https://linkedin.com/in/rlee'        WHERE user_id = 8;
UPDATE IGNORE profiles SET bio = 'Business Analyst bridging tech and operations.',                  linkedin_url = 'https://linkedin.com/in/fnguyen'     WHERE user_id = 9;
UPDATE IGNORE profiles SET bio = 'Full-stack developer and open-source contributor.',               linkedin_url = 'https://linkedin.com/in/ogarcia'     WHERE user_id = 10;

-- EDUCATION — includes field_of_study (programme) and end_date (graduation date)
INSERT IGNORE INTO education (user_id, institution, degree, field_of_study, start_date, end_date) VALUES
(2,  'University of Technology', 'BSc',  'Computer Science',          '2014-09-01', '2018-06-30'),
(2,  'University of Technology', 'MSc',  'Software Engineering',      '2018-09-01', '2020-06-30'),
(3,  'City University',          'BSc',  'Data Science',              '2015-09-01', '2019-06-30'),
(3,  'City University',          'MSc',  'Artificial Intelligence',   '2019-09-01', '2021-06-30'),
(4,  'University of Technology', 'BSc',  'Business Administration',   '2013-09-01', '2017-06-30'),
(4,  'University of Technology', 'MBA',  'Technology Management',     '2018-09-01', '2020-06-30'),
(5,  'City University',          'BSc',  'Computer Science',          '2016-09-01', '2020-06-30'),
(6,  'Tech Institute',           'BEng', 'Computer Engineering',      '2012-09-01', '2016-06-30'),
(6,  'Tech Institute',           'MSc',  'Cloud Computing',           '2016-09-01', '2018-06-30'),
(7,  'University of Technology', 'BSc',  'Cybersecurity',             '2015-09-01', '2019-06-30'),
(7,  'University of Technology', 'MSc',  'Information Security',      '2019-09-01', '2021-06-30'),
(8,  'City University',          'BSc',  'Artificial Intelligence',   '2016-09-01', '2020-06-30'),
(9,  'Business School',          'BBA',  'Business Administration',   '2014-09-01', '2018-06-30'),
(9,  'Business School',          'MSc',  'Finance',                   '2018-09-01', '2020-06-30'),
(10, 'Tech Institute',           'BSc',  'Software Engineering',      '2015-09-01', '2019-06-30');

-- EXPERIENCE — diverse companies and positions (industry sectors)
INSERT IGNORE INTO experience (user_id, company, position, location, start_date, end_date, is_current) VALUES
(2,  'Google',       'Senior Software Engineer',  'Mountain View, CA', '2020-07-01', NULL,         TRUE),
(2,  'Startup XYZ',  'Junior Developer',          'London, UK',        '2018-07-01', '2020-06-30', FALSE),
(3,  'Amazon',       'Data Scientist',            'Seattle, WA',       '2021-07-01', NULL,         TRUE),
(3,  'DataCorp',     'Analyst',                   'New York, NY',      '2019-07-01', '2021-06-30', FALSE),
(4,  'Meta',         'Product Manager',           'Menlo Park, CA',    '2020-09-01', NULL,         TRUE),
(4,  'Accenture',    'Business Analyst',          'London, UK',        '2017-07-01', '2020-08-31', FALSE),
(5,  'Microsoft',    'Frontend Lead',             'Redmond, WA',       '2020-09-01', NULL,         TRUE),
(6,  'Apple',        'Cloud Architect',           'Cupertino, CA',     '2018-07-01', NULL,         TRUE),
(7,  'Barclays',     'Cybersecurity Analyst',     'London, UK',        '2021-07-01', NULL,         TRUE),
(7,  'HSBC',         'Security Engineer',         'London, UK',        '2019-07-01', '2021-06-30', FALSE),
(8,  'Netflix',      'ML Engineer',               'Los Gatos, CA',     '2020-09-01', NULL,         TRUE),
(9,  'Deloitte',     'Business Analyst',          'New York, NY',      '2020-07-01', NULL,         TRUE),
(9,  'PwC',          'Consultant',                'London, UK',        '2018-07-01', '2020-06-30', FALSE),
(10, 'Spotify',      'Full-Stack Developer',      'Stockholm, Sweden', '2019-09-01', NULL,         TRUE);

-- SKILLS
INSERT IGNORE INTO skills (user_id, skill_name, proficiency) VALUES
(2,  'JavaScript',          'expert'),   (2, 'Node.js',          'expert'),   (2, 'React',            'advanced'),
(3,  'Python',              'expert'),   (3, 'Machine Learning', 'advanced'), (3, 'Data Science',     'expert'),
(4,  'Product Management',  'advanced'), (4, 'Agile',            'expert'),   (4, 'Stakeholder Mgmt', 'advanced'),
(5,  'React',               'expert'),   (5, 'JavaScript',       'advanced'), (5, 'CSS',              'expert'),
(6,  'AWS',                 'expert'),   (6, 'Azure',            'advanced'), (6, 'DevOps',           'advanced'),
(7,  'Penetration Testing', 'expert'),   (7, 'SIEM',             'advanced'), (7, 'Python',           'intermediate'),
(8,  'PyTorch',             'expert'),   (8, 'Python',           'expert'),   (8, 'MLOps',            'advanced'),
(9,  'SQL',                 'advanced'), (9, 'Power BI',         'advanced'), (9, 'Excel',            'expert'),
(10, 'React',               'advanced'), (10,'Node.js',          'advanced'), (10,'Docker',           'intermediate');

-- DONATIONS
INSERT IGNORE INTO donations (user_id, amount, donation_date, fund_name) VALUES
(2, 500.00,  '2026-01-15', 'Computer Science Scholarship'),
(3, 1500.00, '2026-02-10', 'General Alumni Fund'),
(4, 250.00,  '2026-03-05', 'General Alumni Fund'),
(6, 750.00,  '2026-01-20', 'Engineering Bursary'),
(7, 300.00,  '2026-03-18', 'Cybersecurity Lab Fund'),
(8, 1000.00, '2025-12-01', 'AI Research Fund');

-- EVENTS
INSERT IGNORE INTO events (event_id, event_name, event_description, event_date, location) VALUES
(1, 'Alumni Networking Night 2025', 'Annual networking event for all alumni',                      '2025-11-15', 'University Main Hall'),
(2, 'Tech Talk: AI in Industry',    'Panel discussion on AI applications in tech industry',         '2026-01-20', 'Innovation Centre'),
(3, 'Career Fair 2026',             'Connect with top employers and alumni mentors',                '2026-03-10', 'University Sports Hall'),
(4, 'Graduation Ceremony 2025',     'Graduation celebration for class of 2025',                    '2025-07-14', 'University Auditorium');

INSERT IGNORE INTO event_attendance (user_id, event_id) VALUES
(2, 1), (2, 3), (3, 1), (3, 2), (4, 3), (5, 1), (5, 2), (5, 3), (6, 1), (7, 2), (7, 3), (8, 2), (9, 3), (10, 1);

-- BIDS
INSERT IGNORE INTO bids (bid_id, user_id, bid_amount, target_date, status) VALUES
(1, 2, 150.00, CURDATE() + INTERVAL 2 DAY,  'active'),
(2, 3, 220.00, CURDATE() + INTERVAL 3 DAY,  'active'),
(3, 4, 90.00,  CURDATE() + INTERVAL 4 DAY,  'active'),
(4, 5, 310.00, CURDATE() + INTERVAL 5 DAY,  'active'),
(5, 6, 175.00, CURDATE() + INTERVAL 6 DAY,  'active'),
(6, 2, 80.00,  CURDATE() - INTERVAL 10 DAY, 'won'),
(7, 3, 65.00,  CURDATE() - INTERVAL 20 DAY, 'lost');

-- DAILY WINNERS
INSERT IGNORE INTO daily_winners (user_id, bid_id, winner_date, winning_bid_amount) VALUES
(2, 6, CURDATE() - INTERVAL 10 DAY, 80.00);

-- API KEYS (scoped for dashboard analytics and mobile AR)
-- Key value: 'dashboard-analytics-key-001' → SHA256 hash
INSERT IGNORE INTO api_keys (key_id, user_id, key_hash, name, scopes, is_active) VALUES
(1, 11, SHA2('dashboard-analytics-key-001', 256), 'University Analytics Dashboard', JSON_ARRAY('read:alumni', 'read:analytics'), TRUE),
(2, 11, SHA2('mobile-ar-key-001', 256),            'Mobile AR App',                  JSON_ARRAY('read:alumni_of_day'),            TRUE),
(3, 2,  SHA2('alumni-portal-key-001', 256),        'Alumni Self-Service Portal',      JSON_ARRAY('read:alumni', 'read:analytics'), TRUE);

-- SAMPLE API USAGE LOGS
INSERT IGNORE INTO api_usage_logs (key_id, endpoint, method, status_code, timestamp) VALUES
(1, '/api/analytics/dashboard', 'GET', 200, '2026-04-10 09:00:00'),
(1, '/api/analytics/dashboard', 'GET', 200, '2026-04-10 10:30:00'),
(1, '/api/alumni/directory',    'GET', 200, '2026-04-11 14:00:00'),
(2, '/api/alumni/directory',    'GET', 200, '2026-04-11 15:00:00'),
(2, '/api/alumni/directory',    'GET', 403, '2026-04-12 08:00:00'),
(3, '/api/analytics/dashboard', 'GET', 200, '2026-04-12 11:00:00'),
(1, '/api/analytics/dashboard', 'GET', 200, '2026-04-13 09:15:00'),
(1, '/api/alumni/directory',    'GET', 200, '2026-04-13 09:20:00');

