const { User } = require('../models'); // ✅ Centralized index registry import
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Helper function to establish nodemailer configuration using your .env keys
const getMailTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// ==========================================
// 🔓 1. USER ACCOUNT REGISTRATION
// ==========================================
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already registered.' });

        let verificationCode = null;
        
        // If registration targets a lecturer role, build out the 6-digit random code layer
        if (role === 'lecturer') {
            verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generates strong 6-digit sequence string
        }

        // Write directly to Supabase via Sequelize
        const user = await User.create({ 
            name, 
            email, 
            password, 
            role,
            verificationCode
        });

        // Fire off email ONLY if the registering user is a Lecturer
        if (role === 'lecturer') {
            try {
                const transporter = getMailTransporter();
                const mailOptions = {
                    from: `"Test Sphere Security" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: 'Verify Your Test Sphere Lecturer Account',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee;">
                            <h2 style="color: #333;">Welcome to Test Sphere, ${user.name}!</h2>
                            <p>You registered as a <strong>Lecturer</strong>. To activate your dashboard and start managing courses and tests, please use the 6-digit verification security token below:</p>
                            <div style="background: #f4f5f7; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; color: #2563eb;">
                                ${verificationCode}
                            </div>
                            <p style="font-size: 12px; color: #666;">If you did not initiate this request, please ignore this email or contact support.</p>
                        </div>
                    `
                };
                await transporter.sendMail(mailOptions);
                console.log(`📧 Verification code successfully sent to lecturer: ${user.email}`);
            } catch (mailError) {
                console.error('❌ Failed to dispatch onboarding verification email:', mailError.message);
                // We don't crash registration if email fails, but we notify the server
            }
        }

        res.status(201).json({ 
            message: role === 'lecturer' 
                ? 'Lecturer account provisioned successfully. Check your email for verification code.' 
                : 'User account provisioned successfully.', 
            userId: user.id,
            requiresVerification: role === 'lecturer'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 🔓 2. LECTURER 6-DIGIT EMAIL VERIFICATION
// ==========================================
exports.verifyLecturer = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ where: { email, role: 'lecturer' } });
        if (!user) return res.status(404).json({ message: 'Lecturer account not found.' });
        
        if (user.isVerified) return res.status(400).json({ message: 'Account is already verified.' });

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid 6-digit verification code token.' });
        }

        // Unlock permissions matrix instantly
        user.isVerified = true;
        user.verificationCode = null; // Clear verification stream memory slot
        await user.save();

        res.status(200).json({ message: 'Account verification complete. Lecturer dashboard unlocked successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 🔓 3. USER ACCOUNT SIGN-IN / LOGIN
// ==========================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid validation credentials.' });
        }

        // 🛑 SECURITY CHECK: Block unverified lecturers from accessing the dashboard panel
        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'Forbidden: Please verify your account via email code before logging in.',
                requiresVerification: true 
            });
        }

        // Signs a secure JSON Web Token mapped to production configurations
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'test_sphere_super_secret_key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token: `Bearer ${token}`,
            user: { 
                id: user.id, 
                name: user.name, 
                role: user.role,
                profilePicture: user.profilePicture 
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};