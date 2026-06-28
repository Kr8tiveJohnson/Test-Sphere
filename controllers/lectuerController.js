const { Test } = require('../models');
const redisClient = require('../redis'); // Points straight to your root folder file

exports.createTest = async (req, res) => {
    try {
        const { title, duration, questions, courseId } = req.body;
        
        // Generate the test matrix tied to the course
        const test = await Test.create({ 
            title,
            courseId,
            questions
        });

if (!questions.length) {
    return res.status(400).json({
        message: 'At least one question required'
    });
}
        // Optimize performance: Invalidate relevant course tests cache instantly on mutation
        if (redisClient.isOpen) {
            await redisClient.del(`analytics:course:${courseId}`);
        }

        res.status(201).json({ message: 'Assessment module generated successfully.', test });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCourseTests = async (req, res) => {
    try {
        const { courseId } = req.params;
        const tests = await Test.findAll({ where: { courseId } });
        res.status(200).json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};