// routes/grades.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// API ENDPOINT: PROCESS SUBMISSION, GRADE AUTOMATICALLY, AND WRITE OFFICIAL TRANSCRIPT RECORD
router.post("/submit-test", async (req, res) => {
    // Note: in production, studentId would come from a verified session/cookie token
    const { studentId, testId, submissions } = req.body; 

    try {
        // 1. Pull the official answer keys from the database for this specific test
        const questionsResult = await pool.query(
            "SELECT id, correct_answer FROM test_questions WHERE test_id = $1", 
            [testId]
        );
        const answerKeys = questionsResult.rows;
        
        let totalQuestions = answerKeys.length;
        let correctCount = 0;

        // 2. Cross-reference student submissions with database answer keys
        answerKeys.forEach((q) => {
            // Find what the student chose for this question ID
            const studentChoice = submissions.find(s => s.questionId == q.id);
            if (studentChoice && studentChoice.chosenAnswer === q.correct_answer) {
                correctCount++;
            }
        });

        // 3. Compute institutional performance statistics
        const rawPercentage = (correctCount / totalQuestions) * 100;
        const scorePercentage = Math.round(rawPercentage * 100) / 100; // Round cleanly to 2 decimal places

        // 4. Run the data matrix through the academic bracket loop
        let letterGrade = "F";
        let gradePoint = 0.0;
        let status = "FAIL";

        if (scorePercentage >= 70) {
            letterGrade = "A"; gradePoint = 5.0; status = "PASS";
        } else if (scorePercentage >= 60) {
            letterGrade = "B"; gradePoint = 4.0; status = "PASS";
        } else if (scorePercentage >= 50) {
            letterGrade = "C"; gradePoint = 3.0; status = "PASS";
        } else if (scorePercentage >= 45) {
            letterGrade = "D"; gradePoint = 2.0; status = "PASS";
        } else if (scorePercentage >= 40) {
            letterGrade = "E"; gradePoint = 1.0; status = "PASS";
        } else {
            letterGrade = "F"; gradePoint = 0.0; status = "FAIL";
        }

        // 5. Commit the official record to the database ledger
        const saveResult = await pool.query(
            `INSERT INTO student_results 
             (student_id, test_id, total_questions, correct_answers, score_percentage, letter_grade, grade_point, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [studentId, testId, totalQuestions, correctCount, scorePercentage, letterGrade, gradePoint, status]
        );

        // 6. Return a comprehensive, premium-tier institutional report layout object
        return res.status(200).json({
            success: true,
            message: "Assessment submission graded and authenticated.",
            reportCard: {
                totalQuestions: totalQuestions,
                correctAnswers: correctCount,
                percentage: scorePercentage + "%",
                grade: letterGrade,
                gp: gradePoint.toFixed(2),
                status: status,
                timestamp: saveResult.rows[0].submitted_at
            }
        });

    } catch (error) {
        console.error("Grading matrix core failure:", error);
        return res.status(500).json({ success: false, message: "Engine failed to process score evaluation." });
    }
});

module.exports = router;