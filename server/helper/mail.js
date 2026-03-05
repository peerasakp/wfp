var mailer = require("nodemailer");
const { initLogger } = require("../logger");
const logger = initLogger("MailHelper");
require("dotenv").config();

var smtp = {
    host: process.env.IP_MAIL,
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER_MAIL,
        pass: process.env.PASSWORD_MAIL
    }
};

exports.sendMail = (to, reimNumber, actionId, name) => {
    const method = "SendMail";
    const userMail = process.env.USER_MAIL;
    const passwordMail = process.env.PASSWORD_MAIL;
    const hasValidMailConfig =
        !!userMail &&
        !!passwordMail &&
        userMail !== "อีเมลที่จะใช้เป็นผู้ส่ง" &&
        !passwordMail.includes("youtube.com") &&
        !passwordMail.includes("เจนรหัสมาวางตามวิดิโอ");

    if (!hasValidMailConfig) {
        logger.info("Skip sending mail because SMTP config is placeholder/invalid", {
            method,
            data: { to, reimNumber, actionId }
        });
        return;
    }

    let content = "";
    const nameWithNoProfix = name.split(" ").slice(1).join(" ");
    switch (actionId) {
        case 3:
            content = `ระบบเบิกสวัสดิการ ขอแจ้งเตือนการอนุมัติใบเบิกสวัสดิการ คำขอเบิกสวัสดิการเลขที่ ${reimNumber}`;
            break;
        case 4:
            content = `ระบบเบิกสวัสดิการ ขอแจ้งเตือนการไม่อนุมัติใบเบิกสวัสดิการ คำขอเบิกสวัสดิการเลขที่ ${reimNumber}`;
            break;
        default:
            content = `ระบบเบิกสวัสดิการ ขอแจ้งเตือนการแก้ไขข้อมูล คำขอเบิกสวัสดิการเลขที่ ${reimNumber}`;
    }
    var smtpTransport = mailer.createTransport(smtp);
    var mail = {
        from: `"Buu Informatics Welfare Reimburstment" <${userMail}>`,
        to,
        subject: `ระบบเบิกสวัสดิการ แจ้งเตือนการแก้ไขข้อมูลคำขอเบิกสวัสดิการเลขที่ ${reimNumber}`,
        html: `
        <h4>เรียน คุณ${nameWithNoProfix}</h4>
        <br>
        <p>${content}</p>
        <br>
        <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ฝ่ายการเงิน hansa@buu.ac.th หรือโทร 038-103060</p>
        <br>
        <p>ขอแสดงความนับถือ</p>
        <p>ระบบเบิกสวัสดิการ</p>
        `
    };

    smtpTransport.sendMail(mail, function (error, response) {
        smtpTransport.close();
        if (error) {
            logger.info(`Mail send failed: ${error.message}`, { method, data: { to, reimNumber, actionId } });
        } else {
            logger.info(`Success`, { method, data: { mail } });
        }
    });
};
