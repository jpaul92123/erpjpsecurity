const PublicOrder = require("../models/PublicOrder");
const Product = require("../models/Product");

// ============================================
// GET /checkout → Mostrar formulario
// ============================================
exports.getCheckout = (req, res) => {
  res.render("checkout/index", {
    title: "Finalizar Compra",
    user: req.session.user || null,
  });
};

// ============================================
// POST /checkout → Guardar pedido
// ============================================
exports.postCheckout = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerDistrict,
      customerReference,
      paymentMethod,
      paymentReference,
      notes,
      cartData, // JSON string con los items del carrito
    } = req.body;

    // -------- Validaciones básicas --------
    if (
      !customerName ||
      !customerPhone ||
      !customerAddress ||
      !customerDistrict
    ) {
      req.flash("error", "Por favor completa todos los campos obligatorios");
      return res.redirect("/checkout");
    }

    if (!paymentMethod) {
      req.flash("error", "Selecciona un modo de pago");
      return res.redirect("/checkout");
    }

    // -------- Parsear carrito --------
    let cart = [];
    try {
      cart = JSON.parse(cartData);
    } catch (e) {
      req.flash("error", "Error al leer el carrito");
      return res.redirect("/checkout");
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      req.flash("error", "Tu carrito está vacío");
      return res.redirect("/products");
    }

    // -------- Validar productos y recalcular precios (server-side) --------
    const items = [];
    let subtotal = 0;

    for (const item of cart) {
      // Validar ObjectId
      if (!item.id || !item.id.match(/^[a-f\d]{24}$/i)) continue;

      const product = await Product.findById(item.id);
      if (!product || !product.isActive) continue;

      // Calcular precio final (con descuento aplicado)
      const customerPrice = product.customerPrice || 0;
      const discount = product.discount || 0;
      const finalPrice =
        discount > 0
          ? parseFloat((customerPrice * (1 - discount / 100)).toFixed(2))
          : customerPrice;

      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      const itemSubtotal = parseFloat((finalPrice * qty).toFixed(2));

      items.push({
        product: product._id,
        name: product.name,
        image: product.image || "",
        price: finalPrice,
        qty: qty,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    if (items.length === 0) {
      req.flash("error", "Los productos en tu carrito ya no están disponibles");
      return res.redirect("/products");
    }

    // -------- Calcular totales --------
    subtotal = parseFloat(subtotal.toFixed(2));
    const shipping = 0; // Envío gratis
    const total = parseFloat((subtotal + shipping).toFixed(2));

    // -------- Generar número de pedido --------
    const orderNumber = await PublicOrder.generateOrderNumber();

    // -------- Crear pedido --------
    const order = await PublicOrder.create({
      orderNumber,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail ? customerEmail.trim() : "",
        address: customerAddress.trim(),
        district: customerDistrict.trim(),
        reference: customerReference ? customerReference.trim() : "",
      },
      paymentMethod,
      paymentReference: paymentReference ? paymentReference.trim() : "",
      items,
      subtotal,
      shipping,
      total,
      notes: notes ? notes.trim() : "",
      status: "pendiente",
      user: req.session.user ? req.session.user._id : null,
    });

    // -------- Redirigir a la vista de éxito --------
    res.redirect(`/checkout/success/${order._id}`);
  } catch (error) {
    console.error("Error al crear pedido:", error);
    req.flash("error", "Error al procesar el pedido: " + error.message);
    res.redirect("/checkout");
  }
};

// ============================================
// GET /checkout/success/:id → Confirmación
// ============================================
exports.getSuccess = async (req, res) => {
  try {
    const order = await PublicOrder.findById(req.params.id).populate(
      "items.product",
      "name image",
    );

    if (!order) {
      req.flash("error", "Pedido no encontrado");
      return res.redirect("/");
    }

    res.render("checkout/success", {
      title: "Pedido Confirmado - " + order.orderNumber,
      order,
      user: req.session.user || null,
      layout: false, // vista imprimible sin navbar
    });
  } catch (error) {
    console.error("Error al cargar pedido:", error);
    req.flash("error", "Error al cargar el pedido");
    res.redirect("/");
  }
};
// ============================================
// GET /checkout/track → Formulario de seguimiento
// ============================================
exports.getTrack = (req, res) => {
  res.render("checkout/track", {
    title: "Seguimiento de Pedido",
    order: null,
    error: null,
    user: req.session.user || null,
  });
};

// ============================================
// POST /checkout/track → Buscar pedido
// ============================================
exports.postTrack = async (req, res) => {
  try {
    const orderNumber = (req.body.orderNumber || "").trim().toUpperCase();

    if (!orderNumber) {
      return res.render("checkout/track", {
        title: "Seguimiento de Pedido",
        order: null,
        error: "Ingresa un número de pedido",
        user: req.session.user || null,
      });
    }

    const order = await PublicOrder.findOne({ orderNumber })
      .populate("items.product", "name image")
      .lean();

    if (!order) {
      return res.render("checkout/track", {
        title: "Seguimiento de Pedido",
        order: null,
        error: "No se encontró ningún pedido con ese número",
        user: req.session.user || null,
      });
    }

    res.render("checkout/track", {
      title: "Pedido " + order.orderNumber,
      order,
      error: null,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error("Error en tracking:", error);
    res.render("checkout/track", {
      title: "Seguimiento de Pedido",
      order: null,
      error: "Error al buscar el pedido",
      user: req.session.user || null,
    });
  }
};
