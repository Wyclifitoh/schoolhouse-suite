const studentsService = require('./students.service');
const { success, error, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await studentsService.listStudents(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const student = await studentsService.getStudent(req.params.id, req.schoolId);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const student = await studentsService.createStudent({ ...req.body, school_id: req.schoolId });
    return success(res, student, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const student = await studentsService.updateStudent(req.params.id, req.schoolId, req.body);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { list, getById, create, update };
