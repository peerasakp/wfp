const { initLogger } = require('../../logger');
const logger = initLogger('ExportHealthFetchData');
const { Op, col } = require('sequelize');
const statusText = require('../../enum/statusText');
const category = require('../../enum/category');
const status = require('../../enum/status');
const { formatDateThaiSpace } = require('../../enum/formatDate');
const { reimbursementsGeneral, users, positions, categories, sector, employeeTypes, departments, subCategories, reimbursementsGeneralHasSubCategories, sequelize } = require('../../models/mariadb');
const { getFiscalYearDynamic, getFiscalYear } = require('../../middleware/utility');
const fetchDataHealthCheckup = async (req, res, next) => {
    const method = 'FetchHealthCheckupData';
    const { id } = req.user;
    const dataId = req.createdId;
    try {
        const requestData = await reimbursementsGeneral.findOne({
            attributes: [
                'id',
                [col("reim_number"), "reimNumber"],
                [col("fund_eligible"), "fundEligible"],
                [col("fund_sum_request"), "fundSumRequest"],
                [col("fund_decree"), "fundDecree"],
                [col("fund_university"), "fundUniversity"],
                [col("fund_eligible_name"), "fundEligibleName"],
                [col("fund_eligible_sum"), "fundEligibleSum"],
                [col("created_by_user.id"), "userId"],
                [col("created_by_user.name"), "name"],
                [col("created_by_user.position.id"), "positionId"],
                [col("created_by_user.position.name"), "position"],
                [col("created_by_user.employee_type.id"), "employeeTypeId"],
                [col("created_by_user.employee_type.name"), "employeeType"],
                [col("created_by_user.sector.name"), "sector"],
                [col("created_by_user.department.name"), "department"],
                [col("created_by_user.house_number"), "houseNumber"],
                [col("created_by_user.street"), "street"],
                [col("created_by_user.district"), "district"],
                [col("created_by_user.province"), "province"],
                [col("created_by_user.sub_district"), "subDistrict"],
                [col("created_by_user.postal_code"), "postalCode"],
                [col("category.id"), "categoryId"],
                [col("category.name"), "categoryName"],
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
                {
                    model: categories,
                    as: "category",
                    attributes: []
                }
            ],
            where: { id: dataId, status: statusText.waitApprove, categories_id: category.healthCheckup },
        });
        if (!requestData) {
            logger.info('Data not Found', { method, data: { id } });
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        const datas = JSON.parse(JSON.stringify(requestData));
        var welfareData = {
            ...datas,
            user: {
                employeeTypeId: datas.employeeTypeId,
                userId: datas.userId,
                name: datas.name,
                position: datas.position,
                employeeType: datas.employeeType,
                sector: datas.sector,
                department: datas.department,
                houseNumber: datas.houseNumber,
                subDistrict: datas.subDistrict,
                postalCode: datas.postalCode,
                street: datas.street,
                district: datas.district,
                province: datas.province

            },
            receiptInfo: [
                {
                    categoryName: datas.categoryName,
                    fundSumRequest: datas.fundSumRequest,
                },
            ],
            total: datas.fundSumRequest,
        }
        delete welfareData.categoryName;
        delete welfareData.userId;
        delete welfareData.name;
        delete welfareData.position;
        delete welfareData.employeeType;
        delete welfareData.sector;
        delete welfareData.department;
        delete welfareData.employeeTypeId;
        delete welfareData.houseNumber;
        delete welfareData.subDistrict;
        delete welfareData.postalCode;
        delete welfareData.street;
        delete welfareData.district;
        delete welfareData.province;
        req.body.datas = welfareData;
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, {
            method,
            data: { id },
        });
        next(error);
    }
};


