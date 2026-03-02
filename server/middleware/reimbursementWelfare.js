const { isNullOrEmpty, checkValueMinus } = require('../controllers/utility');
const { initLogger } = require('../logger');
const logger = initLogger('ReimbursementWelfareValidator');
const { Op } = require('sequelize')
const permissionType = require('../enum/permission')
const statusText = require('../enum/statusText')
const { permissionsHasRoles } = require('../models/mariadb');

const authPermission = async (req, res, next) => {
    const method = 'AuthPermission';
    const { roleId } = req.user;
    try {
        const isAccess = await permissionsHasRoles.count({
            where: {
                [Op.and]: [{ roles_id: roleId }, { permissions_id: permissionType.welfareManagement }],
            },
        });
        if (!isAccess) {
            throw Error("You don't have access to this API");
        }
        next();
    }
    catch (error) {
        logger.error(`Error ${error.message}`, { method });
        res.status(401).json({ error: error.message });
    }
};

const bindFilter = async (req, res, next) => {
	const method = 'BindFilter';
	try {
        const { roleId } = req.user;
		const { keyword, welfareName, statusName, from, to } = req.query;
		req.query.filter = {};
		req.query.filter[Op.and] = [];
        
        if (!isNullOrEmpty(from) && !isNullOrEmpty(to)) {
            req.query.filter[Op.and].push({
                '$request_date$': { [Op.between]: [from, to] },
            });
        }
        if (!isNullOrEmpty(from) && isNullOrEmpty(to)) {
            req.query.filter[Op.and].push({
                '$request_date$': { [Op.eq]: from },
            });
        }

        // Check for 'keyword' and add to the filter if it's not empty
        if (!isNullOrEmpty(keyword)) {
            req.query.filter[Op.and].push({
				'$reim_number$': { [Op.like]: `%${keyword}%` },
			});    
        }
        
        // Check for 'welfareName' and add to the filter only if it's not empty
        if (!isNullOrEmpty(welfareName)) {
            req.query.filter[Op.and].push({
                '$welfare_type$': { [Op.eq]: welfareName } 
            });
        }

        if (!isNullOrEmpty(statusName)){
            req.query.filter[Op.and].push({
                '$status$': { [Op.eq]: statusName } 
            });
        }

        // Dean can only see pending final approval items
        if (roleId === 5) {
            req.query.filter[Op.and].push({
                '$status$': { [Op.eq]: statusText.waitFinalApprove }
            });
        }

		next();
	}
	catch (error) {
		logger.error(`Error ${error.message}`, { method });
		res.status(401).json({ error: error.message });
	}
};



module.exports = { authPermission, bindFilter };