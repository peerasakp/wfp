const sequelizePaginate = require('sequelize-paginate');
const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const model = sequelize.define('activityLogs', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    before_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    after_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    detail: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp'),
    },
  }, {
    sequelize,
    tableName: 'activity_logs',
    timestamps: false,
    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: [
          { name: 'id' },
        ],
      },
      {
        name: 'fk_activity_logs_users1_idx',
        using: 'BTREE',
        fields: [
          { name: 'user_id' },
        ],
      },
    ],
  });

  sequelizePaginate.paginate(model);
  return model;
};

