const { isNullOrEmpty, checkValueMinus } = require('../controllers/utility');
const { initLogger } = require('../logger');
const logger = initLogger('ConfigWelfareValidator');
const { Op } = require('sequelize')
const permissionType = require('../enum/permission')
const { permissionsHasRoles } = require('../models/mariadb');
const role = require('../enum/role');


const bindFilter = async (req, res, next) => {
	const method = 'BindFilter';
	try {
		const { configWelfare } = req.query;
		req.query.filter = {};
		req.query.filter[Op.and] = [];
		if (!isNullOrEmpty(configWelfare)) {
			req.query.filter[Op.and].push({
				'$welfare_id$': { [Op.like]: `%${configWelfare}%` },
			});
		}
		next();
	}
	catch (error) {
		logger.error(`Error ${error.message}`, { method });
		res.status(401).json({ message: error.message });
	}
};

const bindUpdate = async (req, res, next) => {
	try {
		const {fund, perYears, perTimes, perUsers} = req.body;
		const errorObj = {};

		if(fund < 0){
			errorObj['fund'] = 'ข้อมูลไม่ถูกต้อง';
		}
		if(perYears == 0){
			perYears = null;
		}
		if(perTimes == 0){
			perTimes = null;
		}
		if(checkValueMinus(perTimes)){
			errorObj['perTimes'] = 'ข้อมูลไม่ถูกต้อง';
		}
		if(checkValueMinus(perYears)){
			errorObj['perYears'] = 'ข้อมูลไม่ถูกต้อง';
		}
		if (Object.keys(errorObj).length > 0){
			return res.status(400).json({
				message: 'ข้อมูลไม่ถูกต้อง',
				errors: errorObj,
			  }); 
		}
		const dataBinding = {
			fund: fund,
			per_years: perYears,
			per_users: perUsers,
			per_times: perTimes,
		}
		req.body = dataBinding;
		next();
	} catch (error) {
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
}

const authPermission = async (req, res, next) => {
	const method = 'AuthPermission';
	const { roleId } = req.user;
	if (roleId === 4) {
		return next();
	}
	try {
		const isAccess = await permissionsHasRoles.count({
			where: {
				[Op.and]: [{ roles_id: roleId }, { permissions_id: permissionType.configWelfare }],
			},
		});
		if (!isAccess) {
			throw Error("You don't have access to this API");
		}
		next();
	}
	catch (error) {
		logger.error(`Error ${error.message}`, { method });
		res.status(401).json({ message: error.message });
	}
};

module.exports = { bindFilter, bindUpdate, authPermission };