const router = require("express").Router();
const repo = require("./expenses.repository");
const petty = require("./petty-cash.repository");
const { success, error } = require("../../utils/response");

const handle = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    console.error("[expenses]", err);
    return error(res, err.message, err.statusCode || 500);
  }
};

// Categories
router.get(
  "/categories",
  handle(async (req, res) =>
    success(res, await repo.listCategories(req.schoolId)),
  ),
);
router.post(
  "/categories",
  handle(async (req, res) =>
    success(
      res,
      await repo.createCategory({ ...req.body, school_id: req.schoolId }),
      201,
    ),
  ),
);
router.put(
  "/categories/:id",
  handle(async (req, res) =>
    success(
      res,
      await repo.updateCategory(req.params.id, req.schoolId, req.body),
    ),
  ),
);
router.delete(
  "/categories/:id",
  handle(async (req, res) =>
    success(res, await repo.deleteCategory(req.params.id, req.schoolId)),
  ),
);

// Expenses
router.get(
  "/",
  handle(async (req, res) =>
    success(res, await repo.listExpenses(req.schoolId, req.query)),
  ),
);
router.get(
  "/:id",
  handle(async (req, res) =>
    success(res, await repo.getExpense(req.params.id, req.schoolId)),
  ),
);
router.post(
  "/",
  handle(async (req, res) =>
    success(
      res,
      await repo.createExpense({
        ...req.body,
        school_id: req.schoolId,
        recorded_by: req.user?.id || null,
      }),
      201,
    ),
  ),
);
router.post(
  "/bulk-import",
  handle(async (req, res) =>
    success(
      res,
      await repo.bulkImport(
        req.schoolId,
        req.body.rows || req.body.expenses || [],
        req.user?.id || null,
      ),
      201,
    ),
  ),
);
router.put(
  "/:id",
  handle(async (req, res) =>
    success(
      res,
      await repo.updateExpense(req.params.id, req.schoolId, req.body),
    ),
  ),
);
router.patch(
  "/:id/status",
  handle(async (req, res) =>
    success(
      res,
      await repo.updateStatus(
        req.params.id,
        req.schoolId,
        req.body.status,
        req.user?.id,
      ),
    ),
  ),
);
router.delete(
  "/:id",
  handle(async (req, res) =>
    success(res, await repo.deleteExpense(req.params.id, req.schoolId)),
  ),
);

// ───── Petty Cash ─────
router.get(
  "/petty-cash/accounts",
  handle(async (req, res) => success(res, await petty.listAccounts(req.schoolId))),
);
router.post(
  "/petty-cash/accounts",
  handle(async (req, res) =>
    success(res, await petty.createAccount({ ...req.body, school_id: req.schoolId }), 201),
  ),
);
router.put(
  "/petty-cash/accounts/:id",
  handle(async (req, res) =>
    success(res, await petty.updateAccount(req.params.id, req.schoolId, req.body)),
  ),
);
router.delete(
  "/petty-cash/accounts/:id",
  handle(async (req, res) =>
    success(res, await petty.deleteAccount(req.params.id, req.schoolId)),
  ),
);
router.get(
  "/petty-cash/transactions",
  handle(async (req, res) =>
    success(res, await petty.listTransactions(req.schoolId, req.query)),
  ),
);
router.post(
  "/petty-cash/transactions",
  handle(async (req, res) =>
    success(
      res,
      await petty.recordTransaction({
        ...req.body,
        school_id: req.schoolId,
        performed_by: req.user?.id || null,
      }),
      201,
    ),
  ),
);

module.exports = router;
