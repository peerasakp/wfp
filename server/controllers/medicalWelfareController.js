const BaseController = require("./BaseControllers");
const {
  reimbursementsGeneral,
  categories,
  subCategories,
  reimbursementsGeneralHasSubCategories,
  users,
  positions,
  sector,
  employeeTypes,
  departments,
  sequelize
} = require("../models/mariadb");
const { fn, col, literal, Op } = require("sequelize");
const { initLogger } = require("../logger");
const category = require("../enum/category");
const logger = initLogger("medicalWelfareController");
const status = require("../enum/status");
const {
  getFiscalYearDynamic,
  getFiscalYear,
  dynamicCheckRemaining
} = require("../middleware/utility");
const { isNullOrEmpty } = require("../controllers/utility");

class Controller extends BaseController {
  constructor() {
    super(reimbursementsGeneral);
  }

  list = async (req, res, next) => {
    const method = "GetListMedicalWelfare";
    const { id } = req.user;
    try {
      const { filter, page, itemPerPage } = req.query;
      var whereObj = { ...filter };
      const listData = await reimbursementsGeneral.paginate({
        attributes: [
          "id",
          [col("reim_number"), "reimNumber"],
          [col("request_date"), "requestDate"],
          [col("updated_at"), "updatedAt"],
          [col("fund_eligible_sum"), "fundEligibleSum"],
          [col("fund_sum_request"), "fundSumRequest"],
          "status"
        ],
        page: page && !isNaN(page) ? Number(page) : 1,
        paginate: itemPerPage && !isNaN(itemPerPage) ? Number(itemPerPage) : 0,
        where: whereObj,
        order: [
          ["updated_at", "DESC"],
          ["created_at", "DESC"]
        ]
      });

      if (listData) {
        var bindList = {};
        bindList.pagination = {
          page: page && !isNaN(page) ? Number(page) : 1,
          total: listData.total
        };
        bindList.datas = listData.docs.map((listObj) => {
          const plainObj = listObj.toJSON();
          return {
            ...plainObj
          };
        });
        logger.info("Complete", { method, data: { id } });
        res.status(200).json(bindList);
      }
    } catch (error) {
      logger.error(`Error ${error.message}`, {
        method,
        data: { id }
      });
      next(error);
    }
  };
  getRemaining = async (req, res, next) => {
    const method = "GetRemainingMedicalWelfare";
    const { id } = req.user;
    try {
      const { filter } = req.query;
      var whereObj = { ...filter };
      whereObj[Op.and].push({ "$sub_category.id$": 1 });
      const accidentRemaining =
        await reimbursementsGeneralHasSubCategories.findAll({
          attributes: [
            [col("sub_category.id"), "subCategoriesId"],
            [col("sub_category.name"), "subCategoriesName"],
            [
              fn("SUM", col("reimbursements_general.fund_eligible")),
              "totalSumRequested"
            ],
            [col("sub_category.fund"), "fund"],
            [
              literal(
                "sub_category.fund - SUM(reimbursements_general.fund_eligible)"
              ),
              "fundRemaining"
            ],
            [
              fn("COUNT", col("reimbursements_general.fund_eligible")),
              "totalCountRequested"
            ],
            [col("sub_category.per_years"), "perYears"],
            [
              literal(
                "sub_category.per_years - COUNT(reimbursements_general.fund_eligible)"
              ),
              "requestsRemaining"
            ],
            [col("sub_category.per_times"), "perTimesRemaining"],
            [col("sub_category.per_users"), "perUsers"],
            [
              literal(
                "sub_category.per_users - COUNT(reimbursements_general.fund_eligible)"
              ),
              "perUsersRemaining"
            ]
          ],
          include: [
            {
              model: subCategories,
              as: "sub_category",
              attributes: []
            },
            {
              model: reimbursementsGeneral,
              as: "reimbursements_general",
              attributes: []
            }
          ],
          where: whereObj,
          group: ["sub_category.id"]
        });
      whereObj[Op.and] = whereObj[Op.and].filter(
        (item) => item["$sub_category.id$"] !== 1
      );
      whereObj[Op.and].push({ "$sub_category.id$": 2 });
      const patientVisitRemaining =
        await reimbursementsGeneralHasSubCategories.findAll({
          attributes: [
            [col("sub_category.id"), "subCategoriesId"],
            [col("sub_category.name"), "subCategoriesName"],
            [
              fn(
                "SUM",
                col("reimbursements_general.fund_sum_request_patient_visit")
              ),
              "totalSumRequested"
            ],
            [col("sub_category.fund"), "fund"],
            [
              literal(
                "sub_category.fund - SUM(reimbursements_general.fund_sum_request_patient_visit)"
              ),
              "fundRemaining"
            ],
            [
              fn(
                "COUNT",
                col("reimbursements_general.fund_sum_request_patient_visit")
              ),
              "totalCountRequested"
            ],
            [col("sub_category.per_years"), "perYears"],
            [
              literal(
                "sub_category.per_years - COUNT(reimbursements_general.fund_sum_request_patient_visit)"
              ),
              "requestsRemaining"
            ],
            [col("sub_category.per_times"), "perTimesRemaining"],
            [col("sub_category.per_users"), "perUsers"],
            [
              literal(
                "sub_category.per_users - COUNT(reimbursements_general.fund_sum_request_patient_visit)"
              ),
              "perUsersRemaining"
            ]
          ],
          include: [
            {
              model: subCategories,
              as: "sub_category",
              attributes: []
            },
            {
              model: reimbursementsGeneral,
              as: "reimbursements_general",
              attributes: []
            }
          ],
          where: whereObj,
          group: ["sub_category.id"]
        });
      if (
        !isNullOrEmpty(accidentRemaining) ||
        !isNullOrEmpty(patientVisitRemaining)
      ) {
        var bindData = [];
        if (!isNullOrEmpty(accidentRemaining)) {
          const datas = JSON.parse(JSON.stringify(accidentRemaining[0]));
          if (datas.fundRemaining == null) {
            datas.fundRemaining = datas.fund;
          }
          if (datas.requestsRemaining == null) {
            datas.requestsRemaining = datas.perYears;
          }
          if (datas.perUsersRemaining == null) {
            datas.perUsersRemaining = datas.perUsers;
          }
          if (dynamicCheckRemaining(datas)) datas.canRequest = false;
          else datas.canRequest = true;
          bindData.push(datas);
        } else {
          const getFund = await subCategories.findOne({
            attributes: [
              [col("id"), "subCategoriesId"],
              [col("name"), "subCategoriesName"],
              [col("fund"), "fundRemaining"],
              [col("per_years"), "requestsRemaining"],
              [col("per_times"), "perTimesRemaining"],
              [col("per_users"), "perUsers"]
            ],
            where: { id: 1 }
          });
          const datas = JSON.parse(JSON.stringify(getFund));
          datas.canRequest = true;
          bindData.push(datas);
        }
        if (!isNullOrEmpty(patientVisitRemaining)) {
          const datas = JSON.parse(JSON.stringify(patientVisitRemaining[0]));
          if (datas.fundRemaining == null) {
            datas.fundRemaining = datas.fund;
          }
          if (datas.requestsRemaining == null) {
            datas.requestsRemaining = datas.perYears;
          }
          if (datas.perUsersRemaining == null) {
            datas.perUsersRemaining = datas.perUsers;
          }
          if (dynamicCheckRemaining(datas)) datas.canRequest = false;
          else datas.canRequest = true;
          whereObj = {};
          whereObj[Op.and] = [];
          var getFiscalYearWhere = getFiscalYear();
          whereObj[Op.and].push(
            { "$reimbursements_general.request_date$": getFiscalYearWhere },
            {
              "$reimbursements_general.categories_id$": category.medicalWelfare
            },
            {
              "$reimbursements_general.created_by$": req.query.createFor ?? id
            },
            { "$sub_category.id$": 2 },
            { "$reimbursements_general.status$": { [Op.eq]: status.approve } }
          );
          const getRequestData =
            await reimbursementsGeneralHasSubCategories.findAll({
              attributes: [
                [col("reimbursements_general.id"), "id"],
                [
                  col("reimbursements_general.fund_sum_request_patient_visit"),
                  "fundSumRequestPatientVisit"
                ],
                [col("reimbursements_general.start_date"), "startDate"],
                [col("reimbursements_general.end_date"), "endDate"]
              ],
              include: [
                {
                  model: subCategories,
                  as: "sub_category",
                  attributes: []
                },
                {
                  model: reimbursementsGeneral,
                  as: "reimbursements_general",
                  attributes: []
                }
              ],
              where: whereObj
            });
          datas.requestData = JSON.parse(JSON.stringify(getRequestData));
          bindData.push(datas);
        } else {
          const getFund = await subCategories.findOne({
            attributes: [
              [col("id"), "subCategoriesId"],
              [col("name"), "subCategoriesName"],
              [col("fund"), "fundRemaining"],
              [col("per_years"), "requestsRemaining"],
              [col("per_times"), "perTimesRemaining"],
              [col("per_users"), "perUsers"]
            ],
            where: { id: 2 }
          });
          const datas = JSON.parse(JSON.stringify(getFund));
          datas.canRequest = true;
          datas.requestData = null;
          bindData.push(datas);
        }
        logger.info("Complete", { method, data: { id } });
        return res.status(200).json({
          datas: bindData
        });
      }
      const getFund = await subCategories.findAll({
        attributes: [
          [col("id"), "subCategoriesId"],
          [col("name"), "subCategoriesName"],
          [col("fund"), "fundRemaining"],
          [col("per_years"), "requestsRemaining"],
          [col("per_times"), "perTimesRemaining"],
          [col("per_users"), "perUsers"]
        ],
        where: {
          id: {
            [Op.in]: [1, 2]
          }
        }
      });
      if (getFund) {
        const datas = JSON.parse(JSON.stringify(getFund));
        datas[0].canRequest = true;
        datas[1].canRequest = true;
        datas[1].requestData = null;
        logger.info("Complete", { method, data: { id } });
        return res.status(200).json({
          datas: datas
        });
      }
      logger.info("Data not Found", { method, data: { id } });
      res.status(200).json({
        message: "มีสิทธิ์คงเหลือเท่ากับเพดานเงิน"
      });
    } catch (error) {
      logger.error(`Error ${error.message}`, {
        method,
        data: { id }
      });
      next(error);
    }
  };
  getById = async (req, res, next) => {
    const method = "GetMedicalWelfarebyId";
    const { id } = req.user;
    const dataId = req.params["id"];
    try {
      const { filter } = req.query;
      var whereObj = { ...filter };
      const requestData = await reimbursementsGeneral.findOne({
        attributes: [
          "id",
          [col("reim_number"), "reimNumber"],
          [col("fund_receipt"), "fundReceipt"],
          [col("fund_eligible"), "fundEligible"],
          [col("fund_receipt_patient_visit"), "fundReceiptPatientVisit"],
          [col("fund_sum_request_patient_visit"), "fundSumRequestPatientVisit"],
          [col("start_date"), "startDate"],
          [col("end_date"), "endDate"],
          [col("fund_sum_request"), "fundSumRequest"],
          [col("fund_eligible_sum"), "fundEligibleSum"],
          [col("request_date"), "requestDate"],
          [col("status"), "status"],
          [col("file_receipt"), "fileReceipt"],
          [col("file_medical_certificate"), "fileMedicalCertificate"],
          [col("file_supervisor_letter"), "fileSupervisorLetter"],
          [col("file_receipt_patient_visit"), "fileReceiptPatientVisit"],
          [col("file_medical_certificate_patient_visit"), "fileMedicalCertificatePatientVisit"],
          [col("created_by_user.id"), "userId"],
          [col("created_by_user.name"), "name"],
          [col("created_by_user.position.name"), "position"],
          [col("created_by_user.employee_type.name"), "employeeType"],
          [col("created_by_user.sector.name"), "sector"],
          [col("created_by_user.department.name"), "department"]
        ],
        include: [
          {
            model: users,
            as: "created_by_user",
            attributes: [],
            include: [
              {
                model: positions,
                as: "position",
                attributes: []
              },
              {
                model: employeeTypes,
                as: "employee_type",
                attributes: []
              },
              {
                model: sector,
                as: "sector",
                attributes: []
              },
              {
                model: departments,
                as: "department",
                attributes: []
              }
            ]
          }
        ],
        where: whereObj
      });
      if (requestData) {
        const datas = JSON.parse(JSON.stringify(requestData));
        whereObj = {};
        whereObj[Op.and] = [];
        var getFiscalYearWhere;
        if (datas.requestDate) {
          getFiscalYearWhere = getFiscalYearDynamic(datas.requestDate);
        } else {
          getFiscalYearWhere = getFiscalYear();
        }
        whereObj[Op.and].push(
          { "$reimbursements_general.request_date$": getFiscalYearWhere },
          { "$reimbursements_general.categories_id$": category.medicalWelfare },
          { "$reimbursements_general.created_by$": datas.userId },
          { "$sub_category.id$": 2 },
          {
            [Op.or]: [
              {
                [Op.and]: [
                  { "$reimbursements_general.id$": { [Op.lte]: datas.id } },
                  { "$reimbursements_general.status$": status.approve }
                ]
              },
              {
                "$reimbursements_general.id$": datas.id
              }
            ]
          },
        );
        const getRequestData =
          await reimbursementsGeneralHasSubCategories.findAll({
            attributes: [
              [col("reimbursements_general.id"), "id"],
              [
                col("reimbursements_general.fund_sum_request_patient_visit"),
                "fundSumRequestPatientVisit"
              ],
              [col("reimbursements_general.start_date"), "startDate"],
              [col("reimbursements_general.end_date"), "endDate"]
            ],
            include: [
              {
                model: subCategories,
                as: "sub_category",
                attributes: []
              },
              {
                model: reimbursementsGeneral,
                as: "reimbursements_general",
                attributes: []
              }
            ],
            where: whereObj
          });
        var welfareData = {
          ...datas,
          user: {
            userId: datas.userId,
            name: datas.name,
            position: datas.position,
            employeeType: datas.employeeType,
            sector: datas.sector,
            department: datas.department
          },
          requestData: JSON.parse(JSON.stringify(getRequestData))
        };
        delete welfareData.userId;
        delete welfareData.name;
        delete welfareData.position;
        delete welfareData.employeeType;
        delete welfareData.sector;
        delete welfareData.department;
        logger.info("Complete", { method, data: { id } });
        res.status(200).json({
          datas: welfareData
        });
      } else {
        logger.info("Data not found", {
          method,
          data: { id, dataId }
        });
        res.status(404).json({
          message: `ไม่พบข้อมูล`
        });
      }
    } catch (error) {
      logger.error(`Error ${error.message}`, {
        method,
        data: { id }
      });
      next(error);
    }
  };
  create = async (req, res, next) => {
    const method = "CreateMedicalWelfare";
    const { id } = req.user;
    const selectedAccident = req.body.selected_accident ?? false;
    const selectedPatientVisit = req.body.selected_patient_visit ?? false;
    delete req.body.selected_accident;
    delete req.body.selected_patient_visit;
    const dataCreate = req.body;
    try {
      const result = await sequelize.transaction(async (t) => {
        const newItem = await reimbursementsGeneral.create(dataCreate, {
          transaction: t
        });
        var itemsReturned = {
          ...newItem.toJSON()
        };
        if (selectedAccident) {
          const newItemSub = await reimbursementsGeneralHasSubCategories.create(
            {
              reimbursements_general_id: newItem.id,
              sub_categories_id: 1
            },
            { transaction: t }
          );
          itemsReturned = {
            ...itemsReturned,
            newItemAccident: newItemSub
          };
        }
        if (selectedPatientVisit) {
          const newItemSub = await reimbursementsGeneralHasSubCategories.create(
            {
              reimbursements_general_id: newItem.id,
              sub_categories_id: 2
            },
            { transaction: t }
          );
          itemsReturned = {
            ...itemsReturned,
            newItemPatientVisit: newItemSub
          };
        }
        // if (selectedAccident || selectedPatientVisit) return itemsReturned;
        // return newItem;
        req.createdId = newItem.id
      });
      next();
      // res.status(201).json({ newItem: result, message: "บันทึกข้อมูลสำเร็จ" });
    } catch (error) {
      logger.error(`Error ${error.message}`, {
        method,
        data: { id }
      });
      next(error);
    }
  };
  update = async (req, res, next) => {
    const method = "UpdateMedicalWelfare";
    const { id } = req.user;
    const selectedAccident = req.body.selected_accident ?? false;
    const selectedPatientVisit = req.body.selected_patient_visit ?? false;
    delete req.body.selected_accident;
    delete req.body.selected_patient_visit;
    const dataUpdate = req.body;
    const dataId = req.params["id"];
    console.log(dataId, dataUpdate);
    var itemsReturned = null;
    try {
      const result = await sequelize.transaction(async (t) => {
        const [updated] = await reimbursementsGeneral.update(dataUpdate, {
          where: {
            id: dataId
          },
          transaction: t
        });
        if (dataUpdate.status === status.approve || dataUpdate.status === status.NotApproved) {
          return updated;
        }
        var checkingEdit = false;
        if (selectedAccident) {
          const existingAccident =
            await reimbursementsGeneralHasSubCategories.count({
              where: {
                reimbursements_general_id: dataId,
                sub_categories_id: 1
              },
              transaction: t
            });
          if (!existingAccident) {
            const newItemSub =
              await reimbursementsGeneralHasSubCategories.create(
                {
                  reimbursements_general_id: dataId,
                  sub_categories_id: 1
                },
                { transaction: t }
              );
            itemsReturned = {
              ...itemsReturned,
              newItemAccident: newItemSub
            };
            checkingEdit = true;
          }
        } else {
          const deleteItemSub =
            await reimbursementsGeneralHasSubCategories.destroy({
              where: {
                reimbursements_general_id: dataId,
                sub_categories_id: 1
              },
              transaction: t
            });
          if (deleteItemSub) {
            checkingEdit = true;
            itemsReturned = {
              ...itemsReturned,
              deleteItemAccident: deleteItemSub
            };
          }
        }
        if (selectedPatientVisit) {
          const existingPatientVisit =
            await reimbursementsGeneralHasSubCategories.count({
              where: {
                reimbursements_general_id: dataId,
                sub_categories_id: 2
              },
              transaction: t
            });
          if (!existingPatientVisit) {
            const newItemSub =
              await reimbursementsGeneralHasSubCategories.create(
                {
                  reimbursements_general_id: dataId,
                  sub_categories_id: 2
                },
                { transaction: t }
              );
            itemsReturned = {
              ...itemsReturned,
              newItemPatientVisit: newItemSub
            };
            checkingEdit = true;
          }
        } else {
          const deleteItemSub =
            await reimbursementsGeneralHasSubCategories.destroy({
              where: {
                reimbursements_general_id: dataId,
                sub_categories_id: 2
              },
              transaction: t
            });
          if (deleteItemSub) {
            checkingEdit = true;
            itemsReturned = {
              ...itemsReturned,
              deleteItemAccident: deleteItemSub
            };
          }
        }
        if (updated > 0 || checkingEdit) {
          itemsReturned = {
            ...updated,
            ...itemsReturned
          };
          return itemsReturned;
        } else {
          return null;
        }
      });
      if (result) {
        logger.info("Complete", { method, data: { id } });
        return res
          .status(201)
          .json({ updatedItem: { id: dataId }, newItem: result, message: "บันทึกข้อมูลสำเร็จ" });
      }
      res
        .status(400)
        .json({ updatedItem: { id: dataId }, newItem: result, message: "ไม่มีข้อมูลที่ถูกแก้ไข" });
    } catch (error) {
      logger.error(`Error ${error.message}`, {
        method,
        data: { id }
      });
      next(error);
    }
  };
  delete = async (req, res, next) => {
    const method = "DeletedMedicalWelfare";
    const { id } = req.user;
    const dataId = req.params["id"];
    try {
      const deletedSub = await reimbursementsGeneralHasSubCategories.destroy({
        where: { id: dataId }
      });

      const deleted = await reimbursementsGeneral.destroy({
        where: { id: dataId }
      });

      if (deletedSub && deleted) {
        const updatedItem = await reimbursementsGeneral.findByPk(dataId);
        logger.info("Completed", {
          method,
          data: { id, dataId }
        });
        res.status(201).json({ updatedItem: updatedItem, message: "สำเร็จ" });
      } else {
        logger.info("Data not found", {
          method,
          data: { id, dataId }
        });
        res.status(404).json({
          message: `ไม่พบข้อมูล`
        });
      }
    } catch (error) {
      logger.error(`Error ${error.message}`, {
        method,
        data: { id }
      });
      next(error);
    }
  };
}

module.exports = new Controller();
