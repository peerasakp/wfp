var express = require("express");
var router = express.Router();
const {
  authPermissionEditor,
  upload,
  getName,
  getByName,
  deleteFile
} = require("../../middleware/file");

router.get("/", getName);
router.get("/get-by-name", getByName);

router.post("/upload", authPermissionEditor, upload);

router.post("/delete", authPermissionEditor,deleteFile);

module.exports = router;
