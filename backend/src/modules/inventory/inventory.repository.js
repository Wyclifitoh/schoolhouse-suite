const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// Items
const findAllItems = async (
  schoolId,
  { limit, offset, search, categoryId },
) => {
  let sql =
    "SELECT i.*, c.name as category_name FROM inventory_items i LEFT JOIN inventory_categories c ON c.id = i.category_id WHERE i.school_id = ?";
  const params = [schoolId];
  if (search) {
    sql += " AND (i.name LIKE ? OR i.sku LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s);
  }
  if (categoryId) {
    sql += " AND i.category_id = ?";
    params.push(categoryId);
  }
  sql += " ORDER BY i.name ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const countSql = sql
    .replace(/SELECT .+? FROM/, "SELECT COUNT(*) as count FROM")
    .replace(/ORDER BY .+$/, "");
  const [rows, countRows] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);
  return { rows, total: countRows[0]?.count || 0 };
};

const findItemById = async (id, schoolId) => {
  return queryOne(
    "SELECT * FROM inventory_items WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
};

const createItem = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO inventory_items (id, school_id, name, sku, description, category_id, cost_price, selling_price, quantity_in_stock, reorder_level, unit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.name,
      data.sku,
      data.description || null,
      data.category_id || null,
      data.cost_price || 0,
      data.selling_price || 0,
      data.quantity_in_stock || 0,
      data.reorder_level || 10,
      data.unit || null,
    ],
  );
  return queryOne("SELECT * FROM inventory_items WHERE id = ?", [id]);
};

const updateItemQuantity = async (id, schoolId, quantityChange) => {
  await query(
    "UPDATE inventory_items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ? AND school_id = ?",
    [quantityChange, id, schoolId],
  );
  return queryOne("SELECT * FROM inventory_items WHERE id = ?", [id]);
};

// Categories
const findAllCategories = async (schoolId) => {
  return query(
    "SELECT * FROM inventory_categories WHERE school_id = ? ORDER BY name ASC",
    [schoolId],
  );
};

const createCategory = async (data) => {
  const id = uuidv4();
  await query(
    "INSERT INTO inventory_categories (id, school_id, name, description) VALUES (?, ?, ?, ?)",
    [id, data.school_id, data.name, data.description || null],
  );
  return queryOne("SELECT * FROM inventory_categories WHERE id = ?", [id]);
};

// Transactions (sales, purchases)
const findTransactions = async (schoolId, { limit, offset, type }) => {
  let sql =
    "SELECT t.*, i.name as item_name, i.sku FROM inventory_transactions t JOIN inventory_items i ON i.id = t.item_id WHERE t.school_id = ?";
  const params = [schoolId];
  if (type) {
    sql += " AND t.type = ?";
    params.push(type);
  }
  sql += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  return query(sql, params);
};

const createTransaction = async (data) => {
  const targetStudentId =
    data.type === "sale" ? (data.student_id ?? "walk-in") : null;

  if (data.items && Array.isArray(data.items)) {
    const results = [];

    for (const item of data.items) {
      const id = uuidv4();
      const qtyChange = data.type === "sale" ? -item.quantity : item.quantity;

      await query(
        `INSERT INTO inventory_transactions (
          id, school_id, student_id, item_id, type, quantity, 
          unit_price, total_amount, reference_type, reference_id, 
          notes, recorded_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.school_id ?? null,
          targetStudentId,
          item.item_id ?? null,
          data.type ?? null,
          item.quantity ?? null,
          item.unit_price ?? null,
          item.total_amount ?? null,
          data.reference_type ?? null,
          data.reference_id ?? null,
          data.notes ?? null,
          data.recorded_by ?? null,
        ],
      );

      await query(
        "UPDATE inventory_items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?",
        [qtyChange, item.item_id],
      );

      const createdTx = await queryOne(
        "SELECT * FROM inventory_transactions WHERE id = ?",
        [id],
      );
      results.push(createdTx);
    }

    return results;
  }

  const id = uuidv4();
  const qtyChange = data.type === "sale" ? -data.quantity : data.quantity;

  await query(
    `INSERT INTO inventory_transactions (id, school_id, student_id, item_id, type, quantity, unit_price, total_amount, reference_type, reference_id, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id ?? null,
      targetStudentId,
      data.item_id ?? null,
      data.type ?? null,
      data.quantity ?? null,
      data.unit_price ?? null,
      data.total_amount ?? null,
      data.reference_type ?? null,
      data.reference_id ?? null,
      data.notes ?? null,
      data.recorded_by ?? null,
    ],
  );

  await query(
    "UPDATE inventory_items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?",
    [qtyChange, data.item_id],
  );

  return queryOne("SELECT * FROM inventory_transactions WHERE id = ?", [id]);
};

const createSupplier = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO inventory_suppliers (id, school_id, name, contact_person, phone, email, location) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.name ?? null,
      data.contact_person ?? null,
      data.phone ?? null,
      data.email ?? null,
      data.location ?? null,
    ],
  );
  return { id, ...data };
};

