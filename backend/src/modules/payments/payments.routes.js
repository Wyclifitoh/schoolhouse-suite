const router = require("express").Router();
const c = require("./payments.controller");
const receiptPdf = require("../finance/receipt-pdf.service");
const { error } = require("../../utils/response");

router.get("/", c.list);
router.get("/unallocated", c.listUnallocated);
router.get("/allocations", c.allocations);

// Branded PDF receipt — must come before /:id
router.get("/:id/receipt.pdf", async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="receipt-${req.params.id}.pdf"`,
    );
    await receiptPdf.streamReceipt({ res, schoolId, paymentId: req.params.id });
  } catch (e) {
    console.error("[receipt-pdf]", e);
    if (!res.headersSent) return error(res, e.message || "Failed", 500);
    res.end();
  }
});

router.get("/:id", c.getById);
router.post("/", c.create);
router.post("/record", c.record);
router.post("/:id/reassign", c.reassign);
router.patch("/:id/void", c.voidPayment);

module.exports = router;
