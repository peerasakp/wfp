var express = require("express");
var router = express.Router();
const fileRouter = require("./file");

router.use("/file", fileRouter);

router.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = router;
