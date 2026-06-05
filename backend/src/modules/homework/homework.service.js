const repo = require("./homework.repository");

const list = (schoolId, query, session) =>
  repo.findAll(schoolId, query, session);
const getById = (id, schoolId) => repo.findById(id, schoolId);

const create = async (data, session) => {
  if (!data.title || !data.subject || !data.class_name || !data.due_date) {
    throw Object.assign(
      new Error("title, subject, class_name and due_date are required"),
      { statusCode: 400 },
    );
  }
  return repo.create(data, session);
};

const update = (id, schoolId, data) => repo.update(id, schoolId, data);
const remove = (id, schoolId) => repo.remove(id, schoolId);

const listSubmissions = (homeworkId, schoolId, session) =>
  repo.findSubmissions(homeworkId, schoolId, session);

const createSubmission = (homeworkId, schoolId, data, session) =>
  repo.createSubmission(
    { ...data, homework_id: homeworkId, school_id: schoolId },
    session,
  );

const updateSubmission = (submissionId, schoolId, data) =>
  repo.updateSubmission(submissionId, schoolId, data);

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  listSubmissions,
  createSubmission,
  updateSubmission,
};
