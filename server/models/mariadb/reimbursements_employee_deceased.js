const sequelizePaginate = require('sequelize-paginate');
const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  const model = sequelize.define('reimbursementsEmployeeDeceased', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    reim_number: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    fund_receipt: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    fund_request: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    fund_sum_request: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    fund_sum_receipt: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    fund_receipt_wreath: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    fund_wreath_university: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    fund_wreath_arrange: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    fund_receipt_vehicle: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    fund_vehicle: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('บันทึกฉบับร่าง','รอตรวจสอบ','อนุมัติ'),
      allowNull: false
    },
    organizer: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    deceased: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    request_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
    updated_by: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    file_receipt: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_id_card: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_death_certificate: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_wreath_receipt: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_wreath_document: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_vehicle_receipt: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_vehicle_document: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'reimbursements_employee_deceased',
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
        name: "fk_reimbursements_employee_deceased_users1_idx",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
    ]
  });
  sequelizePaginate.paginate(model);
  return model;
};