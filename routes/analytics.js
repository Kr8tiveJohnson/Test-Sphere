// routes/analytics.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// API ENDPOINT: FETCH ALL STUDENT RESULTS WITH ADVANCED METRICS
router.get("/overview", async (req, res) => {
    const { courseCode } = req.query;

    try {
        // Base queries for ledger rows and macro statistics
        let dataQuery = `
            SELECT r.*, t.course_code, t.title as test_title 
            FROM student_results r
            JOIN tests t ON r.test_id = t.id
        `;
        let statsQuery = `
            SELECT 
                AVG(score_percentage) as class_average,
                COUNT(*) as total_submissions,
                COUNT(CASE WHEN status = 'PASS' THEN 1 END) as total_passes
            FROM student_results r
            JOIN tests t ON r.test_id = t.id
        `;
        
        const queryParams = [];
        if (courseCode && courseCode !== "ALL") {
            dataQuery += " WHERE t.course_code = $1";
            statsQuery += " WHERE t.course_code = $1";
            queryParams.push(courseCode);
        }

        dataQuery += " ORDER BY r.submitted_at DESC";

        // Execute parallel database reads
        const [rowsResult, statsResult] = await pool.all ? 
            await Promise.all([pool.query(dataQuery, queryParams), pool.query(statsQuery, queryParams)]) :
            [await pool.query(dataQuery, queryParams), await pool.query(statsQuery, queryParams)];

        const stats = statsResult.rows[0];
        const total = parseInt(stats.total_submissions) || 0;
        const passes = parseInt(stats.total_passes) || 0;
        const average = parseFloat(stats.class_average) || 0;
        const passRate = total > 0 ? Math.round((passes / total) * 100) : 0;

        return res.status(200).json({
            success: true,
            metrics: {
                classAverage: average.toFixed(2) + "%",
                totalSubmissions: total,
                passRate: passRate + "%"
            },
            results: rowsResult.rows
        });

    } catch (error) {
        console.error("Analytics extraction engine failure:", error);
        return res.status(500).json({ success: false, message: "Failed to extract ledger metrics." });
    }
});

module.exports = router;