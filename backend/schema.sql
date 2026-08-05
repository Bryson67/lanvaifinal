CREATE DATABASE IF NOT EXISTS lanvai_db;
USE lanvai_db;

CREATE TABLE IF NOT EXISTS cookie_consents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id VARCHAR(50) NOT NULL,
    consent_type ENUM('all', 'necessary', 'none') DEFAULT 'none',
    ip_address VARCHAR(45),
    user_agent TEXT,
    consent_given_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consent_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_visitor_id (visitor_id)
);

CREATE TABLE IF NOT EXISTS user_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id VARCHAR(50) NOT NULL,
    user_id INT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_details TEXT,
    page_url VARCHAR(500),
    referrer_url VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_action_type (action_type)
);

CREATE TABLE IF NOT EXISTS media_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    submission_status ENUM('pending', 'contacted', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS expert_consultations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id VARCHAR(50) NOT NULL,
    business_category VARCHAR(100) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    consultation_status ENUM('pending', 'reviewing', 'scheduled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_category (business_category)
);

CREATE TABLE IF NOT EXISTS ad_exchange_selections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
);

CREATE TABLE IF NOT EXISTS ad_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    impressions_estimate VARCHAR(50),
    duration_days INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
);