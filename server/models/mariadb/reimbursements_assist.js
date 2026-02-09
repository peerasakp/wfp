const sequelizePaginate = require('sequelize-paginate');
const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  const model = sequelize.define('reimbursementsAssist', {
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
      allowNull: true
    },
    fund_sum_request: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    fund_sum_receipt: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    fund_eligible: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    fund_decease: {
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
    fund_receipt_wreath: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    fund_receipt_vechicle: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    fund_vechicle: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('บันทึกฉบับร่าง','รอตรวจสอบ','อนุมัติ','ไม่อนุมัติ'),
      allowNull: false
    },
    deceased: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    deceased_type: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    file_document: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_photo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_house_registration: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_death_certificate: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'reimbursements_assist',
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
        name: "fk_reimbursements_assist_categories1_idx",
        using: "BTREE",
        fields: [
          { name: "categories_id" },
        ]
      },
      {
        name: "fk_reimbursements_assist_users1_idx",
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