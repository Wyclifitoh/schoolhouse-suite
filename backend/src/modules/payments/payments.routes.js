const router = require("express").Router();
const c = require("./payments.controller");
const receiptPdf = require("../finance/receipt-pdf.service");
const { error } = require("../../utils/response");
const { requirePermission } = require("../../middlewares/role.middleware");

router.get("/", c.list);
router.get("/stats", c.getStats);
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
router.post("/", requirePermission("payments:create"), c.create);
router.post("/record", requirePermission("payments:create"), c.record);
router.post(
  "/bulk-void",
  requirePermission("payments:delete"),
  c.bulkVoidPayments,
);
router.post("/:id/reassign", requirePermission("payments:update"), c.reassign);
router.patch("/:id/void", requirePermission("payments:delete"), c.voidPayment);
router.post(
  "/:id/revert",
  requirePermission("payments:reverse"),
  c.revertPayment,
);
router.post(
  "/:id/transfer",
  requirePermission("payments:update"),
  c.transferPayment,
);

module.exports = router;
