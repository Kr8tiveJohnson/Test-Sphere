const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// API ENDPOINT: DEPLOY AND SAVE TEST
router.post("/create", async (req, res) => {
    const { courseCode, title, duration, totalMarks, questions } = req.body;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const testInsertion = await client.query(
            "INSERT INTO tests (course_code, title, duration, total_marks) VALUES ($1, $2, $3, $4) RETURNING id",
            [courseCode, title, parseInt(duration), parseInt(totalMarks)]
        );
        const createdTestId = testInsertion.rows[0].id;
        for (let q of questions) {
            await client.query(
                `INSERT INTO test_questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [createdTestId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer]
            );
        }
        await client.query("COMMIT");
        return res.status(201).json({ success: true, testId: createdTestId });
    } catch (error) {
        await client.query("ROLLBACK");
        return res.status(500).json({ success: false, message: "Transaction failed." });
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
            `SELECT id, question_text, option_a, option_b, option_c, option_d 
             FROM test_questions WHERE test_id = $1`,
            [testId]
        );

        const formattedQuestions = questionsQuery.rows.map((row, index) => ({
            id: index + 1,
            q: row.question_text,
            options: [row.option_a, row.option_b, row.option_c, row.option_d]
        }));

        return res.status(200).json({ success: true, questions: formattedQuestions });

    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ success: false, message: "Error reading database." });
    }
});

module.exports = router;