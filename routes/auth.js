// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const pool = require("../config/db");

// 1. SETUP SMTP MAIL SERVICE CONFIGURATION
const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: "lordmoney124@gmail.com",
        pass: "paoorbsahhwxlizk"
    }
});

// API ENDPOINT: GENERATE AND EMAIL ACCESS TOKEN
router.post("/request-token", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email parameter required." });

    try {
        const numericToken = Math.floor(100000 + Math.random() * 900000).toString();

        console.log(`\n======================================================`);
        console.log(`🔑 SECURITY TOKEN GENERATED FOR: ${email}`);
        console.log(`👉 VERIFICATION PASSCODE IS: [ ${numericToken} ]`);
        console.log(`======================================================\n`);

        await pool.query(
            `INSERT INTO verification_tokens (email, token) VALUES ($1, $2)
             ON CONFLICT (email) DO UPDATE SET token = $2`,
            [email, numericToken]
        );

        const emailTemplate = {
            from: '"Test Sphere System" <no-reply@testsphere.edu>',
            to: email,
            subject: "Test Sphere Portal - Faculty Security Access Token",
            text: `Your dynamic security authorization token value is: ${numericToken}.`
        };

        await transporter.sendMail(emailTemplate);
        return res.status(200).json({ success: true, message: "Security token dispatched to your email inbox!" });

    } catch (error) {
        return res.status(200).json({ 
            success: true, 
            message: "Email routing offline. Please grab the passcode directly from your backend terminal console!" 
        });
    }
});

// API ENDPOINT: SIGN UP SUBMISSION
router.post("/signup", async (req, res) => {
    const { name, institution, email, role, password, matricNumber, level, staffId, deptToken } = req.body;

    try {
        const userExistCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExistCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Email account already exists." });
        }

        if (role === "lecturer") {
            const tokenRecord = await pool.query("SELECT * FROM verification_tokens WHERE email = $1", [email]);
            if (tokenRecord.rows.length === 0 || tokenRecord.rows[0].token !== deptToken) {
                return res.status(403).json({ success: false, message: "Invalid or mismatched email token input value." });
            }
            await pool.query("DELETE FROM verification_tokens WHERE email = $1", [email]);
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