const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Results', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        score: { type: DataTypes.FLOAT, allowNull: false },
        totalQuestions: { type: DataTypes.INTEGER, allowNull: false },
        correctAnswers: { type: DataTypes.INTEGER, allowNull: false },
        answersSubmitted: { type: DataTypes.JSONB, allowNull: false },
        completedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });
};