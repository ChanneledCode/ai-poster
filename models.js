const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: console.log // This will log all SQL queries
});

const Prompt = sequelize.define('Prompt', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  promptContent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
});

Prompt.hasMany(Template, { foreignKey: 'promptId' });
Template.belongsTo(Prompt, { foreignKey: 'promptId' });

module.exports = { sequelize, Prompt, Template };