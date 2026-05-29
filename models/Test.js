const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Test', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: false },
        duration: { type: DataTypes.INTEGER, allowNull: false },
        questions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        isPublished: { type: DataTypes.BOOLEAN, defaultValue: false }
    });
};