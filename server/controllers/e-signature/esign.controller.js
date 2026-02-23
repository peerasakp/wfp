const BaseController = require("../BaseControllers");
const {
    sequelize,
    reimbursementsGeneral
} = require("../models/mariadb");

// This object create to support esign only
class esignController extends BaseController {
    constructor() {
        super(reimbursementsGeneral)
    }
    updateMedicalPath(req, res, next) {
        const Id = req.createdId;
        try{
            const data = sequelize.transaction(async (t) => {

            })   
        }catch(error){
            
        }

    }
}

module.exports = new esignController();