const findAllSuppliers = (schoolId) =>
  query(
    "SELECT * FROM inventory_suppliers WHERE school_id = ? ORDER BY name ASC",
    [schoolId],
  );

const editPO = async (poId, schoolId, data) => {
  const totalAmount =
    data.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0) +
    Number(data.shipping_cost || 0) -
    Number(data.discount_amount || 0);

  await query(
    `UPDATE inventory_purchase_orders 
     SET supplier_id = ?, shipping_cost = ?, discount_amount = ?, total_amount = ?, notes = ?
     WHERE id = ? AND school_id = ?`,
    [
      data.supplier_id,
      data.shipping_cost || 0,
      data.discount_amount || 0,
      totalAmount,
      data.notes,
      poId,
      schoolId,
    ],
  );

  await query("DELETE FROM inventory_po_items WHERE po_id = ?", [poId]);

  for (const item of data.items) {
    await query(
      `INSERT INTO inventory_po_items (id, po_id, item_id, quantity, unit_price, total_price) 
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [
        poId,
        item.item_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
      ],
    );
  }

  return { id: poId, total_amount: totalAmount };
};

const createPO = async (schoolId, data) => {
  const poId = uuidv4();
  const orderNumber = `PO-${Date.now()}`;

  await query(
    `INSERT INTO inventory_purchase_orders (id, school_id, supplier_id, order_number, order_date, expected_date, total_amount, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    cleanValues([
      poId,
      schoolId,
      data.supplier_id,
      orderNumber,
      new Date(),
      data.expected_date,
      data.total_amount,
      data.notes,
    ]),
  );

  for (const item of data.items) {
    await query(
      `INSERT INTO inventory_po_items (id, po_id, item_id, quantity, unit_price, total_price) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      cleanValues([
        uuidv4(),
        poId,
        item.item_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
      ]),
    );
  }
  return { id: poId, order_number: orderNumber };
};

const findAllPOs = (schoolId) =>
  query(
    `SELECT po.*, s.name as supplier_name 
     FROM inventory_purchase_orders po 
     JOIN inventory_suppliers s ON po.supplier_id = s.id 
     WHERE po.school_id = ? ORDER BY po.created_at DESC`,
    [schoolId],
  );

const updatePOStatus = async (id, status) => {
  const currentPO = await queryOne(
    "SELECT status FROM inventory_purchase_orders WHERE id = ?",
    [id],
  );

  if (!currentPO) throw new Error("Purchase Order not found");

  if (currentPO.status === "delivered") {
    throw new Error("Cannot change status of a delivered order.");
  }

  await query("UPDATE inventory_purchase_orders SET status = ? WHERE id = ?", [
    status,
    id,
  ]);

  if (status === "delivered") {
    const poItems = await query(
      "SELECT item_id, quantity FROM inventory_po_items WHERE po_id = ?",
      [id],
    );

    for (const line of poItems) {
      await query(
        `UPDATE inventory_items 
         SET quantity_in_stock = quantity_in_stock + ? 
         WHERE id = ?`,
        [line.quantity, line.item_id],
      );

      await query(
        `INSERT INTO inventory_transactions 
         (id, school_id, item_id, type, quantity, reference_type, reference_id, notes)
         VALUES (UUID(), (SELECT school_id FROM inventory_purchase_orders WHERE id = ?), ?, 'purchase', ?, 'purchase_order', ?, 'Stock received from PO')`,
        [id, line.item_id, line.quantity, id],
      );
    }
  }

  return { id, status };
};

const findPOById = async (id, schoolId) => {
  return queryOne(
    `SELECT po.*, s.name as supplier_name 
     FROM inventory_purchase_orders po 
     JOIN inventory_suppliers s ON po.supplier_id = s.id 
     WHERE po.id = ? AND po.school_id = ?`,
    [id, schoolId],
  );
};

const findPOItems = async (poId) => {
  return query(
    `SELECT poi.*, i.name as item_name, i.sku 
     FROM inventory_po_items poi
     JOIN inventory_items i ON poi.item_id = i.id
     WHERE poi.po_id = ?`,
    [poId],
  );
  (`INSERT INTO inventory_transactions (id, school_id, item_id, type, quantity, unit_price, total_amount, reference_type, reference_id, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.item_id,
      data.type,
      data.quantity,
      data.unit_price || null,
      data.total_amount || null,
      data.reference_type || null,
      data.reference_id || null,
      data.notes || null,
      data.recorded_by || null,
    ]);
  // Update stock
  const qtyChange = data.type === "sale" ? -data.quantity : data.quantity;
  await query(
    "UPDATE inventory_items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?",
    [qtyChange, data.item_id],
  );
  return queryOne("SELECT * FROM inventory_transactions WHERE id = ?", [id]);
};

module.exports = {
  findAllItems,
  findItemById,
  createItem,
  updateItemQuantity,
  findAllCategories,
  createCategory,
  findTransactions,
  createTransaction,
};
