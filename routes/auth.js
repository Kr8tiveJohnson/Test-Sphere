// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const pool = require("../config/db");




// API ENDPOINT: SIGN UP SUBMISSION
router.post("/register", async (req, res) => {
    const { name, institution, email, role, password, matricNumber, level, staffId, deptToken } = req.body;

    try {
        const userExistCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExistCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Email account already exists." });
        }

        if (role === "lecturer") {
            const masterKey = process.env.DEPARTMENT_KEY || 'TESTSPHERE-2026';
            if (deptToken !== masterKey) {
                return res.status(403).json({ success: false, message: "Invalid Department Registration Key." });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (name, email, password_hash, role, institution) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [name, email, passwordHash, role, institution]
        );
        const userId = newUser.rows[0].id;

        if (role === "student") {
            await pool.query("INSERT INTO students (user_id, matric_number, level) VALUES ($1, $2, $3)", [userId, matricNumber, level]);
        } else if (role === "lecturer") {
            await pool.query("INSERT INTO lecturers (user_id, staff_id) VALUES ($1, $2)", [userId, staffId]);
        }

        return res.status(201).json({ success: true, message: "Profile constructed successfully." });

    } catch (error) {
        console.error("Registration endpoint crash:", error);
        return res.status(500).json({ success: false, message: "Critical storage tracking loop fault." });
    }
});


// 🚨 ADDED: API ENDPOINT FOR LOGIN VERIFICATION
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Look up user by email
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid email or password credentials." });
        }

        const user = userResult.rows[0];

        // 2. Compare the typed password with the encrypted hash inside PostgreSQL
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password credentials." });
        }

        // 3. Success! Pass user role data back to the browser for routing
        return res.status(200).json({
            success: true,
            message: "Authentication authorized!",
            role: user.role
        });

    } catch (error) {
        console.error("Login verification endpoint crash:", error);
        return res.status(500).json({ success: false, message: "Server connection error." });
    }
});

module.exports = router;