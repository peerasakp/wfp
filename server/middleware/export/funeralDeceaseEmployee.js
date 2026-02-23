const { initLogger } = require('../../logger');
const logger = initLogger('ExportFuneralDeceaseEmployeeFetchData');
const { Op, col } = require('sequelize');
const statusText = require('../../enum/statusText');
const category = require('../../enum/category');
const { formatDateThaiSlash } = require('../../enum/formatDate');
const { reimbursementsEmployeeDeceased, users, positions, categories, sector, employeeTypes, departments, reimbursementsEmployeeDeceasedHasCategories, sequelize } = require('../../models/mariadb');
const { getFiscalYearDynamic, getFiscalYear } = require('../../middleware/utility');

const fetchDataFuneralDeceaseEmployee = async (req, res, next) => {
    const method = 'FetchFuneralDeceaseEmployeeData';
    const { id } = req.user;
    const dataId = req.createdId
    try {
        const requestData = await reimbursementsEmployeeDeceased.findOne({
            attributes: [
                'id',
                [col("reim_number"), "reimNumber"],
                [col("fund_receipt"), "fundReceipt"],
                [col("fund_sum_request"), "fundSumRequest"],
                [col("fund_sum_receipt"), "fundSumReceipt"],
                [col("fund_request"), "fundRequest"],
                [col("fund_wreath_university"), "fundWreathUniversity"],
                [col("fund_wreath_arrange"), "fundWreathArrange"],
                [col("fund_receipt_wreath"), "fundReceiptWreath"],
                [col("fund_receipt_vehicle"), "fundReceiptVehicle"],
                [col("fund_vehicle"), "fundVehicle"],
                [col("organizer"), "organizer"],
                [col("deceased"), "deceased"],
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
                [col("categories_id_categories.id"), "categoryId"],
                [col("categories_id_categories.name"), "categoryName"],
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
                    as: "categories_id_categories",
                    through: { model: reimbursementsEmployeeDeceasedHasCategories },
                    attributes: [],
                }
            ],
            where: { id: dataId, status: statusText.waitApprove },
        });

        if (!requestData) {
            logger.info('Data not Found', { method, data: { id } });
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        const datas = JSON.parse(JSON.stringify(requestData));
        // ค้นหาข้อมูลของผู้เสียชีวิตจาก users
        const deceasedUser = await users.findByPk(datas.deceased, {
            attributes: ['id', 'name'],
            include: [
                {
                    model: positions,
                    as: 'position',
                    attributes: ['name']
                },
                {
                    model: sector,
                    as: 'sector',
                    attributes: ['name']
                },
                {
                    model: departments,
                    as: 'department',
                    attributes: ['name']
                }
            ]
        });

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
            deceased: deceasedUser ? {
                id: deceasedUser.id,
                name: deceasedUser.name,
                position: deceasedUser.position,
                department: deceasedUser.department,
                sector: deceasedUser.sector
            } : null,
            receiptInfoSupport: [],
            receiptInfoFuneral: [],
            total: datas.fundSumRequest - datas.fundRequest,
        }
        const hasDeceased = await reimbursementsEmployeeDeceasedHasCategories.findOne({
            attributes: [
                [col("category.name"), "categoryName"],
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
            ],
            where: {
                [Op.and]: [{ reimbursements_employee_deceased_id: dataId }, { categories_id: 9 }],
            }
        });
        const hasWreathArrange = await reimbursementsEmployeeDeceasedHasCategories.findOne({
            attributes: [
                [col("category.name"), "categoryName"],
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
            ],
            where: {
                [Op.and]: [{ reimbursements_employee_deceased_id: dataId }, { categories_id: 10 }],
            }
        });
        const hasWreathUnversity = await reimbursementsEmployeeDeceasedHasCategories.findOne({
            attributes: [
                [col("category.name"), "categoryName"],
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
            ],
            where: {
                [Op.and]: [{ reimbursements_employee_deceased_id: dataId }, { categories_id: 11 }],
            }
        });
        const hasVehicle = await reimbursementsEmployeeDeceasedHasCategories.findOne({
            attributes: [
                [col("category.name"), "categoryName"],
            ],
            include: [
                {
                    model: categories,
                    as: "category",
                    attributes: []
                },
            ],
            where: {
                [Op.and]: [{ reimbursements_employee_deceased_id: dataId }, { categories_id: 12 }],
            }
        });

        if (!hasWreathArrange && !hasWreathUnversity && !hasVehicle && !hasDeceased) {
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        if (hasWreathArrange) {
            const hasWreathdatas = JSON.parse(JSON.stringify(hasWreathArrange));
            welfareData.receiptInfoSupport.push({
                categoryName: hasWreathdatas.categoryName,
                fundSumRequestSupport: welfareData.fundWreathArrange,
            });
        }
        if (hasWreathUnversity) {
            const hasWreathdatas = JSON.parse(JSON.stringify(hasWreathUnversity));
            welfareData.receiptInfoSupport.push({
                categoryName: hasWreathdatas.categoryName,
                fundSumRequestSupport: welfareData.fundWreathUniversity,
            });
        }
      
        if (hasVehicle) {
            const hasVehicledatas = JSON.parse(JSON.stringify(hasVehicle));
            welfareData.receiptInfoSupport.push({
                categoryName: hasVehicledatas.categoryName,
                fundSumRequestSupport: welfareData.fundVehicle,
            });
        }
        if (hasDeceased) {
            welfareData.receiptInfoFuneral.push({
                deceasedName: "สวัสดิการค่าสงเคราะห์การเสียชีวิตของ" + deceasedUser.name,
                fundRequest: welfareData.fundRequest,
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
    fetchDataFuneralDeceaseEmployee
};