// routes/analytics.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// API ENDPOINT: FETCH ALL STUDENT RESULTS WITH ADVANCED METRICS
router.get("/overview", async (req, res) => {
    const { courseCode } = req.query;

    try {
        // High-quality mock data for the Advanced Analytics Vault demonstration
        const mockResults = [
            {
                student_id: "2024-001",
                course_code: "CSC 201",
                test_title: "Midterm Assessment",
                correct_answers: 45,
                total_questions: 50,
                score_percentage: 90,
                letter_grade: "A",
                grade_point: 4.0,
                status: "PASS"
            },
            {
                student_id: "2024-042",
                course_code: "CSC 201",
                test_title: "Midterm Assessment",
                correct_answers: 20,
                total_questions: 50,
                score_percentage: 40,
                letter_grade: "F",
                grade_point: 0.0,
                status: "FAIL"
            },
            {
                student_id: "2024-118",
                course_code: "CSC 201",
                test_title: "Midterm Assessment",
                correct_answers: 38,
                total_questions: 50,
                score_percentage: 76,
                letter_grade: "B",
                grade_point: 3.5,
                status: "PASS"
            },
            {
                student_id: "2024-005",
                course_code: "CSC 301",
                test_title: "Data Structures Quiz",
                correct_answers: 18,
                total_questions: 20,
                score_percentage: 90,
                letter_grade: "A",
                grade_point: 4.0,
                status: "PASS"
            },
            {
                student_id: "2024-099",
                course_code: "MTH 101",
                test_title: "Calculus I Final",
                correct_answers: 85,
                total_questions: 100,
                score_percentage: 85,
                letter_grade: "A",
                grade_point: 4.0,
                status: "PASS"
            }
        ];

        // Filter results based on the selected course
        let filteredResults = mockResults;
        if (courseCode && courseCode !== "ALL") {
            filteredResults = mockResults.filter(r => r.course_code.replace(" ", "") === courseCode);
        }

        // Calculate macro statistics
        const total = filteredResults.length;
        const passes = filteredResults.filter(r => r.status === "PASS").length;
        const average = total > 0 ? filteredResults.reduce((acc, curr) => acc + curr.score_percentage, 0) / total : 0;
        const passRate = total > 0 ? Math.round((passes / total) * 100) : 0;

        return res.status(200).json({
            success: true,
            metrics: {
                classAverage: average.toFixed(1),
                totalSubmissions: total,
                passRate: passRate,
                tabSwitches: Math.floor(Math.random() * 5),
                timeouts: Math.floor(Math.random() * 3),
                topicMastery: {
                    "ALGORITHMS": Math.floor(Math.random() * 40) + 60,
                    "DATA_TYPES": Math.floor(Math.random() * 40) + 60,
                    "LOGIC_GATES": Math.floor(Math.random() * 40) + 60
                }
            },
            results: filteredResults
        });

    } catch (error) {
        console.error("Analytics extraction engine failure:", error);
        return res.status(500).json({ success: false, message: "Failed to extract ledger metrics." });
    }
});

module.exports = router;