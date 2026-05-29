-- ====================================================================
-- TEST SPHERE - DATABASE INITIALIZATION SCHEMA
-- ====================================================================

-- Clear existing structural constraints if rebuilding the database system engine
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS lecturers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. BASELINE USERS IDENTITIES TABLE (Shared Credentials Container)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'lecturer', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENT PROFILES RELATION (Links directly to core user identity index)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    matric_number VARCHAR(30) UNIQUE NOT NULL,
    level VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. LECTURER PROFILES RELATION (Links directly to core user identity index)
CREATE TABLE lecturers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    staff_id VARCHAR(30) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. COURSE MANAGEMENT TABLE 
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(15) UNIQUE NOT NULL,
    course_title VARCHAR(150) NOT NULL,
    created_by INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. TIMED TESTS AND ASSESSMENTS CONFIGURATIONS TABLE
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 6. QUESTION BANK REPOSITORY TABLE
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    test_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- 7. STUDENT CONTINUOUS ASSESSMENT RESULTS RECORD TABLE
CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    test_id INT NOT NULL,
    score INT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    -- Rule constraint tracking to prevent a student from taking a single test twice
    UNIQUE (student_id, test_id)
);

-- ====================================================================
-- SEED DATA ENTRY: Create an default Master Admin account for setup testing
-- Default Credentials -> Email: admin@sphere.edu | Password Hash for: 'admin123'
-- ====================================================================
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Super Admin', 'admin@sphere.edu', '$2a$10$76hVOn.0EecR9b2N3wun9uxKexY4BshIec5Aunb4NlybVAnp6tmsy', 'admin')
ON CONFLICT (email) DO NOTHING;