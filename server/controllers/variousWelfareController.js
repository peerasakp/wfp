const BaseController = require('./BaseControllers');
const { reimbursementsAssist, categories, users, positions, sector, employeeTypes, departments, sequelize } = require('../models/mariadb');
const { Op, fn, col, literal } = require("sequelize");
const { initLogger } = require('../logger');
const logger = initLogger('variousWelfareController');
const { isNullOrEmpty } = require('./utility');

class Controller extends BaseController {
    constructor() {
        super(reimbursementsAssist);
    }

    list = async (req, res, next) => {
        const method = 'GetListVariousWelfare';
        const { id } = req.user;
        try {
            const { filter, page, itemPerPage } = req.query;
            var whereObj = { ...filter }
            const listData = await reimbursementsAssist.paginate({
                attributes: [
                    'id',
                    [col("reim_number"), "reimNumber"],
                    [col("request_date"), "requestDate"],
                    [col("updated_at"), "updatedAt"],
                    [col("fund_receipt"), "fundReceipt"],
                    [col("fund_eligible"), "fundEligible"],
                    [col("fund_sum_request"), "fundSumRequest"],
                    'status',
                ],
                page: page && !isNaN(page) ? Number(page) : 1,
                paginate: itemPerPage && !isNaN(itemPerPage) ? Number(itemPerPage) : 0,
                where: whereObj,
                order: [['updated_at', 'DESC'], ['created_at', 'DESC']]
            });

            if (listData) {
                var bindList = {};
                bindList.pagination = {
                    page: page && !isNaN(page) ? Number(page) : 1,
                    total: listData.total
                }
                bindList.datas = listData.docs.map((listObj) => {
                    const plainObj = listObj.toJSON();
                    return {
                        ...plainObj,
                    }
                });
                logger.info('Complete', { method, data: { id } });
                res.status(200).json(bindList);
            }
        }
        catch (error) {
            logger.error(`Error ${error.message}`, {
                method,
                data: { id },
            });
            next(error);
        }
    }
    getRemaining = async (req, res, next) => {
        const method = 'GetRemainingVariousWelfare';
        const { id } = req.user;
        try {
            const { filter } = req.query;
            var whereObj = { ...filter };

            whereObj[Op.and] = whereObj[Op.and] || [];
            whereObj[Op.and].push(
                { '$category.id$': { [Op.in]: [4, 5, 6, 7] } }
            );

            // ดึงข้อมูลจาก reimbursementsAssist
            const results = await reimbursementsAssist.findAll({
                attributes: [
                    [col("category.id"), "categoryId"],
                    [col("category.name"), "categoryName"],
                    [fn("SUM", col("reimbursementsAssist.fund_sum_request")), "totalSumRequested"],
                    [col("category.fund"), "fund"],
                    [
                        literal("category.fund - COALESCE(SUM(reimbursementsAssist.fund_sum_request), 0)"),
                        "fundRemaining"
                    ],
                    [fn("COUNT", col("reimbursementsAssist.fund_sum_request")), "totalCountRequested"],
                    [col("category.per_years"), "perYears"],
                    [
                        literal("category.per_years - COALESCE(COUNT(reimbursementsAssist.fund_sum_request), 0)"),
                        "requestsRemaining"
                    ],
                    [col("category.per_times"), "perTimesRemaining"],
                    [col("category.per_users"), "perUsers"],
                    [
                        literal("category.per_users - COALESCE(COUNT(reimbursementsAssist.fund_sum_request), 0)"),
                        "perUsersRemaining"
                    ]
                ],
                include: [
                    {
                        model: categories,
                        as: "category",
                        attributes: [],
                        required: false
                    }
                ],
                where: whereObj,
                group: ["category.id"]
            });

            let bindData = JSON.parse(JSON.stringify(results));

            // ดึงข้อมูลจาก categories
            const allCategories = await categories.findAll({
                attributes: [
                    [col("id"), "categoryId"],
                    [col("name"), "categoryName"],
                    [col("fund"), "fundRemaining"],
                    [col("per_years"), "requestsRemaining"],
                    [col("per_times"), "perTimesRemaining"],
                    [col("per_users"), "perUsersRemaining"]
                ],
                where: { id: [4, 5, 6, 7] }
            });
            const categoryData = JSON.parse(JSON.stringify(allCategories));
            // รวมข้อมูล categories กับ reimbursementsAssist
            const finalData = categoryData.map(cat => {
                let matched = bindData.find(item => item.categoryId === cat.categoryId);
                return {
                    categoryName: cat.categoryName,
                    categoryId: cat.categoryId,
                    totalSumRequested: matched ? matched.totalSumRequested : 0,
                    fund: cat.fundRemaining,
                    fundRemaining: matched ? matched.fundRemaining : cat.fundRemaining,
                    totalCountRequested: matched ? matched.totalCountRequested : 0,
                    perYears: cat.requestsRemaining,
                    requestsRemaining: matched ? matched.requestsRemaining : cat.requestsRemaining,
                    perTimesRemaining: cat.perTimesRemaining,
                    perUsersRemaining: matched ? matched.perUsersRemaining : cat.perUsersRemaining,
                    canRequest:
                        ((matched ? matched.fundRemaining : cat.fundRemaining) === null || (matched ? matched.fundRemaining : cat.fundRemaining) > 0) &&
                        ((matched ? matched.requestsRemaining : cat.requestsRemaining) === null || (matched ? matched.requestsRemaining : cat.requestsRemaining) > 0) &&
                        ((matched ? matched.perUsersRemaining : cat.perUsersRemaining) === null || (matched ? matched.perUsersRemaining : cat.perUsersRemaining) > 0)
                };
            });

            logger.info('Complete', { method, data: { id } });
            return res.status(200).json({
                datas: finalData
            });
        } catch (error) {
            logger.error(`Error ${error.message}`, {
                method,
                data: { id },
            });
            next(error);
        }
    };


