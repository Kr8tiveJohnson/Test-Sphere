// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'lecturer', 'student'),
            defaultValue: 'student'
        },
        // 📧 6-DIGIT EMAIL VERIFICATION FIELDS
        verificationCode: {
            type: DataTypes.STRING,
            allowNull: true // Only populated when verifying a registration
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false // Lecturers must verify this to unlock dashboards
        },
        // 🖼️ STUDENT PROFILE PICTURE FIELD
        profilePicture: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null // Stays clean and empty until they explicitly upload one
        }
    }, {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
                
                // Automatically auto-verify students/admins if verification is only for lecturers
                if (user.role !== 'lecturer') {
                    user.isVerified = true;
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    User.prototype.comparePassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    };

    return User;
};