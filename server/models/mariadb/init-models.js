const sequelizePaginate = require('sequelize-paginate');
var DataTypes = require("sequelize").DataTypes;
var _activityLogs = require("./activity_logs");
var _categories = require("./categories");
var _children = require("./children");
var _childrenInfomation = require("./children_infomation");
var _departments = require("./departments");
var _employeeTypes = require("./employee_types");
var _logCategory = require("./log_category");
var _logSubCategory = require("./log_sub_category");
var _permissions = require("./permissions");
var _permissionsHasRoles = require("./permissions_has_roles");
var _positions = require("./positions");
var _reimbursementsAssist = require("./reimbursements_assist");
var _reimbursementsAssistHasSubCategories = require("./reimbursements_assist_has_sub_categories");
var _reimbursementsChildrenEducation = require("./reimbursements_children_education");
var _reimbursementsChildrenEducationHasChildrenInfomation = require("./reimbursements_children_education_has_children_infomation");
var _reimbursementsEmployeeDeceased = require("./reimbursements_employee_deceased");
var _reimbursementsEmployeeDeceasedHasCategories = require("./reimbursements_employee_deceased_has_categories");
var _reimbursementsGeneral = require("./reimbursements_general");
var _reimbursementsGeneralHasSubCategories = require("./reimbursements_general_has_sub_categories");
var _roles = require("./roles");
var _sector = require("./sector");
var _subCategories = require("./sub_categories");
var _users = require("./users");
var _viewCategoryWelfareSub = require("./view_category_welfare_sub");
var _viewDashboard = require("./view_dashboard");
var _viewReimbursements = require("./view_reimbursements");
var _welfareTypes = require("./welfare_types");
var _viewDashboard = require("./view_dashboard");

