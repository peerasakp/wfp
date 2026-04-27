const { initLogger } = require("../logger");
const logger = initLogger("FileMiddleware");
const multer = require("multer");
require("dotenv").config();
const { Op } = require("sequelize");
const permissionType = require("../enum/permission");
const { permissionsHasRoles } = require("../models/mariadb");
const fs = require("fs");
const path = require("path");

exports.authPermissionEditor = async (req, res, next) => {
  const method = "AuthPermissionEditor";
  const { roleId } = req.user;
  try {
    const isAccess = await permissionsHasRoles.count({
      where: {
        [Op.and]: [
          { roles_id: roleId },
          { permissions_id: permissionType.welfareManagement }
        ]
      }
    });
    if (!isAccess) {
      throw Error("You don't have access to this API");
    }
    req.access = true;
    next();
  } catch (error) {
    logger.error(`Error ${error.message}`, { method });
    res.status(401).json({ error: error.message });
  }
};

const fileFolder = path.join(__dirname, "..", "public", "WelfareRegulations");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, fileFolder);
  },
  filename: function (req, file, callback) {
    const originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    callback(null, Date.now() + "-" + originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true); // Allow PDF files
  } else {
    cb(new Error("อัปโหลดได้เฉพาะ PDF เท่านั้น"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array("files");

exports.getName = async (req, res, next) => {
  const method = "getAllFile";
  try {
    fs.readdir(fileFolder, (err, files) => {
      if (err) {
        return res.status(500).json({ message: "ไม่พบโฟลเดอร์" });
      }

      // Filter out .gitignore
      const filteredFiles = files.filter(file => file !== ".gitignore");

      res.json({ files: filteredFiles });
    });
  } catch (error) {
    logger.error(`Error ${error.message}`, { method });
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

exports.getByName = async (req, res, next) => {
  const method = "getByName";
  try {
    const { fileName } = req.query;

    if (!fileName) {
      return res.status(400).json({ message: "fileName is required" });
    }

    const filePath = path.join(fileFolder, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "ไม่พบไฟล์" });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const sanitizedFileName = fileName.replace(/^\d+-/, "");
    const encodedFileName = encodeURIComponent(sanitizedFileName);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedFileName}`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(fileBuffer);
  } catch (error) {
    logger.error(`Error ${error.message}`, { method });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.upload = async (req, res, next) => {
  const method = "uploadFile";
  try {
    if (!req.access) {
      return res.status(400).json({ message: "คุณไม่มีสิทธิ์ในการอัปโหลด" });
    }

    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "กรุณาอัปโหลดไฟล์ !!" });
      }

      // Respond with details of the uploaded files
      res.status(200).json({ message: "อัปโหลดสำเร็จ", files: req.files });
    });
  } catch (error) {
    logger.error(`Error ${error.message}`, { method });
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

exports.deleteFile = async (req, res, next) => {
  const method = "deletedFile";
  try {
    const fileDelete = req.body;
    // Check if the user has access to delete the file
    if (!req.access) {
      return res.status(400).json({ message: "คุณไม่มีสิทธิ์ในการลบไฟล์" });
    }

    // Loop through each file in the fileDelete array
    for (const fileName of fileDelete) {
      // Find the file with the timestamp prefix in the uploads folder
      const files = fs.readdirSync(fileFolder);
      const matchedFile = files.find((file) => file === fileName);

      // If we can't find the file, return a 404
      if (!matchedFile) {
        return res.status(404).json({ message: "ไม่พบไฟล์ !!" });
      }

      // Full path to the file with timestamp
      const filePath = path.join(fileFolder, matchedFile);

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "ไม่พบไฟล์ !!" });
      }

      // Delete the file asynchronously
      await fs.promises.unlink(filePath); // Using promises to handle the async unlink operation
    }

    // Respond with success message
    res.status(200).json({ message: "ลบไฟล์สำเร็จ" });
  } catch (error) {
    logger.error(`Error ${error.message}`, { method });
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};
