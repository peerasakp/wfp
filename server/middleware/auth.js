const { initLogger } = require('../logger');
const logger = initLogger('AuthMiddleware');
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const method = 'Authorization';
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || authHeader.split(' ').length < 2) {
			logger.info(`Unauthorized`, { method });
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.secretKey);
		req.user = decoded.user;
		next();
	} catch (error) {
		logger.info(`Unauthorized`, { method });
		res.status(401).json({ message: 'Unauthorized' });
	}
};