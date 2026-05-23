const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");


const createPO = async (schoolId, data) => {
  const poId = uuidv4();
  const orderNumber = `PO-${Date.now()}`;

  await query(
    `INSERT INTO inventory_purchase_orders (id, school_id, supplier_id, order_number, order_date, expected_date, total_amount, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      poId,
      schoolId,
      data.supplier_id,
      orderNumber,
      new Date(),
      data.expected_date,
      data.total_amount,
      data.notes,
    ],
  );

  // Insert items (assuming data.items is an array)
  for (const item of data.items) {
    await query(
      `INSERT INTO inventory_po_items (id, po_id, item_id, quantity, unit_price, total_price) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        poId,
        item.item_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
      ],
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
  await query("UPDATE inventory_purchase_orders SET status = ? WHERE id = ?", [
    status,
    id,
  ]);
  return { id, status };
};

module.exports = {
  createSupplier,
  findAllSuppliers,
  createPO,
  findAllPOs,
  updatePOStatus,
};