    getById = async (req, res, next) => {
        const method = 'GetVariousWelfarebyId';
        const { id } = req.user;
        const dataId = req.params['id'];
        try {
            const requestData = await reimbursementsAssist.findByPk(dataId, {
                attributes: [
                    [col("reim_number"), "reimNumber"],
                    [col("fund_receipt"), "fundReceipt"],
                    [col("fund_sum_request"), "fundSumRequest"],
                    [col("fund_eligible"), "fundEligible"],
                    [col("request_date"), "requestDate"],
                    [col("status"), "status"],
                    [col("categories_id"), "categoryId"],
                    [col("file_receipt"), "fileReceipt"],
                    [col("file_document"), "fileDocument"],
                    [col("file_photo"), "filePhoto"],
                    [col("file_house_registration"), "fileHouseRegistration"],
                    [col("created_by_user.id"), "userId"],
                    [col("created_by_user.name"), "name"],
                    [col("created_by_user.position.name"), "position"],
                    [col("created_by_user.employee_type.name"), "employeeType"],
                    [col("created_by_user.sector.name"), "sector"],
                    [col("created_by_user.department.name"), "department"],
                ],
                include: [
                    {
                        model: users, as: 'created_by_user',
                        attributes: [],
                        include: [
                            {
                                model: positions, as: 'position',
                                attributes: ['name']
                            },
                            {
                                model: employeeTypes, as: 'employee_type',
                                attributes: ['name']
                            },
                            {
                                model: sector, as: 'sector',
                                attributes: ['name']
                            },
                            {
                                model: departments, as: 'department',
                                attributes: ['name']
                            },
                        ]
                    },
                ],
            });
            if (requestData) {
                const datas = JSON.parse(JSON.stringify(requestData));
                var welfareData = {
                    ...datas,
                    user: {
                        userId: datas.userId,
                        name: datas.name,
                        position: datas.position,
                        employeeType: datas.employeeType,
                        sector: datas.sector,
                        department: datas.department,
                    }
                }
                delete welfareData.userId;
                delete welfareData.name;
                delete welfareData.position;
                delete welfareData.employeeType;
                delete welfareData.sector;
                delete welfareData.department;
                logger.info('Complete', { method, data: { id } });
                res.status(200).json({
                    datas: welfareData,
                });
            } else {
                logger.info('Data not found', {
                    method,
                    data: { id, dataId },
                });
                res.status(404).json({
                    message: `ไม่พบข้อมูล`,
                });
            }
        }
        catch (error) {
            logger.error(`Error ${error.message}`, {
                method,
                data: { id },
            });
            next(error);
        }
    }

}

module.exports = new Controller();