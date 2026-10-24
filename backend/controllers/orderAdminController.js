const PublicOrder = require("../models/PublicOrder");

// ============================================
// LISTADO DE PEDIDOS (con filtros)
// ============================================
exports.index = async (req, res) => {
  try {
    const status = req.query.status || "";
    const search = req.query.q || "";
    const dateFrom = req.query.from || "";
    const dateTo = req.query.to || "";

    // -------- Construir filtro --------
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { orderNumber: regex },
        { "customer.name": regex },
        { "customer.phone": regex },
        { "customer.email": regex },
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    // -------- Query --------
    const orders = await PublicOrder.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // -------- Estadísticas --------
    const stats = {
      total: await PublicOrder.countDocuments(),
      pendientes: await PublicOrder.countDocuments({ status: "pendiente" }),
      confirmados: await PublicOrder.countDocuments({ status: "confirmado" }),
      enviados: await PublicOrder.countDocuments({ status: "enviado" }),
      entregados: await PublicOrder.countDocuments({ status: "entregado" }),
      cancelados: await PublicOrder.countDocuments({ status: "cancelado" }),
      ventasTotales: await PublicOrder.aggregate([
        { $match: { status: { $ne: "cancelado" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]).then((r) => r[0]?.total || 0),
    };

    res.render("orders/index", {
      title: "Pedidos",
      orders,
      stats,
      filters: { status, search, dateFrom, dateTo },
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error al listar pedidos:", error);
    req.flash("error", "Error al cargar los pedidos: " + error.message);
    res.redirect("/");
  }
};

// ============================================
// DETALLE DE PEDIDO
// ============================================
exports.detail = async (req, res) => {
  try {
    const order = await PublicOrder.findById(req.params.id)
      .populate("items.product", "name image customerPrice")
      .populate("user", "name email");

    if (!order) {
      req.flash("error", "Pedido no encontrado");
      return res.redirect("/orders");
    }

    res.render("orders/detail", {
      title: "Pedido " + order.orderNumber,
      order,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error al cargar pedido:", error);
    req.flash("error", "Error al cargar el pedido");
    res.redirect("/orders");
  }
};

// ============================================
// CAMBIAR ESTADO
// ============================================
// ============================================
// CAMBIAR ESTADO
// ============================================
exports.updateStatus = async (req, res) => {
  try {
    const { status, markAsPaid } = req.body;
    const validStatuses = [
      "pendiente",
      "confirmado",
      "enviado",
      "entregado",
      "cancelado",
    ];

    if (!validStatuses.includes(status)) {
      req.flash("error", "Estado inválido");
      return res.redirect("/orders/" + req.params.id);
    }

    const order = await PublicOrder.findById(req.params.id);
    if (!order) {
      req.flash("error", "Pedido no encontrado");
      return res.redirect("/orders");
    }

    // 🚫 Si ya está pagado, no permitir cambios
    if (order.paid) {
      req.flash(
        "error",
        "Este pedido ya fue marcado como pagado. No se puede modificar.",
      );
      return res.redirect("/orders/" + req.params.id);
    }

    // Actualizar estado
    order.status = status;

    // Registrar en historial
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.session.user ? req.session.user._id : null,
      note: "Estado actualizado desde el panel admin",
    });

    // Si se marca como pagado y el estado es entregado
    if (markAsPaid === "on" && status === "entregado") {
      order.paid = true;
      order.paidAt = new Date();
    }

    await order.save();

    req.flash(
      "success",
      "Estado actualizado a: " + status + (order.paid ? " (PAGADO)" : ""),
    );
    res.redirect("/orders/" + req.params.id);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    req.flash("error", "Error al actualizar el estado");
    res.redirect("/orders");
  }
};

// ============================================
// ELIMINAR PEDIDO
// ============================================
exports.destroy = async (req, res) => {
  try {
    await PublicOrder.findByIdAndDelete(req.params.id);
    req.flash("success", "Pedido eliminado");
    res.redirect("/orders");
  } catch (error) {
    req.flash("error", "Error al eliminar el pedido");
    res.redirect("/orders");
  }
};
