const BaseController = require('./BaseControllers');
const { reimbursementsEmployeeDeceased, categories, subCategories, reimbursementsEmployeeDeceasedHasCategories, users, positions, sector, employeeTypes, departments, sequelize } = require('../models/mariadb');
const { Op, fn, col, literal } = require("sequelize");
const { initLogger } = require('../logger');
const category = require('../enum/category');
const logger = initLogger('funeralWelfareEmployeeDeceasedController');
const { getFiscalYearDynamic, getFiscalYear } = require('../middleware/utility');
const { isNullOrEmpty } = require('./utility');
const status = require('../enum/status');
const { tryContinueSubmitDraftEsign } = require('../middleware/submitDraftWithEsign.middleware');

class Controller extends BaseController {
    constructor() {
        super(reimbursementsEmployeeDeceased);
    }

    list = async (req, res, next) => {
        const method = 'GetListFuneralWelfareEmployeeDeceased';
        const { id } = req.user;
        try {
            const { filter, page, itemPerPage } = req.query;
            var whereObj = { ...filter }
            const listData = await reimbursementsEmployeeDeceased.paginate({
                attributes: [
                    'id',
                    [col("reim_number"), "reimNumber"],
                    [col("request_date"), "requestDate"],
                    [col("updated_at"), "updatedAt"],
                    [col("fund_sum_receipt"), "fundSumReceipt"],
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
        const method = 'GetRemainingFuneralWelfareEmployeeDeceased';
        const { id } = req.user;
        try {
            const { filter } = req.query;
            var whereObj = { ...filter }
            if (!whereObj[Op.and]) {
                whereObj[Op.and] = [];
            }
            whereObj[Op.and].push(
                { '$category.id$': 9 }
            );
            const decreaseRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
                attributes: [
                    [col("category.id"), "categoriesId"],
                    [col("category.name"), "categoriesName"],
                    [fn("SUM", col("reimbursements_employee_deceased.fund_request")), "totalSumRequested"],
                    [col("category.fund"), "fund"],
                    [
                        literal("category.fund - SUM(reimbursements_employee_deceased.fund_request)"),
                        "fundRemaining"
                    ],
                    [fn("COUNT", col("reimbursements_employee_deceased.fund_request")), "totalCountRequested"],
                    [col("category.per_years"), "perYears"],
                    [
                        literal("category.per_years - COUNT(reimbursements_employee_deceased.fund_request)"),
                        "requestsRemaining"
                    ],
                    [col("category.per_times"), "perTimesRemaining"],
                    [col("category.per_users"), "perUsers"],
                    [
                        literal("category.per_users - COUNT(reimbursements_employee_deceased.fund_request)"),
                        "perUsersRemaining"
                    ]
                ],
                include: [
                    {
                        model: categories,
                        as: "category",
                        attributes: []
                    },
                    {
                        model: reimbursementsEmployeeDeceased,
                        as: "reimbursements_employee_deceased",
                        attributes: [],
                        include: [
                            {
                                model: users,
                                as: 'created_by_user',
                                attributes: ['id', 'name'],
                            },
                        ]
                    },
                ],
                where: whereObj,
                group: ["category.id"],
            });

            whereObj[Op.and].push({ '$category.id$': { [Op.in]: [10, 11] } });

            const wreathRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
                attributes: [
                    [col("category.id"), "categoriesId"],
                    [col("category.name"), "categoriesName"],
                    [col("category.fund"), "fund"],
                    [col("category.per_years"), "perYears"],
                    [col("category.per_times"), "perTimesRemaining"],
                    [col("category.per_users"), "perUsers"],
                    // fund_wreath_arrange
                    [
                        fn("SUM", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE 0 END")),
                        "totalSumRequestedArrange"
                    ],
                    [
                        fn("SUM", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE 0 END")),
                        "fundRemainingArrange"
                    ],
                    [
                        fn("COUNT", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END")),
                        "totalCountRequestedArrange"
                    ],
                    [
                        fn("category.per_years - COUNT", literal("CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END")),
                        "requestsRemainingArrange"
                    ],
                    [
                        literal("category.per_users - COUNT(CASE WHEN category.id = 10 THEN reimbursements_employee_deceased.fund_wreath_arrange ELSE NULL END)"),
                        "perUsersRemainingArrange"
                    ],
                    // fund_wreath_university
                    [
                        fn("SUM", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE 0 END")),
                        "totalSumRequestedUniversity"
                    ],
                    [
                        fn("SUM", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE 0 END")),
                        "fundRemainingUniversity"
                    ],
                    [
                        fn("COUNT", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END")),
                        "totalCountRequestedUniversity"
                    ],
                    [
                        fn("category.per_years - COUNT", literal("CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END")),
                        "requestsRemainingUniversity"
                    ],
                    [
                        literal("category.per_users - COUNT(CASE WHEN category.id = 11 THEN reimbursements_employee_deceased.fund_wreath_university ELSE NULL END)"),
                        "perUsersRemainingUniversity"
                    ],
                ],
                include: [
                    {
                        model: categories,
                        as: "category",
                        attributes: []
                    },
                    {
                        model: reimbursementsEmployeeDeceased,
                        as: "reimbursements_employee_deceased",
                        attributes: [],
                        include: [
                            {
                                model: users,
                                as: 'created_by_user',
                                attributes: ['id', 'name'],
                            },
                        ]
                    },
                ],
                where: whereObj,
                group: ["category.id"],
            });

            whereObj[Op.and] = whereObj[Op.and].filter(item => [10, 11].includes(item['$category.id$']));
            whereObj[Op.and].push({ '$category.id$': 12 });

            const vehicleRemaining = await reimbursementsEmployeeDeceasedHasCategories.findAll({
                attributes: [
                    [col("category.id"), "categoriesId"],
                    [col("category.name"), "categoriesName"],
                    [fn("SUM", col("reimbursements_employee_deceased.fund_vehicle")), "totalSumRequested"],
                    [col("category.fund"), "fund"],
                    [
                        literal("category.fund - SUM(reimbursements_employee_deceased.fund_vehicle)"),
                        "fundRemaining"
                    ],
                    [fn("COUNT", col("reimbursements_employee_deceased.fund_vehicle")), "totalCountRequested"],
                    [col("category.per_years"), "perYears"],
                    [
                        literal("category.per_years - COUNT(reimbursements_employee_deceased.fund_vehicle)"),
                        "requestsRemaining"
                    ],
                    [col("category.per_times"), "perTimesRemaining"],
                    [col("category.per_users"), "perUsers"],
                    [
                        literal("category.per_users - COUNT(reimbursements_employee_deceased.fund_vehicle)"),
                        "perUsersRemaining"
                    ]
                ],
                include: [
                    {
                        model: categories,
                        as: "category",
                        attributes: []
                    },
                    {
                        model: reimbursementsEmployeeDeceased,
                        as: "reimbursements_employee_deceased",
                        attributes: [],
                        include: [
                            {
                                model: users,
                                as: 'created_by_user',
                                attributes: ['id', 'name'],
                            },
                        ]
                    },
                ],
                where: whereObj,
                group: ["category.id"],
            });

            if (!isNullOrEmpty(decreaseRemaining) || !isNullOrEmpty(wreathRemaining) || !isNullOrEmpty(vehicleRemaining)) {
                let bindData = [];
                // Decrease Remaining Data
                if (!isNullOrEmpty(decreaseRemaining)) {
                    const datas = JSON.parse(JSON.stringify(decreaseRemaining[0]));
                    bindData.push({
                        categoriesId: datas.categoriesId,
                        categoriesName: datas.categoriesName,
                        fundRemaining: datas.fundRemaining,
                        requestsRemaining: datas.requestsRemaining,
                        perTimesRemaining: datas.perTimesRemaining,
                        canRequest: false
                    });
                } else {
                    const getFund = await categories.findAll({
                        attributes: [
                            [col("id"), "categoriesId"],
                            [col("name"), "categoriesName"],
                            [col("fund"), "fundRemaining"],
                            [col("per_years"), "requestsRemaining"],
                            [col("per_times"), "perTimesRemaining"],
                            [col("per_users"), "perUsersRemaining"]
                        ],
                        where: { id: 9 }
                    });
                    const datas = JSON.parse(JSON.stringify(getFund));
                    datas.forEach(item => {
                        bindData.push({
                            categoriesId: item.categoriesId,
                            categoriesName: item.categoriesName,
                            fundRemaining: item.fundRemaining,
                            requestsRemaining: item.requestsRemaining,
                            perTimesRemaining: item.perTimesRemaining,
                            canRequest: true
                        });
                    });
                }

                // Wreath Remaining Data
                if (!isNullOrEmpty(wreathRemaining)) {
                    const datas = JSON.parse(JSON.stringify(wreathRemaining[0]));
                    bindData.push({
                        categoriesId: datas.categoriesId,
                        categoriesName: datas.categoriesName,
                        fundRemaining: datas.fundRemaining,
                        requestsRemaining: datas.requestsRemaining,
                        perTimesRemaining: datas.perTimesRemaining,
                        canRequest: isNullOrEmpty(decreaseRemaining) ? true : false
                    });
                } else {
                    const getFund = await categories.findAll({
                        attributes: [
                            [col("id"), "categoriesId"],
                            [col("name"), "categoriesName"],
                            [col("fund"), "fundRemaining"],
                            [col("per_years"), "requestsRemaining"],
                            [col("per_times"), "perTimesRemaining"],
                            [col("per_users"), "perUsers"]
                        ],
                        where: { id: [10, 11] }
                    });
                    const datas = JSON.parse(JSON.stringify(getFund));
                    datas.forEach(item => {
                        bindData.push({
                            categoriesId: item.categoriesId,
                            categoriesName: item.categoriesName,
                            fundRemaining: item.fundRemaining,
                            requestsRemaining: item.requestsRemaining,
                            perTimesRemaining: item.perTimesRemaining,
                            canRequest: isNullOrEmpty(decreaseRemaining) ? true : false
                        });
                    });
                }

                // Vehicle Remaining Data
                if (!isNullOrEmpty(vehicleRemaining)) {
                    const datas = JSON.parse(JSON.stringify(vehicleRemaining[0]));
                    bindData.push({
                        categoriesId: datas.categoriesId,
                        categoriesName: datas.categoriesName,
                        fundRemaining: datas.fundRemaining,
                        requestsRemaining: datas.requestsRemaining,
                        perTimesRemaining: datas.perTimesRemaining,
                        canRequest: isNullOrEmpty(decreaseRemaining) ? true : false
                    });
                } else {
                    const getFund = await categories.findAll({
                        attributes: [
                            [col("id"), "categoriesId"],
                            [col("name"), "categoriesName"],
                            [col("fund"), "fundRemaining"],
                            [col("per_years"), "requestsRemaining"],
                            [col("per_times"), "perTimesRemaining"],
                            [col("per_users"), "perUsers"]
                        ],
                        where: { id: 12 }
                    });
                    const datas = JSON.parse(JSON.stringify(getFund));
                    datas.forEach(item => {
                        bindData.push({
                            categoriesId: item.categoriesId,
                            categoriesName: item.categoriesName,
                            fundRemaining: item.fundRemaining,
                            requestsRemaining: item.requestsRemaining,
                            perTimesRemaining: item.perTimesRemaining,
                            canRequest: isNullOrEmpty(decreaseRemaining) ? true : false
                        });
                    });
                }

                logger.info('Complete', { method, data: { id } });
                return res.status(200).json({
                    datas: bindData,
                });
            }

            const getFund = await categories.findAll({
                attributes: [
                    [col("id"), "categoriesId"],
                    [col("name"), "categoriesName"],
                    [col("fund"), "fundRemaining"],
                    [col("per_years"), "requestsRemaining"],
                    [col("per_times"), "perTimesRemaining"],
                    [col("per_users"), "perUsers"]
                ],
                where: {
                    id: {
                        [Op.in]: [9, 10, 11, 12]
                    }
                }
            });

            if (getFund) {
                const datas = JSON.parse(JSON.stringify(getFund));

                for (let i = 0; i < datas.length; i++) {
                    if (datas[i].deceased !== undefined && datas[i].deceased !== null) {
                        const deceasedData = await reimbursementsEmployeeDeceased.findOne({
                            where: {
                                category_id: datas[i].categoriesId,
                            }
                        });
                        if (deceasedData) {
                            datas[i].canRequest = false;
                        } else {
                            datas[i].canRequest = true;
                        }
                    } else {
                        datas[i].canRequest = true;
                    }
                }


                return res.status(200).json({
                    datas: datas.map(item => ({
                        categoriesId: item.categoriesId,
                        categoriesName: item.categoriesName,
                        fundRemaining: item.fundRemaining,
                        requestsRemaining: item.requestsRemaining,
                        perTimesRemaining: item.perTimesRemaining,
                        canRequest: item.canRequest,
                    })),
                    canRequest: datas[0]?.canRequest ?? true,
                });
            }
            logger.info('Data not Found', { method, data: { id } });
            res.status(200).json({
                message: "มีสิทธิ์คงเหลือเท่ากับเพดานเงิน"
            });
        }
        catch (error) {
            logger.error(`Error ${error.message}`, {
                method,
                data: { id },
            });
            next(error);
        }
    };


    getById = async (req, res, next) => {
        const method = 'GetFuneralWelfareEmployeeDeceasedbyId';
        const { id } = req.user;
        const dataId = req.params['id'];
        try {
            logger.info('Received dataId:', dataId);
            const { filter } = req.query;
            var whereObj = { ...filter }
            logger.info('Where Object:', whereObj);
            const requestData = await reimbursementsEmployeeDeceased.findByPk(dataId, {
                attributes: [
                    [col("reim_number"), "reimNumber"],
                    [col("fund_receipt"), "fundReceipt"],
                    [col("fund_request"), "fundRequest"],
                    [col("deceased"), "deceased"],
                    [col("organizer"), "organizer"],
                    [col("fund_receipt_wreath"), "fundReceiptWreath"],
                    [col("fund_wreath_university"), "fundWreathUniversity"],
                    [col("fund_wreath_arrange"), "fundWreathArrange"],
                    [col("fund_receipt_vehicle"), "fundReceiptVehicle"],
                    [col("fund_vehicle"), "fundVehicle"],
                    [col("fund_sum_receipt"), "fundSumReceipt"],
                    [col("fund_sum_request"), "fundSumRequest"],
                    [col("request_date"), "requestDate"],
                    [col("status"), "status"],
                    [col("file_receipt"), "fileReceipt"],
                    [col("file_id_card"), "fileIdCard"],
                    [col("file_death_certificate"), "fileDeathCertificate"],
                    [col("file_wreath_receipt"), "fileWreathReceipt"],
                    [col("file_wreath_document"), "fileWreathDocument"],
                    [col("file_vehicle_receipt"), "fileVehicleReceipt"],
                    [col("file_vehicle_document"), "fileVehicleDocument"],
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
                                attributes: []
                            },
                            {
                                model: employeeTypes, as: 'employee_type',
                                attributes: []
                            },
                            {
                                model: sector, as: 'sector',
                                attributes: []
                            },
                            {
                                model: departments, as: 'department',
                                attributes: []
                            },
                        ]
                    },
                ],
            });
            if (requestData) {
                const datas = JSON.parse(JSON.stringify(requestData));
                logger.info("Data found:", datas);
                whereObj = {};
                whereObj[Op.and] = [];
                var getFiscalYearWhere;
                if (datas.requestDate) {
                    getFiscalYearWhere = getFiscalYearDynamic(datas.requestDate);
                }
                else {
                    getFiscalYearWhere = getFiscalYear();
                }
                whereObj[Op.and].push(
                    { '$reimbursements_employee_deceased.request_date$': getFiscalYearWhere },
                    { '$reimbursements_employee_deceased.created_by$': datas.userId },
                    { '$reimbursements_employee_deceased.id$': { [Op.lte]: datas.id } },
                    { '$category.id$': { [Op.in]: [9, 10, 11, 12] } },
                );
                var welfareData = {
                    ...datas,
                    user: {
                        userId: datas.userId,
                        name: datas.name,
                        position: datas.position,
                        employeeType: datas.employeeType,
                        sector: datas.sector,
                        department: datas.department,
                    },
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
    create = async (req, res, next) => {
        const method = 'CreateFuneralWelfareEmployeeDeceased';
        const { id } = req.user;
        const selectedWreath = req.body.selected_wreath ?? false;
        const selectedVehicle = req.body.selected_vehicle ?? false;
        const deceased = req.body.deceased ?? null;
        delete req.body.selected_wreath;
        delete req.body.selected_vehicle;
        const dataCreate = req.body;

        try {
            const result = await sequelize.transaction(async t => {
                const newItem = await reimbursementsEmployeeDeceased.create(dataCreate, { transaction: t, });
                var itemsReturned = {
                    ...newItem.toJSON(),
                };
                if (selectedWreath) {
                    const newItemSub1 = await reimbursementsEmployeeDeceasedHasCategories.create(
                        {
                            reimbursements_employee_deceased_id: newItem.id,
                            categories_id: 10,
                        },
                        { transaction: t }
                    );
                    const newItemSub2 = await reimbursementsEmployeeDeceasedHasCategories.create(
                        {
                            reimbursements_employee_deceased_id: newItem.id,
                            categories_id: 11,
                        },
                        { transaction: t }
                    );
                    itemsReturned = {
                        ...itemsReturned,
                        newItemWreath1: newItemSub1,
                        newItemWreath2: newItemSub2,
                    };
                }
                if (selectedVehicle) {
                    const newItemSub = await reimbursementsEmployeeDeceasedHasCategories.create(
                        {
                            reimbursements_employee_deceased_id: newItem.id,
                            categories_id: 12,
                        },
                        { transaction: t, });
                    itemsReturned = {
                        ...itemsReturned,
                        newItemVehicle: newItemSub,
                    }
                }

                if (deceased) {
                    const newItemSub = await reimbursementsEmployeeDeceasedHasCategories.create(
                        {
                            reimbursements_employee_deceased_id: newItem.id,
                            categories_id: 9,
                        },
                        { transaction: t }
                    );
                    itemsReturned = {
                        ...itemsReturned,
                        newItemDecease: newItemSub,
                    };
                }
                req.createdId = newItem.id;
                // if (selectedWreath || selectedVehicle || deceased) {
                //     return itemsReturned;
                // }
                // return newItem;
            });
            // res.status(201).json({ newItem: result, message: "บันทึกข้อมูลสำเร็จ" });
            next();
        }
        catch (error) {

            logger.error(`Error ${error.message}`, {
                method,
                data: { id },
            });
            next(error);
        }
    }
    update = async (req, res, next) => {
        const method = 'UpdateFuneralWelfareEmployeeDeceased';
        const { id } = req.user;
        const selectedWreath = req.body.selected_wreath ?? false;
        const selectedVehicle = req.body.selected_vehicle ?? false;
        const deceased = req.body.deceased ?? null;
        delete req.body.selected_wreath;
        delete req.body.selected_vehicle;
        const dataUpdate = req.body;
        const dataId = req.params['id'];

        try {
            const result = await sequelize.transaction(async t => {
                const [updated] = await reimbursementsEmployeeDeceased.update(dataUpdate, {
                    where: { id: dataId },
                    transaction: t,
                });
                if (dataUpdate.status === status.approve || dataUpdate.status === status.NotApproved) {
                    return updated;
                }
                let itemsReturned = { updated };

                // Handle selected wreath
                if (selectedWreath) {
                    const existingWreath = await reimbursementsEmployeeDeceasedHasCategories.count({
                        where: { reimbursements_employee_deceased_id: dataId, categories_id: { [Op.in]: [10, 11] } },
                        transaction: t,
                    });

                    if (!existingWreath) {
                        const newWreathItems = await reimbursementsEmployeeDeceasedHasCategories.bulkCreate([
                            { reimbursements_employee_deceased_id: dataId, categories_id: 10 },
                            { reimbursements_employee_deceased_id: dataId, categories_id: 11 }
                        ], { transaction: t });
                        itemsReturned.newItemWreath = newWreathItems;
                    }
                } else {
                    const deletedWreath = await reimbursementsEmployeeDeceasedHasCategories.destroy({
                        where: { reimbursements_employee_deceased_id: dataId, categories_id: { [Op.in]: [10, 11] } },
                        transaction: t,
                    });
                    if (deletedWreath) itemsReturned.deleteItemWreath = deletedWreath;
                }

                // Handle selected vehicle
                if (selectedVehicle) {
                    const existingVehicle = await reimbursementsEmployeeDeceasedHasCategories.count({
                        where: { reimbursements_employee_deceased_id: dataId, categories_id: 12 },
                        transaction: t,
                    });

                    if (!existingVehicle) {
                        const newVehicleItem = await reimbursementsEmployeeDeceasedHasCategories.create({
                            reimbursements_employee_deceased_id: dataId,
                            categories_id: 12,
                        }, { transaction: t });
                        itemsReturned.newItemVehicle = newVehicleItem;
                    }
                } else {
                    const deletedVehicle = await reimbursementsEmployeeDeceasedHasCategories.destroy({
                        where: { reimbursements_employee_deceased_id: dataId, categories_id: 12 },
                        transaction: t,
                    });
                    if (deletedVehicle) itemsReturned.deleteItemVehicle = deletedVehicle;
                }

                // Handle deceased
                if (deceased) {
                    const existingDeceased = await reimbursementsEmployeeDeceasedHasCategories.count({
                        where: { reimbursements_employee_deceased_id: dataId, categories_id: 9 },
                        transaction: t,
                    });

                    if (!existingDeceased) {
                        const newDeceasedItem = await reimbursementsEmployeeDeceasedHasCategories.create({
                            reimbursements_employee_deceased_id: dataId,
                            categories_id: 9,
                        }, { transaction: t });
                        itemsReturned.newItemDeceased = newDeceasedItem;
                    }
                } else {
                    const deletedDeceased = await reimbursementsEmployeeDeceasedHasCategories.destroy({
                        where: { reimbursements_employee_deceased_id: dataId, categories_id: 9 },
                        transaction: t,
                    });
                    if (deletedDeceased) itemsReturned.deleteItemDeceased = deletedDeceased;
                }

                return updated > 0 ? itemsReturned : null;
            });

            if (result) {
                logger.info('Complete', { method, data: { id } });
                if (tryContinueSubmitDraftEsign(req, res, next, { dataId, dataUpdate })) {
                    return;
                }
                return res.status(200).json({ updatedItem: { id: dataId }, newItem: result, message: "อัปเดตข้อมูลสำเร็จ" });
            } else {
                res.status(400).json({ updatedItem: { id: dataId }, message: "ไม่มีข้อมูลที่ถูกแก้ไข" });
            }
        } catch (error) {
            logger.error(`Error ${error.message}`, { method, data: { id } });
            next(error);
        }
    };

    delete = async (req, res, next) => {
        const method = 'DeletedFuneralWelfareEmployeeDeceased';
        const { id } = req.user;
        const dataId = req.params['id'];
        try {
            const deletedSub = await reimbursementsEmployeeDeceasedHasCategories.destroy({
                where: { reimbursements_employee_deceased_id: dataId },
            });

            const deleted = await reimbursementsEmployeeDeceased.destroy({
                where: { id: dataId },
            });

            if (deletedSub && deleted) {
                const updatedItem = await reimbursementsEmployeeDeceased.findByPk(dataId);
                logger.info('Completed', {
                    method,
                    data: { id, dataId },
                });
                res.status(201).json({ updatedItem: updatedItem, message: "สำเร็จ" });
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