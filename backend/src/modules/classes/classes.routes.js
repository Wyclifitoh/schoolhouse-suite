const router = require("express").Router();
const classesController = require("./classes.controller");

router.get("/grades", classesController.listGrades);
router.post("/grades", classesController.createGrade);
router.get("/streams", classesController.listStreams);
router.post("/streams", classesController.createStream);
router.put("/streams/:id", classesController.updateStream);
router.get("/subjects", classesController.listSubjects);
router.post("/subjects", classesController.createSubject);
router.put("/subjects/:id", classesController.updateSubject);
router.delete("/subjects/:id", classesController.deleteSubject);
router.delete("/streams/:id", classesController.deleteStream);
router.delete("/grades/:id", classesController.deleteGrade);
router.get("/staff", classesController.listStaff);
router.get("/departments", classesController.listDepartments);
router.post("/departments", classesController.createDepartment);
router.get("/designations", classesController.listDesignations);
router.get("/timetable", classesController.listTimetable);
router.post("/timetable", classesController.createTimetableEntry);
router.put("/timetable/:id", classesController.updateTimetableEntry);
router.delete("/timetable/:id", classesController.deleteTimetableEntry);
router.get("/", classesController.list);
router.post("/", classesController.create);
router.get("/:id", classesController.getById);

module.exports = router;
