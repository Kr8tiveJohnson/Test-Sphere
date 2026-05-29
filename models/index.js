// models/index.js
const db = require('../db');

// Safeguard import: Extract the correct instance if exported inside an object
const sequelize = db.define ? db : (db.sequelize || db);

// Import model factories
const createUserModel = require('./User');
const createCourseModel = require('./Course');
const createTestModel = require('./Test');
const createResultModel = require('./Result'); // 👈 Fixed to match your exact file name 'Result.js'

// Initialize instances by passing the active sequelize connection stream
const User = createUserModel(sequelize);
const Course = createCourseModel(sequelize);
const Test = createTestModel(sequelize);
const Result = createResultModel(sequelize);

// ==========================================
// 🔗 DEFINE RELATIONSHIPS & ASSOCIATIONS
// ==========================================
// User <-> Course Relationships (Lecturer handles Courses)
User.hasMany(Course, { foreignKey: 'lecturerId', as: 'taughtCourses' });
Course.belongsTo(User, { foreignKey: 'lecturerId', as: 'lecturer' });

// Course <-> Test Relationships
Course.hasMany(Test, { foreignKey: 'courseId', as: 'tests' });
Test.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Test <-> Results Relationships
Test.hasMany(Result, { foreignKey: 'testId', as: 'results' });
Result.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// User <-> Results Relationships (Student submissions)
User.hasMany(Result, { foreignKey: 'studentId', as: 'examSubmissions' });
Result.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

module.exports = {
    sequelize,
    User,
    Course,
    Test,
    Result
};