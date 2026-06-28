const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

// ==========================================
// 💡 CRITICAL LOADING ORDER FOR SCRIPT STRUCTURE
// ==========================================
const models = require('./models'); // 1. Load centralized model registry with relationship mappings
const db = models.sequelize; // 2. Extract the safe, resolved sequelize instance
const redisClient = require('./redis'); // 3. Pull in Redis Cache Memory Engine
const apiRoutes = require('./routes'); // 4. Mount routes AFTER database context is fully established

// Initialize Express Engine
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Security Strategy Configuration
require('./config/passport')(passport);

// Configuration Layer for Middleware Matrix
app.use(cors({
    origin: true, // Allow all origins for local development flexibility
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize()); // Initialize Passport instance

// ==========================================
// 🌐 NETWORK ENTRY ARCHITECTURE
// ==========================================

// Base Server Core Verification Route - Serve Frontend Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Diagnostic Storage Connectivity Verification Endpoint
app.get('/api/health-check', async (req, res) => {
    try {
        // 1. Probe PostgreSQL Layer via clean Sequelize authentication handshake
        let dbStatus = "Disconnected";
        try {
            await db.authenticate();
            dbStatus = "Connected";
        } catch (dbErr) {
            dbStatus = `Error: ${dbErr.message}`;
        }

        // 2. Probe Redis Layer
        let redisStatus = "Disconnected";
        if (redisClient && redisClient.isOpen) {
            await redisClient.set('health_check_probe', 'active', { EX: 10 });
            const redisVal = await redisClient.get('health_check_probe');
            if (redisVal === 'active') redisStatus = "Connected";
        } else {
            redisStatus = "Skipped / Local Only";
        }

        res.status(200).json({
            status: "Operational",
            timestamp: new Date(),
            systems: {
                postgres: dbStatus,
                redis: redisStatus
            }
        });
    } catch (error) {
        console.error("Health probe critical failure:", error);
        res.status(500).json({ 
            status: "Unstable", 
            error: error.message 
        });
    }
});

// Mount all test-sphere endpoints under the "/api" root prefix
app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));
// ==========================================
// 🚀 DEPLOYMENT RUNTIME INITIALIZATION
// ==========================================

if (process.env.NODE_ENV !== 'production') {
    // 🖥️ LOCAL RUNTIME ENVIRONMENT (Runs permanently inside VS Code terminal)
    db.sync({ alter: true }) // Safe structural updates without losing data
        .then(() => {
            console.log('📦 Core Database Models synchronized successfully.');
            app.listen(PORT, () => {
                console.log(`\n=================================================`);
                console.log(`🚀 Test Sphere Server Core deployed on Port ${PORT}`);
                console.log(`🔗 Target Environment Dashboard: ${process.env.CORS_ORIGIN || 'http://127.0.0.1:5500'}`);
                console.log(`=================================================\n`);
            });
        })
        .catch(err => {
            console.error('❌ Failed to synchronize database layout layers:', err);
        });
} else {
    // ☁️ SERVERLESS PRODUCTION ENVIRONMENT (Executes on Vercel invoking Supabase)
    db.sync({ alter: true })
        .then(() => {
            console.log('📦 Core Database Models synchronized successfully on Vercel.');
        })
        .catch(err => {
            console.error('Database Sync Error on Vercel:', err);
        });
}

// ==========================================
// 🎨 FRONTEND VIEW ROUTING
// ==========================================

// Student Routes
app.get('/portal', (req, res) => res.sendFile(path.join(__dirname, 'views', 'student', 'portal.html')));
app.get('/student/portal', (req, res) => res.sendFile(path.join(__dirname, 'views', 'student', 'portal.html')));

// Lecturer Routes
app.get('/lecturer/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'lecturer', 'dashboard.html')));
app.get('/lecturer/builder', (req, res) => res.sendFile(path.join(__dirname, 'views', 'lecturer', 'create-test.html')));
app.get('/lecturer/analytics', (req, res) => res.sendFile(path.join(__dirname, 'views', 'lecturer', 'analytics.html')));

// Admin Routes
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html')));

// Route: Serve the test-runner (The Assessment Engine)
// This will work for any test: /test-runner?testId=1
app.get('/test-runner', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student', 'test-portal.html'));
});

// In server.js
const testRoutes = require('./routes/tests'); // Make sure the path is correct
app.use('/api/tests', testRoutes);

// 💡 CRITICAL FOR VERCEL FUNCTION INVOCATION CONTEXT
module.exports = app;

