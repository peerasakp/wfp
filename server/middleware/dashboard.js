const { initLogger } = require('../logger');
const logger = initLogger('DashboardValidator');
const { Op } = require('sequelize')
const permissionType = require('../enum/permission');
const { permissionsHasRoles } = require('../models/mariadb');
const role = require('../enum/role');
const { getFiscalYear, betweenFiscalByYear } = require('../middleware/utility');

const authPermission = async (req, res, next) => {
	const method = 'AuthPermission';
	const { roleId } = req.user;
	if (roleId === 4) {
		return next();
	}
	try {
		const isAccess = await permissionsHasRoles.count({
			where: {
				[Op.and]: [
					{ roles_id: roleId }, 
					{ permissions_id: permissionType.report},
				],
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

const bindGetDataDashboard = async (req, res, next) => {
    const method = 'BindGetDataDashboard';

    try {
        const { startYear, endYear } = req.query;
        const fiscalStartYear = startYear || '2022-10-01';
        const fiscalEndYear = endYear || '2025-09-30';

        req.query.filter = {};
        req.query.filter[Op.and] = [];
        const getFiscalYearWhere  = betweenFiscalByYear(fiscalStartYear, fiscalEndYear);

        req.query.filter[Op.and].push(
            { '$viewDashboard.updated_at$': getFiscalYearWhere  }
        );

        logger.info(`Fiscal year filter applied: ${fiscalStartYear} to ${fiscalEndYear}`, { method });
        next();
    } catch (error) {
        logger.error(`Error: ${error.message}`, { method });
        res.status(400).json({ message: error.message });
    }
};



module.exports = { authPermission, bindGetDataDashboard };