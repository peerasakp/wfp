const { initLogger } = require('../logger');
const logger = initLogger('ActivityLogger');
const { activityLogs } = require('../models/mariadb');
const status = require('../enum/status');
const roleType = require('../enum/role');

// ฟิลด์ที่ไม่ควรเก็บลง log ตามหลัก PDPA (เช่น รหัสผ่าน, token)
const SENSITIVE_FIELDS = ['password', 'newPassword', 'oldPassword', 'accessToken', 'token', 'secretKey'];

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    const cloned = JSON.parse(JSON.stringify(obj));
    const stack = [cloned];
    while (stack.length) {
      const current = stack.pop();
      if (current && typeof current === 'object') {
        Object.keys(current).forEach((key) => {
          if (SENSITIVE_FIELDS.includes(key)) {
            current[key] = '[REDACTED]';
          } else if (typeof current[key] === 'object') {
            stack.push(current[key]);
          }
        });
      }
    }
    return cloned;
  } catch {
    // fallback ถ้า clone ไม่สำเร็จ
    return {};
  }
}

function buildDetail(req, extraDetail = {}) {
  return sanitizeObject({
    method: req.method,
    path: req.originalUrl || req.url,
    params: req.params,
    query: req.query,
    body: req.body,
    ...extraDetail,
  });
}

async function createActivityLog(req, {
  action,
  userId,
  beforeData = null,
  afterData = null,
  detail = {},
}) {
  try {
    await activityLogs.create({
      user_id: userId ?? (req.user ? req.user.id : null),
      action,
      before_data: beforeData ? sanitizeObject(beforeData) : null,
      after_data: afterData ? sanitizeObject(afterData) : null,
      detail: buildDetail(req, detail),
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] || null,
    });
  } catch (error) {
    // ไม่ให้กระทบการทำงานหลักของระบบ
    logger.error(`Failed to write activity log: ${error.message}`, {
      action,
      userId: userId ?? (req.user ? req.user.id : null),
    });
  }
}

function runAfterResponse(req, res, fn) {
  let ran = false;
  res.once('finish', async () => {
    if (ran) return;
    ran = true;
    // เก็บเฉพาะเคสที่ response สำเร็จ เพื่อลด noise ใน log
    if (res.statusCode >= 400) return;
    try {
      await fn();
    } catch (error) {
      logger.error(`Failed to write activity log (after response): ${error.message}`);
    }
  });
}

// middleware สำหรับ log การ EXPORT
const logExport = (exportType) => async (req, res, next) => {
  runAfterResponse(req, res, async () => {
    await createActivityLog(req, {
      action: 'EXPORT',
      detail: {
        event: 'EXPORT',
        exportType,
        resourceId: req.params?.id ?? null,
      },
    });
  });
  next();
};

// ----------------- Reimbursement Activity Logs -----------------
// ใช้กับใบเบิกสวัสดิการประเภทต่าง ๆ (health / medical / dental / various / children / funeral ฯลฯ)

function buildReimbursementDetail(req, type, baseDetail = {}) {
  return {
    ...baseDetail,
    reimbursementType: type,
    reimbursementId: req.params?.id ?? req.createdId ?? null,
  };
}

// CREATE: หลังสร้างใบเบิก (POST)
const logReimbursementCreate = (type) => async (req, res, next) => {
  runAfterResponse(req, res, async () => {
    const roleId = req.user?.roleId ?? null;
    const canLogCreate =
      roleId === roleType.generalUser ||
      roleId === roleType.agenUser ||
      roleId === roleType.financialUser ||
      roleId === roleType.adminUser;
    if (!canLogCreate) return;

    await createActivityLog(req, {
      action: 'CREATE',
      detail: buildReimbursementDetail(req, type, {
        event: 'REIMBURSEMENT_CREATE',
        actionId: req.body?.actionId ?? null,
        roleId,
      }),
    });
  });
  next();
};

// UPDATE: หลังแก้ไขใบเบิก (PUT)
const logReimbursementUpdate = (type) => async (req, res, next) => {
  const actionId = req.body?.actionId;
  const roleId = req.user?.roleId ?? null;

  let action = 'UPDATE';
  let event = 'REIMBURSEMENT_UPDATE';

  // แยก event สำหรับการอนุมัติ/ไม่อนุมัติ (ใช้ในหน้าจัดการ/การเงิน)
  if (actionId === status.approve) {
    action = 'APPROVE';
    event = 'REIMBURSEMENT_APPROVE';
  } else if (actionId === status.NotApproved) {
    action = 'NOT_APPROVE';
    event = 'REIMBURSEMENT_NOT_APPROVE';
  }

  runAfterResponse(req, res, async () => {
    // Role-based logging rules:
    // - generalUser/agenUser: only CREATE + VIEW (no UPDATE/APPROVE logs)
    // - deanUser: only VIEW + APPROVE/NOT_APPROVE
    // - financialUser/adminUser: keep full logging for workflow actions
    if (roleId === roleType.generalUser || roleId === roleType.agenUser) return;
    if (roleId === roleType.deanUser && action === 'UPDATE') return;
    if (roleId === roleType.deanUser && (action === 'APPROVE' || action === 'NOT_APPROVE')) {
      // allowed
    } else if (roleId !== roleType.financialUser && roleId !== roleType.adminUser && roleId !== roleType.deanUser) {
      return;
    }

    await createActivityLog(req, {
      action,
      detail: buildReimbursementDetail(req, type, {
        event,
        actionId: actionId ?? null,
        roleId,
      }),
    });
  });
  next();
};

// VIEW: เมื่อเปิดดูรายละเอียดใบเบิก (GET /:id, /get-welfare/:id)
const logReimbursementView = (type) => async (req, res, next) => {
  runAfterResponse(req, res, async () => {
    const roleId = req.user?.roleId ?? null;
    const canLogView =
      roleId === roleType.generalUser ||
      roleId === roleType.agenUser ||
      roleId === roleType.financialUser ||
      roleId === roleType.deanUser ||
      roleId === roleType.adminUser;
    if (!canLogView) return;

    await createActivityLog(req, {
      action: 'VIEW',
      detail: buildReimbursementDetail(req, type, {
        event: 'REIMBURSEMENT_VIEW',
        roleId,
      }),
    });
  });
  next();
};

module.exports = {
  createActivityLog,
  logExport,
  logReimbursementCreate,
  logReimbursementUpdate,
  logReimbursementView,
};

