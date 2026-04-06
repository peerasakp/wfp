const { Op, literal } = require("sequelize");
const isNullOrEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const checkRequire = (fieldName, obj, errorObj) => {
  if (isNullOrEmpty(obj[fieldName]))
    errorObj[fieldName] = `${fieldName} is require`;
};

const getFiscalYear = () => {
  return {
    [Op.between]: [
      literal(`
              CASE 
                WHEN MONTH(CURDATE()) >= 10 
                THEN DATE_FORMAT(CURDATE(), '%Y-10-01') 
                ELSE DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-10-01') 
              END
            `),
      literal(`
              CASE 
                WHEN MONTH(CURDATE()) >= 10 
                THEN DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 YEAR), '%Y-09-30') 
                ELSE DATE_FORMAT(CURDATE(), '%Y-09-30') 
              END
            `)
    ]
  };
};

const betweenFiscalByYear = (startYear, endYear) => {
  return {
    [Op.between]: [
      literal(`STR_TO_DATE('${startYear}-10-01', '%Y-%m-%d')`),
      literal(`STR_TO_DATE('${endYear}-09-30', '%Y-%m-%d')`)
    ]
  };
};
const getFiscalYearDynamic = (date) => {
  return {
    [Op.between]: [
      literal(
        `CASE 
          WHEN MONTH(STR_TO_DATE('${date}', '%Y-%m-%d')) >= 10 
          THEN DATE_FORMAT(STR_TO_DATE('${date}', '%Y-%m-%d'), '%Y-10-01') 
          ELSE DATE_FORMAT(DATE_SUB(STR_TO_DATE('${date}', '%Y-%m-%d'), INTERVAL 1 YEAR), '%Y-10-01') 
        END`
      ),
      literal(
        `CASE 
          WHEN MONTH(STR_TO_DATE('${date}', '%Y-%m-%d')) >= 10 
          THEN DATE_FORMAT(DATE_ADD(STR_TO_DATE('${date}', '%Y-%m-%d'), INTERVAL 1 YEAR), '%Y-09-30') 
          ELSE DATE_FORMAT(STR_TO_DATE('${date}', '%Y-%m-%d'), '%Y-09-30') 
        END`
      )
    ]
  };
};

const getYear2Digits = () => {
  const getThaiYear = (year) => (year + 543).toString().slice(-2);

  const thisYear = new Date().getFullYear(); // 2025
  const thaiYearShort = getThaiYear(thisYear); // "68"
  return thaiYearShort;
};
const formatNumber = (num) => num.toString().padStart(2, "0");
const isInvalidNumber = (value) =>
  isNaN(value) || value === "" || value === null;

const dynamicCheckRemaining = (remaining) => {
  try {
    return (
      remaining.fundRemaining < 0 ||
      remaining.fundRemaining === 0 ||
      remaining.requestsRemaining === 0 ||
      remaining.requestsRemaining < 0 ||
      remaining.perUsersRemaining === 0 ||
      remaining.perUsersRemaining < 0
    );
  } catch (error) {
    return false;
  }
};

/** Applicant may edit draft, or resubmit after failed e-sign (wait approve, no document yet). */
function canApplicantEditReimbursement(datas, statusTextEnum) {
  if (datas.status === statusTextEnum.draft) return true;
  const docMissing =
    datas.document_path == null || String(datas.document_path).trim() === '';
  return datas.status === statusTextEnum.waitApprove && docMissing;
}

/** Editors may open drafts from welfare management; keep role-specific approval statuses. */
function editorUpdateAllowedStatuses(allowStatusByRole, statusTextEnum) {
  if (!Array.isArray(allowStatusByRole)) {
    return statusTextEnum?.draft != null ? [statusTextEnum.draft] : [];
  }
  return allowStatusByRole.includes(statusTextEnum.draft)
    ? allowStatusByRole
    : [...allowStatusByRole, statusTextEnum.draft];
}

module.exports = {
  isNullOrEmpty,
  checkRequire,
  getFiscalYear,
  getYear2Digits,
  formatNumber,
  isInvalidNumber,
  betweenFiscalByYear,
  getFiscalYearDynamic,
  dynamicCheckRemaining,
  canApplicantEditReimbursement,
  editorUpdateAllowedStatuses
};
