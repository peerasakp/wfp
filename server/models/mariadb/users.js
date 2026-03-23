const sequelizePaginate = require('sequelize-paginate');
const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const model = sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "email_UNIQUE"
    },
    username: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    first_working_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    updated_by: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp')
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    house_number: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    sub_district: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    province: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    postal_code: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    employee_types_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'employee_types',
        key: 'id'
      }
    },
    positions_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'positions',
        key: 'id'
      }
    },
    departments_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    roles_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    sector_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'sector',
        key: 'id'
      }
    },
    psn_id: {
      type: DataTypes.STRING(8),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "email_UNIQUE",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "fk_users_employee_types1_idx",
        using: "BTREE",
        fields: [
          { name: "employee_types_id" },
        ]
      },
      {
        name: "fk_users_positions1_idx",
        using: "BTREE",
        fields: [
          { name: "positions_id" },
        ]
      },
      {
        name: "fk_users_departments1_idx",
        using: "BTREE",
        fields: [
          { name: "departments_id" },
        ]
      },
      {
        name: "fk_users_roles1_idx",
        using: "BTREE",
        fields: [
          { name: "roles_id" },
        ]
      },
      {
        name: "fk_users_sector1_idx",
        using: "BTREE",
        fields: [
          { name: "sector_id" },
        ]
      },
    ]
  });
  sequelizePaginate.paginate(model);
  return model;
};