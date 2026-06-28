const { User } = require('../models'); // ✅ Centralized index registry import
const jwt = require('jsonwebtoken');

// ==========================================
// 🔓 1. USER ACCOUNT REGISTRATION
// ==========================================
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already registered.' });

        // Require Secret Token for Lecturers
        if (role === 'lecturer') {
            const secret = process.env.DEPARTMENT_KEY || 'TESTSPHERE-2026';
            if (req.body.deptToken !== secret) {
                return res.status(403).json({ success: false, message: 'Invalid Department Registration Key.' });
            }
        }

        // Write directly to Supabase via Sequelize
        const user = await User.create({ 
            name, 
            email, 
            password, 
            role,
            isVerified: true
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            userId: user.id,
            requiresVerification: false
        });
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