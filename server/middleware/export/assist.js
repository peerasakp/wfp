const { initLogger } = require('../../logger');
const logger = initLogger('ExportAssistFetchData');
const { Op, col } = require('sequelize');
const statusText = require('../../enum/statusText');
const category = require('../../enum/category');
const { formatDateThaiSlash } = require('../../enum/formatDate');
const { reimbursementsAssist, users, positions, categories, sector, employeeTypes, departments, subCategories, reimbursementsAssistHasSubCategories, sequelize } = require('../../models/mariadb');
const { getFiscalYearDynamic, getFiscalYear } = require('../../middleware/utility');
const fetchDataVarious = async (req, res, next) => {
    const method = 'fetchDataVariousData';
    const { id } = req.user;
    const dataId = req.createdId ;
    try {
        const requestData = await reimbursementsAssist.findOne({
            attributes: [
                'id',
                [col("reim_number"), "reimNumber"],
                [col("fund_receipt"), "fundReceipt"],
                [col("fund_sum_request"), "fundSumRequest"],
                [col("fund_sum_receipt"), "fundSumReceipt"],
                [col("fund_eligible"), "fundEligible"],
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
            where: { id: dataId, status: statusText.waitApprove, categories_id: { [Op.in]: [4, 5, 6, 7] }},
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


const fetchDataFuneralFamily = async (req, res, next) => {
    const method = 'FetchFuneralFamilyData';
    const { id } = req.user;
    const dataId = req.createdId;
    try {
        const requestData = await reimbursementsAssist.findOne({
            attributes: [
                'id',
                [col("reim_number"), "reimNumber"],
                [col("fund_receipt"), "fundReceipt"],
                [col("fund_sum_request"), "fundSumRequest"],
                [col("fund_sum_receipt"), "fundSumReceipt"],
                [col("fund_decease"), "fundDecease"],
                [col("deceased_type"), "deceasedType"],
                [col("deceased"), "deceased"],
                [col("fund_wreath_university"), "fundWreathUniversity"],
                [col("fund_wreath_arrange"), "fundWreathArrange"],
                [col("fund_receipt_wreath"), "fundReceiptWreath"],
                [col("fund_receipt_vechicle"), "fundReceiptVechicle"],
                [col("fund_vechicle"), "fundVechicle"],
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
            where: { id: dataId, status: statusText.waitApprove, categories_id: category.variousFuneralFamily },
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
            receiptInfoSupport: [],
            total: datas.fundSumRequest ,
        }
        const hasDeceased = await reimbursementsAssistHasSubCategories.findOne({
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
                [Op.and]: [{ reimbursements_assist_id: dataId }, { sub_categories_id: { [Op.in]: [3, 4, 5, 6] } }],
            }
        });
        
        const hasWreathArrange = await reimbursementsAssistHasSubCategories.findOne({
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
                [Op.and]: [{ reimbursements_assist_id: dataId }, { sub_categories_id: 7 }],
            }
        });
        const hasWreathUnversity = await reimbursementsAssistHasSubCategories.findOne({
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
                [Op.and]: [{ reimbursements_assist_id: dataId }, { sub_categories_id: 8 }],
            }
        });
        const hasVechicle = await reimbursementsAssistHasSubCategories.findOne({
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
                [Op.and]: [{ reimbursements_assist_id: dataId }, { sub_categories_id: 9 }],
            }
        });
        if (!hasWreathArrange && !hasWreathUnversity && !hasVechicle && !hasDeceased) {
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        if (hasDeceased) {
            const hasDeceaseddatas = JSON.parse(JSON.stringify(hasDeceased));
            welfareData.receiptInfo.push({
                categoryName: "ค่าสงเคราะห์การเสียชีวิตของ" + hasDeceaseddatas.subCategoryName +"ของผู้ปฏิบัติงาน",
                fundSumRequest: welfareData.fundSumRequest,
            });
        }
        if (hasWreathArrange) {
            const hasWreathdatas = JSON.parse(JSON.stringify(hasWreathArrange));
            welfareData.receiptInfoSupport.push({
                categoryName: hasWreathdatas.subCategoryName,
                fundSumRequestSupport: welfareData.fundWreathArrange,
            });
        }
        if (hasWreathUnversity) {
            const hasWreathdatas = JSON.parse(JSON.stringify(hasWreathUnversity));
            welfareData.receiptInfoSupport.push({
                categoryName: hasWreathdatas.subCategoryName,
                fundSumRequestSupport: welfareData.fundWreathUniversity,
            });
        }
        if (hasVechicle) {
            const hasVechicledatas = JSON.parse(JSON.stringify(hasVechicle));
            welfareData.receiptInfoSupport.push({
                categoryName: hasVechicledatas.subCategoryName,
                fundSumRequestSupport: welfareData.fundVechicle,
            });
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
module.exports = {
    fetchDataVarious,
    fetchDataFuneralFamily
};