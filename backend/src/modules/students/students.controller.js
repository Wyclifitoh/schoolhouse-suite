const studentsService = require("./students.service");
const { success, error } = require("../../utils/response");

const list = async (req, res) => {
  try {
    const result = await studentsService.list(req.schoolId, req.query);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getById = async (req, res) => {
  try {
    const student = await studentsService.getById(req.params.id, req.schoolId);
    return success(res, student);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const create = async (req, res) => {
  try {
    const student = await studentsService.create(req.schoolId, req.body);
    return success(res, student, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const bulkImport = async (req, res) => {
  try {
    const result = await studentsService.bulkImport(
      req.schoolId,
      req.body.students || req.body.rows || [],
    );
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const update = async (req, res) => {
  try {
    const student = await studentsService.update(
      req.params.id,
      req.schoolId,
      req.body,
    );
    return success(res, student);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const deactivate = async (req, res) => {
  try {
    const student = await studentsService.deactivate(
      req.params.id,
      req.schoolId,
    );
    return success(res, student);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getSiblings = async (req, res) => {
  try {
    const siblings = await studentsService.getSiblings(
      req.schoolId,
      req.query.parent_phone,
      req.query.exclude_id,
    );
    return success(res, siblings);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const summary = async (req, res) => {
  try {
    return success(res, await studentsService.getSummary(req.schoolId));
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const exportCsv = async (req, res) => {
  try {
    const csv = await studentsService.exportCsv(req.schoolId, req.query);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const exportXlsx = async (req, res) => {
  try {
    const rows = await studentsService.fetchExportRows(req.schoolId, req.query);
    const {
      streamXlsx,
      applyHeaderStyle,
    } = require("../reports/export.service");
    await streamXlsx(
      res,
      `students-${new Date().toISOString().slice(0, 10)}.xlsx`,
      async (wb) => {
        const ws = wb.addWorksheet("Students");
        applyHeaderStyle(ws, [
          { header: "Adm No", key: "admission_number", width: 14 },
          { header: "First Name", key: "first_name", width: 16 },
          { header: "Last Name", key: "last_name", width: 16 },
          { header: "Gender", key: "gender", width: 10 },
          { header: "DOB", key: "date_of_birth", width: 14 },
          { header: "Class", key: "grade", width: 14 },
          { header: "Stream", key: "stream", width: 14 },
          { header: "Parent", key: "parent_name", width: 22 },
          { header: "Phone", key: "parent_phone", width: 16 },
          { header: "Status", key: "status", width: 12 },
        ]);
        rows.forEach((r) => ws.addRow(r));
      },
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const exportPdf = async (req, res) => {
  try {
    const rows = await studentsService.fetchExportRows(req.schoolId, req.query);
    const {
      streamPdf,
      pdfHeader,
      pdfTable,
    } = require("../reports/export.service");
    streamPdf(
      res,
      `students-${new Date().toISOString().slice(0, 10)}.pdf`,
      (doc) => {
        const filterSummary = [
          req.query.status && `Status: ${req.query.status}`,
          req.query.grade_id && `Class filter applied`,
          req.query.search && `Search: ${req.query.search}`,
        ]
          .filter(Boolean)
          .join(" • ");
        pdfHeader(doc, {
          title: "Students List",
          subtitle: `${rows.length} students${filterSummary ? " • " + filterSummary : ""}`,
          school: "School",
        });
        pdfTable(
          doc,
          [
            { header: "Adm", key: "admission_number", width: 55 },
            { header: "Name", key: "name", width: 150 },
            { header: "Gender", key: "gender", width: 45 },
            { header: "Class", key: "grade", width: 70 },
            { header: "Stream", key: "stream", width: 70 },
            { header: "Parent", key: "parent_name", width: 100 },
            { header: "Phone", key: "parent_phone", width: 75 },
          ],
          rows.map((r) => ({
            ...r,
            name: `${r.first_name || ""} ${r.last_name || ""}`.trim(),
          })),
        );
      },
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getNextAdmissionNumber = async (req, res) => {
  try {
    const nextNumber = await studentsService.getNextAdmissionNumber(
      req.schoolId,
    );
    return success(res, { admission_number: nextNumber });
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  list,
  getById,
  create,
  bulkImport,
  update,
  deactivate,
  getSiblings,
  summary,
  exportCsv,
  exportXlsx,
  exportPdf,
  getNextAdmissionNumber,
};
