const { initLogger } = require('../logger');
const logger = initLogger('ActivityLogger');
const { activityLogs } = require('../models/mariadb');
const statusEnum = require('../enum/status');

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

// middleware สำหรับ log การ EXPORT
const logExport = (exportType) => async (req, res, next) => {
  await createActivityLog(req, {
    action: 'EXPORT',
    detail: {
      event: 'EXPORT',
      exportType,
      resourceId: req.params?.id ?? null,
    },
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
  await createActivityLog(req, {
    action: 'CREATE',
    detail: buildReimbursementDetail(req, type, {
      event: 'REIMBURSEMENT_CREATE',
    }),
  });
  next();
};

// UPDATE / APPROVE / REJECT: หลังแก้ไขใบเบิก (PUT)
const logReimbursementUpdate = (type) => async (req, res, next) => {
  let action = 'UPDATE';
  let event = 'REIMBURSEMENT_UPDATE';

  const status = req.body?.status;
  if (typeof status !== 'undefined') {
    if (status === statusEnum.approve) {
      action = 'APPROVE';
      event = 'REIMBURSEMENT_APPROVE';
    } else if (status === statusEnum.NotApproved) {
      action = 'REJECT';
      event = 'REIMBURSEMENT_REJECT';
    }
  }

  await createActivityLog(req, {
    action,
    detail: buildReimbursementDetail(req, type, {
      event,
      status,
    }),
  });
  next();
};

// VIEW: เมื่อเปิดดูรายละเอียดใบเบิก (GET /:id, /get-welfare/:id)
const logReimbursementView = (type) => async (req, res, next) => {
  await createActivityLog(req, {
    action: 'VIEW',
    detail: buildReimbursementDetail(req, type, {
      event: 'REIMBURSEMENT_VIEW',
    }),
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

