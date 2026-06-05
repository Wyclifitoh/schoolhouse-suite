const router = require("express").Router();
const repo = require("./expenses.repository");
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

module.exports = router;
