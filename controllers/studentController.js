const { Test, Result, User } = require('../models'); // ✅ Fixed model mapping to singular 'Result', added 'User'
const redisClient = require('../redis'); // Points straight to your root folder file

// ==========================================
// 🔒 1. TEST SUBMISSION & DYNAMIC GRADING
// ==========================================
exports.submitTest = async (req, res) => {
    try {
        const { testId, answersSubmitted } = req.body;
        const studentId = req.user.id; // Pulled straight out of Passport decrypted JWT verification

        const test = await Test.findByPk(testId);
        if (!test) return res.status(404).json({ message: 'Target test matrix unavailable.' });

        // Calculate grading metrics dynamically
        let correctAnswers = 0;
        test.questions.forEach((q, index) => {
            if (answersSubmitted[index] === q.correctOption) {
                correctAnswers++;
            }
        });

        const score = (correctAnswers / test.questions.length) * 100;

        // Write directly to Supabase via Singular Result Model
        const result = await Result.create({
            score,
            totalQuestions: test.questions.length,
            correctAnswers,
            answersSubmitted,
            testId: testId,
            studentId: studentId
        });

        // 🚀 HOT-DATA ANALYSIS INGESTION: Push immediate stream telemetries straight into Redis
        if (redisClient && redisClient.isOpen) {
            const analyticalPayload = {
                studentId,
                score,
                timestamp: Date.now()
            };
            // Cache recent scores for rapid visual metrics plotting on Port 5500
            await redisClient.lPush(`analytics:test:${testId}:stream`, JSON.stringify(analyticalPayload));
            await redisClient.lTrim(`analytics:test:${testId}:stream`, 0, 99); // Retain top 100 historical records in hot-cache memory
        }

        res.status(200).json({ message: 'Submission compiled successfully.', score, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 🔒 2. UPDATE STUDENT PROFILE PICTURE URL
// ==========================================
exports.updateProfilePicture = async (req, res) => {
    try {
        const { profilePictureUrl } = req.body;
        const studentId = req.user.id;

        if (!profilePictureUrl) {
            return res.status(400).json({ message: 'Profile picture image reference URL is required.' });
        }

        // Locate student record inside Supabase
        const student = await User.findByPk(studentId);
        if (!student) return res.status(404).json({ message: 'Student record could not be resolved.' });

        // Update the picture link slot directly
        student.profilePicture = profilePictureUrl;
        await student.save();

        res.status(200).json({ 
            message: 'Profile picture reference synchronized successfully.', 
            profilePicture: student.profilePicture 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// ==========================================
// 🔒 3. GET TESTS FOR STUDENT DASHBOARD (SAFE)
// ==========================================
exports.getStudentDashboardTests = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Fetch all tests linked to this course
        const tests = await Test.findAll({ where: { courseId } });
        
        // Strip out correct answers before sending them down to the student dashboard matrix
        const safeTests = tests.map(test => {
            const cleanQuestions = test.questions.map(q => {
                // Return everything except the answer key
                const { correctOption, ...safeQuestionData } = q;
                return safeQuestionData;
            });
            
            return {
                id: test.id,
                title: test.title,
                duration: test.duration,
                courseId: test.courseId,
                questions: cleanQuestions // Purely questions and options only
            };
        });

        res.status(200).json(safeTests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};