const fetchDataMedical = async (req, res, next) => {
    const method = 'FetchMedicalData';
    const { id } = req.user;
    const dataId = req.createdId;
    try {
        const requestData = await reimbursementsGeneral.findOne({
            attributes: [
                'id',
                [col("reim_number"), "reimNumber"],
                [col("fund_receipt"), "fundReceipt"],
                [col("fund_eligible"), "fundEligible"],
                [col("fund_sum_request"), "fundSumRequest"],
                [col("fund_sum_request_patient_visit"), "fundSumRequestPatientVisit"],
                [col("start_date"), "startDate"],
                [col("end_date"), "endDate"],
                [col("request_date"), "requestDate"],
                [col("created_by_user.id"), "userId"],
                [col("created_by_user.name"), "name"],
                [col("created_by_user.position.id"), "positionId"],
                [col("created_by_user.position.name"), "position"],
                [col("created_by_user.employee_type.id"), "employeeTypeId"],
                [col("created_by_user.employee_type.name"), "employeeType"],
                [col("created_by_user.sector.name"), "sector"],
                [col("created_by_user.department.name"), "department"],
                [col("created_by_user.house_number"), "houseNumber"],
                [col("created_by_user.street"), "street"],
                [col("created_by_user.district"), "district"],
                [col("created_by_user.province"), "province"],
                [col("created_by_user.sub_district"), "subDistrict"],
                [col("created_by_user.postal_code"), "postalCode"],
                [col("category.id"), "categoryId"],
                [col("category.name"), "categoryName"],
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
                {
                    model: categories,
                    as: "category",
                    attributes: []
                }
            ],
            where: { id: dataId, status: statusText.waitApprove, categories_id: category.medicalWelfare },
        });
        if (!requestData) {
            logger.info('Data not Found', { method, data: { id } });
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        const datas = JSON.parse(JSON.stringify(requestData));
        var welfareData = {
            ...datas,
            user: {
                employeeTypeId: datas.employeeTypeId,
                userId: datas.userId,
                name: datas.name,
                position: datas.position,
                employeeType: datas.employeeType,
                sector: datas.sector,
                department: datas.department,
                houseNumber: datas.houseNumber,
                subDistrict: datas.subDistrict,
                postalCode: datas.postalCode,
                street: datas.street,
                district: datas.district,
                province: datas.province

            },
            receiptInfo: [],
            total: datas.fundSumRequest,
        }
        const hasAccident = await reimbursementsGeneralHasSubCategories.findOne({
            attributes: [
                [col("sub_category.name"), "subCategoryName"],
            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
            ],
            where: {
                [Op.and]: [{ reimbursements_general_id: dataId }, { sub_categories_id: 1 }],
            }
        });
        const hasPatientVisit = await reimbursementsGeneralHasSubCategories.findOne({
            attributes: [
                [col("sub_category.name"), "subCategoryName"],
            ],
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: []
                },
            ],
            where: {
                [Op.and]: [{ reimbursements_general_id: dataId }, { sub_categories_id: 2 }],
            }
        });
        if (!hasAccident && !hasPatientVisit) {
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        if (hasAccident) {
            const hasAccidentdatas = JSON.parse(JSON.stringify(hasAccident));
            welfareData.receiptInfo.push({
                categoryName: 'สวัสดิการกรณีเจ็บป่วย (' + hasAccidentdatas.subCategoryName + ')',
                fundSumRequest: welfareData.fundEligible,
            });
        }
        if (hasPatientVisit) {
            const hasPatientVisitdatas = JSON.parse(JSON.stringify(hasPatientVisit));
            welfareData.receiptInfo.push({
                categoryName: 'สวัสดิการกรณีเจ็บป่วย (' + hasPatientVisitdatas.subCategoryName + ')',
                fundSumRequest: welfareData.fundSumRequestPatientVisit,
            });
            var whereObj = {};
            whereObj[Op.and] = [];
            var getFiscalYearWhere;
            if (datas.requestDate) {
                getFiscalYearWhere = getFiscalYearDynamic(welfareData.requestDate);
            }
            else {
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
            const getRequestData = await reimbursementsGeneralHasSubCategories.findAll({
                attributes: [
                    [col("reimbursements_general.id"), "id"],
                    [col("reimbursements_general.fund_sum_request_patient_visit"), "fundSumRequestPatientVisit"],
                    [col("reimbursements_general.start_date"), "startDate"],
                    [col("reimbursements_general.end_date"), "endDate"],
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
            })
            const getRequestJsonData = JSON.parse(JSON.stringify(getRequestData));
            const getRequestFormat = getRequestJsonData.map(item => ({
                ...item,
                startDate: formatDateThaiSpace(item.startDate),
                endDate: formatDateThaiSpace(item.endDate),
            }));
            welfareData.requestData = getRequestFormat;
        }
        delete welfareData.categoryName;
        delete welfareData.userId;
        delete welfareData.name;
        delete welfareData.position;
        delete welfareData.employeeType;
        delete welfareData.sector;
        delete welfareData.department;
        delete welfareData.employeeTypeId;
        delete welfareData.houseNumber;
        delete welfareData.subDistrict;
        delete welfareData.postalCode;
        delete welfareData.street;
        delete welfareData.district;
        delete welfareData.province;
        req.body.datas = welfareData;
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, {
            method,
            data: { id },
        });
        next(error);
    }
};

const fetchDataDental = async (req, res, next) => {
    const method = 'FetchDentalData';
    const { id } = req.user;
    const dataId = req.createdId;
    try {
        const requestData = await reimbursementsGeneral.findOne({
            attributes: [
                'id',
                [col("reim_number"), "reimNumber"],
                [col("fund_sum_request"), "fundSumRequest"],
                [col("request_date"), "requestDate"],
                [col("created_by_user.id"), "userId"],
                [col("created_by_user.name"), "name"],
                [col("created_by_user.position.id"), "positionId"],
                [col("created_by_user.position.name"), "position"],
                [col("created_by_user.employee_type.id"), "employeeTypeId"],
                [col("created_by_user.employee_type.name"), "employeeType"],
                [col("created_by_user.sector.name"), "sector"],
                [col("created_by_user.department.name"), "department"],
                [col("created_by_user.house_number"), "houseNumber"],
                [col("created_by_user.street"), "street"],
                [col("created_by_user.district"), "district"],
                [col("created_by_user.province"), "province"],
                [col("created_by_user.sub_district"), "subDistrict"],
                [col("created_by_user.postal_code"), "postalCode"],
                [col("category.id"), "categoryId"],
                [col("category.name"), "categoryName"],
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
                {
                    model: categories,
                    as: "category",
                    attributes: []
                }
            ],
            where: { id: dataId, status: statusText.waitApprove, categories_id: category.dentalWelfare },
        });
        if (!requestData) {
            logger.info('Data not Found', { method, data: { id } });
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        const datas = JSON.parse(JSON.stringify(requestData));
        var welfareData = {
            ...datas,
            user: {
                employeeTypeId: datas.employeeTypeId,
                userId: datas.userId,
                name: datas.name,
                position: datas.position,
                employeeType: datas.employeeType,
                sector: datas.sector,
                department: datas.department,
                houseNumber: datas.houseNumber,
                subDistrict: datas.subDistrict,
                postalCode: datas.postalCode,
                street: datas.street,
                district: datas.district,
                province: datas.province

            },
            receiptInfo: [
                {
                    categoryName: datas.categoryName,
                    fundSumRequest: datas.fundSumRequest,
                },
            ],
            total: datas.fundSumRequest,
        }
        var whereObj = {};
        whereObj[Op.and] = [];
        var getFiscalYearWhere;
        if (datas.requestDate) {
            getFiscalYearWhere = getFiscalYearDynamic(datas.requestDate);
        }
        else {
            getFiscalYearWhere = getFiscalYear();
        }
        whereObj[Op.and].push(
            { "$reimbursementsGeneral.request_date$": getFiscalYearWhere },
            { "$reimbursementsGeneral.categories_id$": category.dentalWelfare },
            { "$reimbursementsGeneral.created_by$": datas.userId },
            {
                [Op.or]: [
                    {
                        [Op.and]: [
                            { "$reimbursementsGeneral.id$": { [Op.lte]: datas.id } },
                            { "$reimbursementsGeneral.status$": status.approve }
                        ]
                    },
                    {
                        "$reimbursementsGeneral.id$": datas.id
                    }
                ]
            }
        );
        const getRequestData = await reimbursementsGeneral.findAll({
            attributes: [
                'id',
                [col("date_receipt"), "dateReceipt"],
                [col("fund_sum_request"), "fundSumRequest"],
            ],
            where: whereObj,
        })
        const getRequestJsonData = JSON.parse(JSON.stringify(getRequestData));
        const getRequestFormat = getRequestJsonData.map(item => ({
            ...item,
            dateReceipt: formatDateThaiSpace(item.dateReceipt),
        }));
        welfareData.requestData = getRequestFormat;
        delete welfareData.categoryName;
        delete welfareData.userId;
        delete welfareData.name;
        delete welfareData.position;
        delete welfareData.employeeType;
        delete welfareData.sector;
        delete welfareData.department;
        delete welfareData.employeeTypeId;
        delete welfareData.houseNumber;
        delete welfareData.subDistrict;
        delete welfareData.postalCode;
        delete welfareData.street;
        delete welfareData.district;
        delete welfareData.province;
        req.body.datas = welfareData;
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, {
            method,
            data: { id },
        });
        next(error);
    }
};
module.exports = {
    fetchDataHealthCheckup,
    fetchDataMedical,
    fetchDataDental
};