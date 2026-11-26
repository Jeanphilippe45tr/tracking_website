const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../db");
const { DEFAULT_PREFS } = require("../config/constants");
const { normalizePrefs } = require("../utils/prefs");

class User extends Model {
  static hashPassword(password) {
    return bcrypt.hash(String(password), 10);
  }

  verifyPassword(password) {
    return bcrypt.compare(String(password), this.passwordHash);
  }

  // The only user shape that ever leaves the server. Never includes the
  // password hash; always returns preferences as a parsed object.
  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    values.prefs = normalizePrefs(values.prefs);
    values.joinedAt = values.createdAt;
    values.passwordChangedAt = values.passwordChangedAt || null;
    return values;
  }

  toPublicJSON() {
    return this.toJSON();
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "",
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "admin",
      validate: { isIn: [["admin", "customer"]] },
    },
    prefs: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { ...DEFAULT_PREFS },
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeValidate(user) {
        if (user.email) user.email = String(user.email).trim().toLowerCase();
        if (user.name) user.name = String(user.name).trim();
        user.prefs = normalizePrefs(user.prefs);
      },
    },
  }
);

module.exports = User;
