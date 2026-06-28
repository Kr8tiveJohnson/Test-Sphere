const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// API ENDPOINT: DEPLOY AND SAVE TEST
router.post("/create", async (req, res) => {
    const { courseCode, title, duration, totalMarks, questions } = req.body;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        
        let courseResult = await client.query("SELECT id FROM courses WHERE course_code = $1", [courseCode]);
        let courseId;
        if (courseResult.rows.length === 0) {
            const newCourse = await client.query(
                "INSERT INTO courses (course_code, course_title) VALUES ($1, $2) RETURNING id",
                [courseCode, courseCode + " (Auto Created)"]
            );
            courseId = newCourse.rows[0].id;
        } else {
            courseId = courseResult.rows[0].id;
        }

        const testInsertion = await client.query(
            "INSERT INTO tests (course_id, title, duration_minutes) VALUES ($1, $2, $3) RETURNING id",
            [courseId, title, parseInt(duration)]
        );
        const createdTestId = testInsertion.rows[0].id;
        
        for (let q of questions) {
            await client.query(
                `INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [createdTestId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer]
            );
        }
        await client.query("COMMIT");
        return res.status(201).json({ success: true, testId: createdTestId });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Test Creation Error:", error);
        return res.status(500).json({ success: false, message: "Transaction failed.", error: error.message });
    } finally {
        client.release();
    }
});

// API ENDPOINT: STREAM ASSESSMENT QUESTIONS
router.get("/fetch/:id", async (req, res) => {
    const testId = req.params.id;

    if (!testId || testId === 'undefined') {
        return res.status(400).json({ success: false, message: "Invalid or missing Test ID" });
    }

    try {
        const questionsQuery = await pool.query(
            `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option 
             FROM questions WHERE test_id = $1`,
            [testId]
        );

        const formattedQuestions = questionsQuery.rows.map((row, index) => {
            let correctIndex = 0;
            if (row.correct_option === 'B') correctIndex = 1;
            else if (row.correct_option === 'C') correctIndex = 2;
            else if (row.correct_option === 'D') correctIndex = 3;

            return {
                id: index + 1,
                q: row.question_text,
                options: [row.option_a, row.option_b, row.option_c, row.option_d],
                correct: correctIndex
            };
        });

        return res.status(200).json({ success: true, questions: formattedQuestions });

    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ success: false, message: "Error reading database." });
    }
});

module.exports = router;