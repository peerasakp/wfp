const { users, positions, departments, roles, sector, sequelize, permissionsHasRoles } = require('../models/mariadb');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ActiveDirectory = require('activedirectory');

const { initLogger } = require('../logger');
const logger = initLogger('AccountController');
const { createActivityLog } = require('../middleware/activityLog');
const { getpathMenu, getpathMenuEditor } = require('../enum/format');
const permissionType = require('../enum/permission')
const { Op } = require('sequelize')

exports.login = async (req, res, next) => {
    const method = 'Login';
    const { username, password } = req.body;
    try {
        const userData = await users.findOne({
            where: {
                username,
                deleted_at: null
            },
            attributes: [
                'id',
                'name',
                'password',
                'email',
                'psn_id'
            ],
            include: [
                {
                    model: positions, as: 'position',
                    attributes: ['name'], required: false
                },
                {
                    model: departments, as: 'department',
                    attributes: ['name'], required: false
                },
                {
                    model: roles, as: 'role',
                    attributes: ['id', 'name'], required: false
                },
                {
                    model: sector, as: 'sector',
                    attributes: ['name'], required: false
                },
            ]
        });
        if (userData) {
            var user = userData.get();
            let passwordIsValid = false;
            if (user.password === null) {
                try {
                    passwordIsValid = await this.loginLdap(username, password);
                } catch (error) {
                    logger.info('Login Ldap is not completed', { method, data: { username } });
                    return res.status(400).send({
                        message: error,
                    });
                }
            }
            else {
                passwordIsValid = await bcrypt.compare(
                    password,
                    user.password
                );
            }
            if (passwordIsValid) {
                delete user.password;
                const role = user?.role;
                const positions = user?.position?.name ?? '-';
                const department = user?.department?.name ?? '-';
                const sector = user?.sector?.name ?? '-';
                user.roleName = role?.name ? role?.name : null;
                user.roleId = role?.id ? role.id : null;
                user.position = positions;
                user.department = department;
                user.sector = sector;
                const [isAccess, isStaff,userPermission] = await Promise.all([
                  permissionsHasRoles.count({
                    where: {
                      [Op.and]: [{ roles_id: user.roleId }, { permissions_id: permissionType.welfareManagement }],
                    },
                  }),
                  permissionsHasRoles.count({
                    where: {
                      [Op.and]: [{ roles_id: user.roleId }, { permissions_id: permissionType.funeralWelfare }],
                    },
                  }),
                  permissionsHasRoles.findAll({
                    where: { roles_id: user.roleId },
                    attributes: ['permissions_id'],
                  })
                ]);
                
                user.isEditor = isAccess ? true : false;
                user.isStaff = isStaff ? true : false;
                if(isAccess){
                  user.redirectTo = "welfare_management_list";
                }
                delete user.role;
                const token = jwt.sign(
                    {
                        user,
                        role: role?.get(),
                    },
                    process.env.secretKey,
                    {
                        expiresIn: '1d',
                    }
                );
                if(user.roleId !== 4){
                    const userMenus = userPermission
                      .map((userObj) => getpathMenu(userObj))
                      .filter((result) => result !== null && result !== undefined);
                    const editorMenus = userPermission
                      .map((userObj) => getpathMenuEditor(userObj))
                      .filter((result) => result !== null && result !== undefined);

                    // Force dean role to only see welfare management menu
                    if (user.roleName === 'คณบดี') {
                      user.path = null;
                      user.pathEditor = editorMenus.filter((m) => m.to === "welfare_management_list");
                    }
                    // HR can see all reimbursement menus (including funeral-welfare)
                    else if (user.roleName === 'เจ้าหน้าที่รับผิดชอบด้านบุคคล') {
                      const path = [
                        {
                          title: "หน้าหลัก",
                          icon: "outlinedHome",
                          to: "home",
                        },
                        ...userMenus,
                      ];
                      user.path = path;
                      if (editorMenus) user.pathEditor = editorMenus;
                    }
                    // Other roles: hide only funeral-welfare menu
                    else {
                      const filteredMenus = userMenus.filter((m) => m?.to !== 'funeral_welfare_list');
                      const path = [
                        {
                          title: "หน้าหลัก",
                          icon: "outlinedHome",
                          to: "home",
                        },
                        ...filteredMenus,
                      ];
                      user.path = path;
                      if (editorMenus) user.pathEditor = editorMenus;
                    }
                }
                else{
                    // roleId === 4 branch (e.g. super/admin). Still respect the HR restriction if needed.
                    const editorMenus = userPermission
                      .map((userObj) => getpathMenuEditor(userObj))
                      .filter((result) => result !== null && result !== undefined);
                    if (user.roleName === 'เจ้าหน้าที่รับผิดชอบด้านบุคคล') {
                        const userMenus = userPermission
                          .map((userObj) => getpathMenu(userObj))
                          .filter((result) => result !== null && result !== undefined);
                        const path = [
                          {
                            title: "หน้าหลัก",
                            icon: "outlinedHome",
                            to: "home",
                          },
                          ...userMenus,
                        ];
                        user.path = path;
                        user.pathEditor = null;
                        delete user.redirectTo;
                    } else if (user.roleName === 'ผู้ดูแลระบบ') {
                        // Admin: redirect directly to user management page after login
                        user.redirectTo = "user_management_list";
                        user.path = [
                          {
                            title: "หน้าหลัก",
                            icon: "outlinedHome",
                            to: "home",
                          },
                        ];
                        user.pathEditor = editorMenus.filter((m) => m?.to === "user_management_list");
                    } else {
                        const filteredMenus = userPermission
                          .map((userObj) => getpathMenu(userObj))
                          .filter((result) => result !== null && result !== undefined)
                          .filter((m) => m?.to !== 'funeral_welfare_list');
                        const path = [
                          {
                            title: "หน้าหลัก",
                            icon: "outlinedHome",
                            to: "home",
                          },
                          ...filteredMenus,
                        ];
                        user.path = path;
                        user.pathEditor = null;
                        delete user.redirectTo;
                    }
                }
                logger.info('Complete', { method, data: { username } });
                // PDPA / Audit: Log การเข้าสู่ระบบ (LOGIN)
                await createActivityLog(req, {
                    action: 'LOGIN',
                    userId: user.id,
                    afterData: {
                        userId: user.id,
                        name: user.name,
                        roleId: user.roleId,
                    },
                    detail: {
                        event: 'LOGIN_SUCCESS',
                    },
                });

                return res.status(200).send({ user, accessToken: token });
            }
            logger.info('Password is Incorrect', {
                method,
                data: { username },
            });
        }
        logger.info('User not found', { method, data: { username } });
        return res.status(400).send({
            message: 'กรุณากรอกบัญชีผู้ใช้งานและรหัสผ่านให้ถูกต้อง',
        });
    } catch (error) {
        logger.error(`Error ${error.message}`, { method, data: { username } });
        next(error);
    }
};

exports.loginLdap = (username, password) => {
    return new Promise((resolve, reject) => {
        const config = {
            url: process.env.adUrl,
            baseDN: process.env.baseDN,
        };
        const ad = new ActiveDirectory(config);

        ad.authenticate(`${username}@buu.ac.th`, password, (error, auth) => {
            if (error) reject(error.message);
            if (auth) resolve(true);
        });
    });
}