// CBC-compliant Lesson Plan PDF generator (pdfkit)
const PDFDocument = require("pdfkit");
const { queryOne } = require("../../config/database");

const safe = (v, f = "—") => (v == null || v === "" ? f : String(v));

async function loadSchool(schoolId) {
  return queryOne("SELECT * FROM schools WHERE id = ?", [schoolId]);
}

function row(doc, label, value) {
  const x = doc.x;
  const y = doc.y;
  doc.font("Helvetica-Bold").fontSize(9).text(label + ":", x, y, { width: 110, continued: false });
  doc.font("Helvetica").fontSize(9).text(safe(value), x + 115, y, { width: 380 });
  doc.moveDown(0.3);
}

function section(doc, title) {
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#1e3a8a")
    .text(title.toUpperCase()).fillColor("black");
  doc.moveTo(doc.x, doc.y).lineTo(doc.x + 500, doc.y).strokeColor("#1e3a8a").stroke();
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10);
}

function paragraph(doc, text) {
  doc.font("Helvetica").fontSize(10).text(safe(text, "—"), { width: 500 });
  doc.moveDown(0.4);
}

async function generateLessonPlanPdf(plan) {
  const school = await loadSchool(plan.school_id);
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // Header
  doc.font("Helvetica-Bold").fontSize(14).text(safe(school?.name, "School"), { align: "center" });
  doc.font("Helvetica").fontSize(9).text(safe(school?.address), { align: "center" });
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#1e3a8a")
    .text("CBE LESSON PLAN", { align: "center" }).fillColor("black");
  doc.moveDown(0.5);

  // Administrative grid
  section(doc, "Administrative Details");
  row(doc, "Date", plan.lesson_date);
  row(doc, "Time", `${safe(plan.start_time)} - ${safe(plan.end_time)}`);
  row(doc, "Subject / Learning Area", plan.subject_name);
  row(doc, "Grade / Class", `${safe(plan.grade_name)} ${safe(plan.stream_name, "")}`.trim());
  row(doc, "Academic Year", plan.academic_year_name);
  row(doc, "Term", plan.term_name);
  row(doc, "Roll", plan.roll);
  row(doc, "Boys / Girls / Total", `${plan.boys} / ${plan.girls} / ${plan.total_learners}`);
  row(doc, "Teacher Name", plan.teacher_name);
  row(doc, "TSC Number", plan.tsc_number);
  row(doc, "Gender", plan.teacher_gender);
  row(doc, "Strand", plan.strand_name);
  row(doc, "Sub-Strand", plan.sub_strand_name);
  row(doc, "Lesson Title", plan.lesson_title);

  section(doc, "Lesson Learning Outcomes");
  paragraph(doc, "By the end of the lesson, the learner should be able to:");
  paragraph(doc, plan.learning_outcomes);

  section(doc, "Key Inquiry Questions");
  paragraph(doc, plan.key_inquiry_questions);

  section(doc, "Learning Resources");
  paragraph(doc, plan.learning_resources);

  section(doc, "Organization of Learning");
  doc.font("Helvetica-Bold").fontSize(10).text("Introduction");
  doc.font("Helvetica-Bold").fontSize(9).text("Teacher Activities:");
  paragraph(doc, plan.intro_teacher_activities);
  doc.font("Helvetica-Bold").fontSize(9).text("Learner Activities:");
  paragraph(doc, plan.intro_learner_activities);
  doc.font("Helvetica-Bold").fontSize(10).text("Lesson Development");
  paragraph(doc, plan.lesson_development);

  section(doc, "Extended Activities");
  paragraph(doc, plan.extended_activities);

  section(doc, "Conclusion");
  doc.font("Helvetica-Bold").fontSize(9).text("Lesson Summary:");
  paragraph(doc, plan.lesson_summary);
  doc.font("Helvetica-Bold").fontSize(9).text("Achievement of Learning Outcomes:");
  paragraph(doc, plan.achievement_of_outcomes);

  section(doc, "Reflection on the Lesson");
  doc.font("Helvetica-Bold").fontSize(9).text("What went well?");
  paragraph(doc, plan.reflection_went_well);
  doc.font("Helvetica-Bold").fontSize(9).text("Challenges encountered:");
  paragraph(doc, plan.reflection_challenges);
  doc.font("Helvetica-Bold").fontSize(9).text("Areas for improvement:");
  paragraph(doc, plan.reflection_improvements);

  doc.moveDown(1);
  doc.font("Helvetica").fontSize(8).fillColor("#666")
    .text(`Generated ${new Date().toLocaleString()}`, { align: "right" });

  doc.end();
  return done;
}

module.exports = { generateLessonPlanPdf };
