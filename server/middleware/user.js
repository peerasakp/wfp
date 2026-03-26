const { isNullOrEmpty } = require('../middleware/utility');
const { initLogger } = require('../logger');
const logger = initLogger('UserValidator');
const { Op } = require('sequelize')
const permissionType = require('../enum/permission')
const roleType = require('../enum/role')
const { permissionsHasRoles, sequelize, users,positions, sector, employeeTypes, departments, } = require('../models/mariadb')
const { formatDateSlash } = require('../enum/formatDate');

const authPermission = async (req, res, next) => {
	const method = 'AuthPermission';
	const { roleId } = req.user;
	if (roleId === 4) {
		return next();
	}
	try {
		const isAccess = await permissionsHasRoles.count({
			where: {
				[Op.and]: [{ roles_id: roleId }, { permissions_id: permissionType.userManagement }],
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

const checkNullValue = async (req, res, next) => {
	try{
		const {
			prefix,
			username,
			name,
			positionId,
			employeeTypeId,
			departmentId,
			firstWorkingDate,
			psn_id,
			roleId,
			houseNumber,
			district,
			subDistrict,
			province,
			postalCode,
		} = req.body;
		const errorObj = {};
		if (isNullOrEmpty(prefix)) errorObj['prefix'] = 'กรุณากรอกคำนำหน้าชื่อ';
		if (isNullOrEmpty(username)) errorObj['username'] = 'กรุณากรอกบัญชึผู้ใช้งาน';
		if (isNullOrEmpty(name)) errorObj['name'] = 'กรุณากรอกชื่อ - นามสกุล';
		if (isNullOrEmpty(positionId)) errorObj['positionId'] = 'กรุณากรอกตำแหน่ง';
		if (isNullOrEmpty(employeeTypeId)) errorObj['employeeTypeId'] = 'กรุณากรอกประเภทบุคลากร';
		if (isNullOrEmpty(departmentId)) errorObj['departmentId'] = 'กรุณากรอกส่วนงาน';
		if (isNullOrEmpty(firstWorkingDate)) errorObj['firstWorkingDate'] = 'กรุณากรอกวันที่เริ่มเข้าปฏิบัติงาน';
		if (isNullOrEmpty(psn_id)) errorObj['psn_id'] = 'กรุณากรอกหมายเลข psn id';
		if (!isNullOrEmpty(psn_id) && `${psn_id}`.length > 8) errorObj['psn_id'] = 'หมายเลข psn id ต้องไม่เกิน 8 ตัวอักษร';
		if (isNullOrEmpty(roleId)) errorObj['roleId'] = 'กรุณาเลือกบทบาท';
		if (isNullOrEmpty(houseNumber)) errorObj['houseNumber'] = 'กรุณากรอกบ้านเลขที่';
		if (isNullOrEmpty(district)) errorObj['district'] = 'กรุณากรอก อำเภอ/เขต';
		if (isNullOrEmpty(subDistrict)) errorObj['subDistrict'] = 'กรุณากรอก ตำบล/แขวง';
		if (isNullOrEmpty(province)) errorObj['province'] = 'กรุณากรอกจังหวัด';
		if (isNullOrEmpty(postalCode)) errorObj['postalCode'] = 'กรุณากรอกรหัสไปรษณีย์';
		if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
		next();
	}
	catch(error){
		res.status(500).json({
            message: 'Internal Server Error',
        });
	}
}

const bindCreate = async (req, res, next) => {
	try {
		const {
			prefix,
			username,
			name,
			positionId,
			employeeTypeId,
			departmentId,
			sectorId,
			firstWorkingDate,
			psn_id,
			roleId,
			houseNumber,
			street,
			district,
			subDistrict,
			province,
			postalCode,
		} = req.body;
		const errorObj = {};
		const inputDate = new Date(firstWorkingDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		inputDate.setHours(0, 0, 0, 0);
		if (inputDate > today) {
			errorObj['firstWorkingDate'] = 'วันที่เริ่มเข้าปฏิบัติงานไม่สามารถมากกว่าวันนี้ได้';
		}
		if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
		const { id } = req.user;
		const dataBinding = {
			username: username,
			name: prefix + ' ' + name,
			email: username + "@buu.ac.th",
			positions_id: positionId,
			employee_types_id: employeeTypeId,
			departments_id: departmentId,
			sector_id: sectorId,
			first_working_date: firstWorkingDate,
			psn_id: psn_id ?? null,
			roles_id: roleId,
			child: req.body.child,
			created_by: id,
			updated_by: id,
			house_number: houseNumber,
			street: street ?? "-",
			district: district,
			sub_district: subDistrict,
			province: province,
			postal_code: postalCode,
		}
		if (isNullOrEmpty(req.body.child)) {
			delete dataBinding.child;
		}
		else {
			if (!isNullOrEmpty(dataBinding.child)) {
				dataBinding.child = dataBinding.child.filter(item =>
					!Object.values(item).some(value => value === null || value === "")
				);
				if (dataBinding.child.length === 0) {
					delete dataBinding.child;
				}
				else {
					const newChild = dataBinding.child.map((child) => {
						const childName = child.prefix + ' ' + child.name;
						return {
							name: childName,
							birthday: formatDateSlash(child?.birthday),
						};
					});
					dataBinding.child = newChild;
				}
			}
		}
		req.body = dataBinding;
		next();
	} catch (error) {
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
};
const bindUpdate = async (req, res, next) => {
	try {
		const {
			prefix,
			username, name, positionId, employeeTypeId, departmentId, sectorId, firstWorkingDate, psn_id, roleId, deleteChild,
			houseNumber,
			street,
			district,
			subDistrict,
			province,
			postalCode,
		} = req.body;
		const errorObj = {};
		const inputDate = new Date(firstWorkingDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		inputDate.setHours(0, 0, 0, 0);
		if (inputDate > today) {
			errorObj['firstWorkingDate'] = 'วันที่เริ่มเข้าปฏิบัติงานไม่สามารถมากกว่าวันนี้ได้';
		}
		if (Object.keys(errorObj).length) return res.status(400).json({ errors: errorObj });
		const { id } = req.user;
		const dataBinding = {
			username: username,
			name: prefix + ' ' + name,
			email: username + "@buu.ac.th",
			positions_id: positionId,
			employee_types_id: employeeTypeId,
			departments_id: departmentId,
			sector_id: sectorId,
			first_working_date: firstWorkingDate,
			psn_id: psn_id ?? null,
			roles_id: roleId,
			child: req.body.child,
			updated_by: id,
			house_number: houseNumber,
			street: street ?? "-",
			district: district,
			sub_district: subDistrict,
			province: province,
			postal_code: postalCode,
		}
		if (isNullOrEmpty(req.body.child)) {
			delete dataBinding.child;
		}
		else{
			if (!isNullOrEmpty(dataBinding.child)) {
				dataBinding.child = dataBinding.child.filter(item =>
					!Object.values(item).some(value => value.name === null || value.name === "" || value.birthday === null || value.birthday === "" || value.prefix === null || value.prefix === "")
				);
				if (dataBinding.child.length === 0) {
					delete dataBinding.child;
				}
				else {
					const newChild = dataBinding.child.map((child) => {
						const childId = child.id;
						const childName = child.prefix + ' ' + child.name;
	
						const result = {
							name: childName,
							birthday: formatDateSlash(child?.birthday),
						};
	
						if (childId) {
							result.id = childId;
						}
	
						return result;
					});
					dataBinding.child = newChild;
				}
			}
		}
		if (!isNullOrEmpty(deleteChild)) {
			req.deleteChild = deleteChild;
		}
		req.body = dataBinding;
		next();
	} catch (error) {
		console.log(error)
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
};

const validateDuplicate = async (req, res, next) => {
	try {
		const { username } = req.body;
		const dataId = req.params['id'];
		var filter = {};
		if (!isNullOrEmpty(dataId)) {
			filter[Op.and] = [
				{ '$users.username$': { [Op.eq]: username } },
				{ '$users.id$': { [Op.ne]: dataId } }
			];
		} else {
			filter = {
				'$users.username$': { [Op.eq]: username }
			};
		}
		const isDuplicate = await users.count({ where: filter });

		if (isDuplicate) res.status(400).json({ message: "บัญชีผู้ใช้นี้มีอยู่แล้ว" });
		next();
	} catch (error) {
		logger.error(error);
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
};

const newValueUserType = async (req, res, next) => {
	try {
		let { positions_id, employee_types_id, departments_id, sector_id } = req.body;
		if(isNaN(positions_id)){
			const addPosition = await positions.create({name : positions_id});
			req.body.positions_id = addPosition.id;
		}
		if(isNaN(employee_types_id)){
			const addEmployeeType = await employeeTypes.create({name : employee_types_id});
			req.body.employee_types_id = addEmployeeType.id;
		}
		if(isNaN(departments_id)){
			const addDepartment = await departments.create({name : departments_id});
			req.body.departments_id = addDepartment.id;
		}
		if(isNaN(sector_id)){
			const addSectors = await sector.create({name : sector_id});
			req.body.sector_id = addSectors.id;
		}
		next();
	} catch (error) {
		logger.error(error);
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
};



const bindFilter = async (req, res, next) => {
	const method = 'BindFilter';
	try {
		const { keyword } = req.query;
		req.query.filter = {};
		req.query.filter[Op.and] = [];
		if (!isNullOrEmpty(keyword)) {
			req.query.filter[Op.and].push({
				'$users.name$': { [Op.like]: `%${keyword}%` },
			});
		}
		req.query.filter[Op.and].push(
			{
				'$users.deleted_at$': { [Op.is]: null }
			},
			{
				'$users.roles_id$': { [Op.ne]: roleType.adminUser }
			},
		);
		next();
	}
	catch (error) {
		logger.error(`Error ${error.message}`, { method });
		res.status(400).json({ message: error.message });
	}
};


module.exports = { authPermission, bindCreate, bindUpdate, validateDuplicate, bindFilter,newValueUserType,checkNullValue };