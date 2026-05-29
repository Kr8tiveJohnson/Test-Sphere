const express = require('express');
const router = express.Router();
const passport = require('passport');

// Import your controllers (keeping your exact filename: lectuerController)
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const lectuerController = require('./controllers/lectuerController');
const studentController = require('./controllers/studentController');

// Helper middleware to secure routes via Passport JWT
const requireAuth = passport.authenticate('jwt', { session: false });

// Role-based authorization guard matrix
const requireRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }
    next();
};

// ==========================================
// 🔓 PUBLIC AUTHENTICATION NETWORK LINES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/verify-lecturer', authController.verifyLecturer);

// ==========================================
// 🔒 SECURE ADMIN ENDPOINTS
// ==========================================
router.get('/admin/users', requireAuth, requireRole(['admin']), adminController.getAllUsers);
router.post('/admin/courses', requireAuth, requireRole(['admin']), adminController.createCourse);

// ==========================================
// 🔒 SECURE LECTURER ENDPOINTS
// ==========================================
router.post('/lecturer/tests', requireAuth, requireRole(['lecturer']), lectuerController.createTest);
router.get('/lecturer/courses/:courseId/tests', requireAuth, requireRole(['lecturer', 'admin']), lectuerController.getCourseTests);

// ==========================================
// 🔒 SECURE STUDENT ENDPOINTS
// ==========================================
router.post('/student/submit', requireAuth, requireRole(['student']), studentController.submitTest);
router.put('/student/profile/picture', requireAuth, requireRole(['student']), studentController.updateProfilePicture);
router.get('/student/courses/:courseId/tests', requireAuth, requireRole(['student', 'admin']), studentController.getStudentDashboardTests); // 👈 ADD THIS SECURE LINE

module.exports = router;