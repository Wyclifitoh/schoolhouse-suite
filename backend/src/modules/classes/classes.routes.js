const router = require("express").Router();
const classesController = require("./classes.controller");

router.get("/grades", classesController.listGrades);
router.post("/grades", classesController.createGrade);
router.get("/streams", classesController.listStreams);
router.post("/streams", classesController.createStream);
router.get("/subjects", classesController.listSubjects);
router.post("/subjects", classesController.createSubject);
router.get("/staff", classesController.listStaff);
router.get("/departments", classesController.listDepartments);
router.post("/departments", classesController.createDepartment);
router.get("/designations", classesController.listDesignations);
router.get("/", classesController.list);
router.post("/", classesController.create);
router.get("/:id", classesController.getById);

module.exports = router;
