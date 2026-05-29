const { User } = require('../models'); // ✅ Clean index registry requirement
const Course = require('../models/Course');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { courseCode, title, description } = req.body;
        const newCourse = await Course.create({ courseCode, title, description });
        res.status(201).json({ message: 'Course created successfully.', course: newCourse });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};