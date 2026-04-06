const { initLogger } = require('../../logger');
const logger = initLogger('ExportChildrenEduCationFetchData');
const { Op, col } = require('sequelize');
const statusText = require('../../enum/statusText');
const category = require('../../enum/category');
const status = require('../../enum/status');
const { formatDateThaiSpace } = require('../../enum/formatDate');
const { reimbursementsChildrenEducation,reimbursementsChildrenEducationHasChildrenInfomation,childrenInfomation, users, positions, categories, sector, employeeTypes, departments, subCategories, sequelize } = require('../../models/mariadb');
const { getFiscalYearDynamic, getFiscalYear } = require('../../middleware/utility');

const fetchDatareimChildrenEducation = async (req, res, next) => {
    const method = 'FetchHealthCheckupData';
    const { id } = req.user;
    const dataId = req.createdId;
    try {
        const requestData = await reimbursementsChildrenEducation.findOne({
            attributes: [
                'id',
                [col("reim_number"), "reimNumber"],
                [col("fund_sum_request"), "fundSumRequest"],
                [col('marry_regis'), "marryRegis"],
                [col('fund_other'), "fundOther"],
                'eligible',
                'spouse',
                'status',
                'role',
                [col("position"), "positionSpouse"],
                [col("department"), "departmentSpouse"],
                [col('parental_status'), "parentalStatus"],
                [col('eligible_benefits'), "eligibleBenefits"],
                [col('eligible_sub_benefits'), "eligibleSubSenefits"],
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
                [col("created_by_user.first_working_date"), "firstWorkingDate"],
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
            where: { id: dataId, status: statusText.waitApprove},
        });
        const childrenData = await childrenInfomation.findAll({
            attributes: [
                'id',
                [col('childrenInfomation.fund_receipt'), "fundReceipt"],
                [col('childrenInfomation.fund_other'), "fundOther"],
                [col('childrenInfomation.fund_sum_request'), "fundSumRequest"],
                [col('childrenInfomation.child_name'), "childName"],
                [col('childrenInfomation.child_number'), "childNumber"],
                [col('childrenInfomation.child_type'), "childType"],
                [col('childrenInfomation.child_birth_day'), "childBirthDay"],
                [col('childrenInfomation.fund_university'), "fundUniversity"],
                [col('childrenInfomation.fund_sub_university'), "fundSubUniversity"],
                [col('childrenInfomation.child_father_number'), "childFatherNumber"],
                [col('childrenInfomation.child_mother_number'), "childMotherNumber"],
                [col('childrenInfomation.school_name'), "schoolName"],
                [col('childrenInfomation.school_type'), "schoolType"],
                [col('delegate_name'), "delegateName"],
                [col('delegate_number'), "delegateNumber"],
                [col('delegate_birth_day'), "delegateBirthDay"],
                [col('delegate_death_day'), "delegateDeathDay"],
                'district',
                'province',
                [col('sub_category.name'), "SubCategoryName"],
            ],
            where: {
                child_type: { [Op.ne]: 'DIED' }  // ไม่เอา child ที่มีค่า DIED
            },
            include: [
                {
                    model: subCategories,
                    as: "sub_category",
                    attributes: ['id', 'name']
                },
                {
                    model: reimbursementsChildrenEducationHasChildrenInfomation,
                    as: "reimbursements_children_education_has_children_infomations",
                    required: true,
                    attributes: [],
                    where: { reimbursements_children_education_id: dataId },
                    include: [
                        {
                            model: reimbursementsChildrenEducation,
                            as: "reimbursements_children_education",
                            required: true,
                            attributes: [],
                            where: {
                                created_by: id
                            }
                        }
                    ]
                }
            ],
        });
        if (!requestData) {
            logger.info('Data not Found', { method, data: { id } });
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        if (!childrenData || childrenData.length === 0) {
            logger.info('Children data not Found', { method, data: { id, dataId } });
            return res.status(200).json({
                message: "ไม่พบข้อมูล"
            });
        }
        const datas = JSON.parse(JSON.stringify(requestData));
        const child = childrenData.map(c => c.get({ plain: true })); 
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
                province: datas.province,
                firstWorkingDate: formatDateThaiSpace(datas.firstWorkingDate)

            },
            children: child.map(c => ({
                fundReceipt:c.fundReceipt,
                fundOther:c.fundOther,
                fundSumRequest:c.fundSumRequest,
                childName:c.childName,
                childNumber:c.childNumber,
                childType:c.childType,
                childBirthDay:formatDateThaiSpace(c.childBirthDay),
                fundUniversity:c.fundUniversity,
                fundSubUniversity:c.fundSubUniversity,
                childFatherNumber:c.childFatherNumber,
                childMotherNumber:c.childMotherNumber,
                schoolName:c.schoolName,
                schoolType:c.schoolType,
                delegateName:c.delegateName,
                delegateNumber:c.delegateNumber,
                delegateBirthDay:formatDateThaiSpace(c.delegateBirthDay),
                delegateDeathDay:formatDateThaiSpace(c.delegateDeathDay),
                district:c.district,
                province:c.province,
                SubCategoryName: c.SubCategoryName,
            })),
            receiptInfo: child.map(c => ({
                categoryName: c.childName,
                fundSumRequest: c.fundSumRequest,
            })),
            
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

module.exports = {
    fetchDatareimChildrenEducation,
};