function initModels(sequelize) {
  var activityLogs = _activityLogs(sequelize, DataTypes);
  var categories = _categories(sequelize, DataTypes);
  var children = _children(sequelize, DataTypes);
  var childrenInfomation = _childrenInfomation(sequelize, DataTypes);
  var departments = _departments(sequelize, DataTypes);
  var employeeTypes = _employeeTypes(sequelize, DataTypes);
  var logCategory = _logCategory(sequelize, DataTypes);
  var logSubCategory = _logSubCategory(sequelize, DataTypes);
  var permissions = _permissions(sequelize, DataTypes);
  var permissionsHasRoles = _permissionsHasRoles(sequelize, DataTypes);
  var positions = _positions(sequelize, DataTypes);
  var reimbursementsAssist = _reimbursementsAssist(sequelize, DataTypes);
  var reimbursementsAssistHasSubCategories = _reimbursementsAssistHasSubCategories(sequelize, DataTypes);
  var reimbursementsChildrenEducation = _reimbursementsChildrenEducation(sequelize, DataTypes);
  var reimbursementsChildrenEducationHasChildrenInfomation = _reimbursementsChildrenEducationHasChildrenInfomation(sequelize, DataTypes);
  var reimbursementsEmployeeDeceased = _reimbursementsEmployeeDeceased(sequelize, DataTypes);
  var reimbursementsEmployeeDeceasedHasCategories = _reimbursementsEmployeeDeceasedHasCategories(sequelize, DataTypes);
  var reimbursementsGeneral = _reimbursementsGeneral(sequelize, DataTypes);
  var reimbursementsGeneralHasSubCategories = _reimbursementsGeneralHasSubCategories(sequelize, DataTypes);
  var roles = _roles(sequelize, DataTypes);
  var sector = _sector(sequelize, DataTypes);
  var subCategories = _subCategories(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var viewCategoryWelfareSub = _viewCategoryWelfareSub(sequelize, DataTypes);
  var viewDashboard = _viewDashboard(sequelize, DataTypes);
  var viewReimbursements = _viewReimbursements(sequelize, DataTypes);
  var welfareTypes = _welfareTypes(sequelize, DataTypes);
  var viewDashboard = _viewDashboard(sequelize, DataTypes);

  activityLogs.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(activityLogs, { as: "activity_logs", foreignKey: "user_id"});
  categories.belongsToMany(reimbursementsEmployeeDeceased, { as: 'reimbursements_employee_deceased_id_reimbursements_employee_deceaseds', through: reimbursementsEmployeeDeceasedHasCategories, foreignKey: "categories_id", otherKey: "reimbursements_employee_deceased_id" });
  childrenInfomation.belongsToMany(reimbursementsChildrenEducation, { as: 'reimbursements_children_education_id_reimbursements_children_educations', through: reimbursementsChildrenEducationHasChildrenInfomation, foreignKey: "children_infomation_id", otherKey: "reimbursements_children_education_id" });
  permissions.belongsToMany(roles, { as: 'roles_id_roles', through: permissionsHasRoles, foreignKey: "permissions_id", otherKey: "roles_id" });
  reimbursementsAssist.belongsToMany(subCategories, { as: 'sub_categories_id_sub_categories', through: reimbursementsAssistHasSubCategories, foreignKey: "reimbursements_assist_id", otherKey: "sub_categories_id" });
  reimbursementsChildrenEducation.belongsToMany(childrenInfomation, { as: 'children_infomation_id_children_infomations', through: reimbursementsChildrenEducationHasChildrenInfomation, foreignKey: "reimbursements_children_education_id", otherKey: "children_infomation_id" });
  reimbursementsEmployeeDeceased.belongsToMany(categories, { as: 'categories_id_categories', through: reimbursementsEmployeeDeceasedHasCategories, foreignKey: "reimbursements_employee_deceased_id", otherKey: "categories_id" });
  reimbursementsGeneral.belongsToMany(subCategories, { as: 'sub_categories_id_sub_categories_reimbursements_general_has_sub_categories', through: reimbursementsGeneralHasSubCategories, foreignKey: "reimbursements_general_id", otherKey: "sub_categories_id" });
  roles.belongsToMany(permissions, { as: 'permissions_id_permissions', through: permissionsHasRoles, foreignKey: "roles_id", otherKey: "permissions_id" });
  subCategories.belongsToMany(reimbursementsAssist, { as: 'reimbursements_assist_id_reimbursements_assists', through: reimbursementsAssistHasSubCategories, foreignKey: "sub_categories_id", otherKey: "reimbursements_assist_id" });
  subCategories.belongsToMany(reimbursementsGeneral, { as: 'reimbursements_general_id_reimbursements_generals', through: reimbursementsGeneralHasSubCategories, foreignKey: "sub_categories_id", otherKey: "reimbursements_general_id" });
  logCategory.belongsTo(categories, { as: "category", foreignKey: "categories_id"});
  categories.hasMany(logCategory, { as: "log_categories", foreignKey: "categories_id"});
  reimbursementsAssist.belongsTo(categories, { as: "category", foreignKey: "categories_id"});
  categories.hasMany(reimbursementsAssist, { as: "reimbursements_assists", foreignKey: "categories_id"});
  reimbursementsChildrenEducation.belongsTo(categories, { as: "category", foreignKey: "categories_id"});
  categories.hasMany(reimbursementsChildrenEducation, { as: "reimbursements_children_educations", foreignKey: "categories_id"});
  reimbursementsEmployeeDeceasedHasCategories.belongsTo(categories, { as: "category", foreignKey: "categories_id"});
  categories.hasMany(reimbursementsEmployeeDeceasedHasCategories, { as: "reimbursements_employee_deceased_has_categories", foreignKey: "categories_id"});
  reimbursementsGeneral.belongsTo(categories, { as: "category", foreignKey: "categories_id"});
  categories.hasMany(reimbursementsGeneral, { as: "reimbursements_generals", foreignKey: "categories_id"});
  subCategories.belongsTo(categories, { as: "category", foreignKey: "categories_id"});
  categories.hasMany(subCategories, { as: "sub_categories", foreignKey: "categories_id"});
  reimbursementsChildrenEducationHasChildrenInfomation.belongsTo(childrenInfomation, { as: "children_infomation", foreignKey: "children_infomation_id"});
  childrenInfomation.hasMany(reimbursementsChildrenEducationHasChildrenInfomation, { as: "reimbursements_children_education_has_children_infomations", foreignKey: "children_infomation_id"});
  users.belongsTo(departments, { as: "department", foreignKey: "departments_id"});
  departments.hasMany(users, { as: "users", foreignKey: "departments_id"});
  users.belongsTo(employeeTypes, { as: "employee_type", foreignKey: "employee_types_id"});
  employeeTypes.hasMany(users, { as: "users", foreignKey: "employee_types_id"});
  permissionsHasRoles.belongsTo(permissions, { as: "permission", foreignKey: "permissions_id"});
  permissions.hasMany(permissionsHasRoles, { as: "permissions_has_roles", foreignKey: "permissions_id"});
  users.belongsTo(positions, { as: "position", foreignKey: "positions_id"});
  positions.hasMany(users, { as: "users", foreignKey: "positions_id"});
  reimbursementsAssistHasSubCategories.belongsTo(reimbursementsAssist, { as: "reimbursements_assist", foreignKey: "reimbursements_assist_id"});
  reimbursementsAssist.hasMany(reimbursementsAssistHasSubCategories, { as: "reimbursements_assist_has_sub_categories", foreignKey: "reimbursements_assist_id"});
  reimbursementsChildrenEducationHasChildrenInfomation.belongsTo(reimbursementsChildrenEducation, { as: "reimbursements_children_education", foreignKey: "reimbursements_children_education_id"});
  reimbursementsChildrenEducation.hasMany(reimbursementsChildrenEducationHasChildrenInfomation, { as: "reimbursements_children_education_has_children_infomations", foreignKey: "reimbursements_children_education_id"});
  reimbursementsEmployeeDeceasedHasCategories.belongsTo(reimbursementsEmployeeDeceased, { as: "reimbursements_employee_deceased", foreignKey: "reimbursements_employee_deceased_id"});
  reimbursementsEmployeeDeceased.hasMany(reimbursementsEmployeeDeceasedHasCategories, { as: "reimbursements_employee_deceased_has_categories", foreignKey: "reimbursements_employee_deceased_id"});
  reimbursementsGeneralHasSubCategories.belongsTo(reimbursementsGeneral, { as: "reimbursements_general", foreignKey: "reimbursements_general_id"});
  reimbursementsGeneral.hasMany(reimbursementsGeneralHasSubCategories, { as: "reimbursements_general_has_sub_categories", foreignKey: "reimbursements_general_id"});
  permissionsHasRoles.belongsTo(roles, { as: "role", foreignKey: "roles_id"});
  roles.hasMany(permissionsHasRoles, { as: "permissions_has_roles", foreignKey: "roles_id"});
  users.belongsTo(roles, { as: "role", foreignKey: "roles_id"});
  roles.hasMany(users, { as: "users", foreignKey: "roles_id"});
  users.belongsTo(sector, { as: "sector", foreignKey: "sector_id"});
  sector.hasMany(users, { as: "users", foreignKey: "sector_id"});
  childrenInfomation.belongsTo(subCategories, { as: "sub_category", foreignKey: "sub_categories_id"});
  subCategories.hasMany(childrenInfomation, { as: "children_infomations", foreignKey: "sub_categories_id"});
  logSubCategory.belongsTo(subCategories, { as: "sub_category", foreignKey: "sub_categories_id"});
  subCategories.hasMany(logSubCategory, { as: "log_sub_categories", foreignKey: "sub_categories_id"});
  reimbursementsAssistHasSubCategories.belongsTo(subCategories, { as: "sub_category", foreignKey: "sub_categories_id"});
  subCategories.hasMany(reimbursementsAssistHasSubCategories, { as: "reimbursements_assist_has_sub_categories", foreignKey: "sub_categories_id"});
  reimbursementsGeneralHasSubCategories.belongsTo(subCategories, { as: "sub_category", foreignKey: "sub_categories_id"});
  subCategories.hasMany(reimbursementsGeneralHasSubCategories, { as: "reimbursements_general_has_sub_categories", foreignKey: "sub_categories_id"});
  children.belongsTo(users, { as: "user", foreignKey: "users_id"});
  users.hasMany(children, { as: "children", foreignKey: "users_id"});
  reimbursementsAssist.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(reimbursementsAssist, { as: "reimbursements_assists", foreignKey: "created_by"});
  reimbursementsChildrenEducation.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(reimbursementsChildrenEducation, { as: "reimbursements_children_educations", foreignKey: "created_by"});
  reimbursementsEmployeeDeceased.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(reimbursementsEmployeeDeceased, { as: "reimbursements_employee_deceaseds", foreignKey: "created_by"});
  reimbursementsGeneral.belongsTo(users, { as: "created_by_user", foreignKey: "created_by"});
  users.hasMany(reimbursementsGeneral, { as: "reimbursements_generals", foreignKey: "created_by"});
  categories.belongsTo(welfareTypes, { as: "welfare_type", foreignKey: "welfare_types_id"});
  welfareTypes.hasMany(categories, { as: "categories", foreignKey: "welfare_types_id"});

  return {
    activityLogs,
    categories,
    children,
    childrenInfomation,
    departments,
    employeeTypes,
    logCategory,
    logSubCategory,
    permissions,
    permissionsHasRoles,
    positions,
    reimbursementsAssist,
    reimbursementsAssistHasSubCategories,
    reimbursementsChildrenEducation,
    reimbursementsChildrenEducationHasChildrenInfomation,
    reimbursementsEmployeeDeceased,
    reimbursementsEmployeeDeceasedHasCategories,
    reimbursementsGeneral,
    reimbursementsGeneralHasSubCategories,
    roles,
    sector,
    subCategories,
    users,
    viewCategoryWelfareSub,
    viewDashboard,
    viewReimbursements,
    welfareTypes,
    viewDashboard,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
