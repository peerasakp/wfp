const result = require('dotenv').config({
    path: `.env.${process.env.NODE_ENV || 'development'}`
})
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const { initLogger } = require("./logger");
const logger = initLogger("App");

// middleware
const auth = require("./middleware/auth");

// router
const indexRouter = require("./routes/index");
const accountRouter = require("./routes/auth/account");
const userRouter = require("./routes/auth/user");
const subCategoryRouter = require("./routes/master/subCategory");
const categoryRouter = require("./routes/master/category");
const configWelfareRouter = require("./routes/master/configWelfare");
const logCategoryRouter = require("./routes/log/logCategory");
const logSubCategoryRouter = require("./routes/log/logSubCategory");
const departmentRouter = require("./routes/master/department");
const employeeTypeRouter = require("./routes/master/employeeType");
const postitionRouter = require("./routes/master/position");
const sectorRouter = require("./routes/master/sector");
const roleRouter = require("./routes/auth/role");
const childrenEducationRouter = require("./routes/welfare/childrenEducation");
const dashboardRouter = require("./routes/system/dashboard");
const reimbursementWelfareRouter = require("./routes/welfare/reimburesmentWelfare");
const healthCheckUpWelfareRouter = require("./routes/welfare/healthCheckUpWelfare");
const dentalWelfareRouter = require("./routes/welfare/dentalWelfare");
const medicalWelfareRouter = require("./routes/welfare/medicalWelfare");
const exportRouter = require("./routes/system/export");
const variousWelfare = require("./routes/welfare/variousWelfare");
const variousFuneralFamilyWelfare = require("./routes/welfare/variousFamilyFuneralWelfare");
const funeralWelfareEmployeeDeceased = require("./routes/welfare/funeralWelfareEmployeeDeceased");
const homeRouter = require("./routes/system/home");

var app = express();
app.set("trust proxy", true);
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Content-Disposition"]
    // allowedHeaders: ['Content-Type'],
  })
);
app.use(
  morgan(
    (tokens, req, res) => {
      return [
        tokens["remote-addr"](req, res),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, "content-length"),
        "-",
        tokens["response-time"](req, res),
        "ms"
      ].join(" ");
    },
    { stream: { write: (message) => logger.info(message.trim()) } }
  )
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/assets", express.static(__dirname + "/public"));
// --- Map router ---
app.use("/", indexRouter);
app.use("/account", accountRouter);
app.use("/user", auth, userRouter);
app.use("/sub-category", auth, subCategoryRouter);
app.use("/category", auth, categoryRouter);
app.use("/config-welfare", auth, configWelfareRouter);
app.use("/log-category", auth, logCategoryRouter);
app.use("/log-sub-category", auth, logSubCategoryRouter);
app.use("/sub-category", auth, subCategoryRouter);
app.use("/category", auth, categoryRouter);
app.use("/config-welfare", auth, configWelfareRouter);
app.use("/department", auth, departmentRouter);
app.use("/employee-type", auth, employeeTypeRouter);
app.use("/position", auth, postitionRouter);
app.use("/sector", auth, sectorRouter);
app.use("/role", auth, roleRouter);
app.use("/reimbursement-children-education", auth, childrenEducationRouter);
app.use("/dashboard", auth, dashboardRouter);
app.use("/reimbursement-welfare", auth, reimbursementWelfareRouter);
app.use("/health-check-up-welfare", auth, healthCheckUpWelfareRouter);
app.use("/dental-welfare", auth, dentalWelfareRouter);
app.use("/medical-welfare", auth, medicalWelfareRouter);
app.use("/various-welfare", auth, variousWelfare);
app.use("/various-welfare-funeral-family", auth, variousFuneralFamilyWelfare);
app.use("/funeral-welfare", auth, funeralWelfareEmployeeDeceased);
app.use("/export", exportRouter); // ปิด auth เพิื่อเทส postman ชั่วคราว
app.use("/home", auth, homeRouter);

// error handling
app.use((error, req, res, next) => {
  logger.error(`Internal Server Error: ${error.message}`);
  const status = error.status ?? error.statusCode ?? 500;
  const message = error.message || "Internal Server Error";
  if (req.headers["accept"]?.includes("application/json")) {
    res.status(status).json({ message });
  } else {
    res.status(status).send(message);
  }
});
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
