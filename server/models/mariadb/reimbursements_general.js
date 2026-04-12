const sequelizePaginate = require('sequelize-paginate');
const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const model = sequelize.define('reimbursementsGeneral', {
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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fund_eligible: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fund_sum_request: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    fund_decree: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fund_university: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fund_eligible_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fund_eligible_sum: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fund_receipt_patient_visit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fund_sum_request_patient_visit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    document_path: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    date_receipt: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    request_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('บันทึกฉบับร่าง','รอตรวจสอบ','อนุมัติ','ไม่อนุมัติ','รออนุมัติ','รอจ่ายเงิน'),
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
    categories_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    file_receipt: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_medical_certificate: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_supervisor_letter: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_receipt_patient_visit: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_medical_certificate_patient_visit: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_social_security: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'reimbursements_general',
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
        name: "fk_reimbursements_general_users1_idx",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "fk_reimbursements_general_categories1_idx",
        using: "BTREE",
        fields: [
          { name: "categories_id" },
        ]
      },
    ]
  });
  sequelizePaginate.paginate(model);
  return model;
};