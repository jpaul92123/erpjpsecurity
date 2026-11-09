// ============================================================
// app.js
// ============================================================
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');

// ============================================================
// MODELOS
// ============================================================
const User = require('./models/User');
const Client = require('./models/Client');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const StockMovement = require('./models/StockMovement');
const Quotation = require('./models/Quotation');
const Order = require('./models/Order');
const Sale = require('./models/Sale');
const Voucher = require('./models/Voucher');
const Installation = require('./models/Installation');
const Maintenance = require('./models/Maintenance');
const Visit = require('./models/Visit');
const WorkOrder = require('./models/WorkOrder');
const Project = require('./models/Project');
const Supplier = require('./models/Supplier');
const Setting = require('./models/Setting');
const PublicOrder = require('./models/PublicOrder');

// ============================================================
// RUTAS (todas agrupadas en index.js)
// ============================================================
const routes = require('./routes/index');

const app = express();

// ============================================================
// CONEXIÓN A BD
// ============================================================
connectDB();

// ============================================================
// CONFIGURACIÓN DE VISTAS (Pug)
// ============================================================
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../frontend/views'));

// ============================================================
// MIDDLEWARES
// ============================================================

app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ============================================================
// SESIÓN
// ============================================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'mi_clave_por_defecto',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_jpsecurity'
  }),
  cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }
}));

// ============================================================
// FLASH MESSAGES
// ============================================================
app.use(flash());

// ============================================================
// VARIABLES GLOBALES PARA TODAS LAS VISTAS
// ============================================================
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  try {
    res.locals.setting = await Setting.getGlobal();
  } catch (err) {
    console.error('Error al cargar la configuración global:', err);
    res.locals.setting = null;
  }
  next();
});

// ============================================================
// MONTAJE DE TODAS LAS RUTAS
// ============================================================
app.use('/', routes);

// ============================================================
// RUTA RAÍZ (dashboard o landing)
// ============================================================
app.get('/', async (req, res) => {
  if (req.session.user) {
    // ============ USUARIO LOGUEADO → DASHBOARD ============
    try {
      const totalUsers = await User.countDocuments();
      const totalClients = await Client.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalMovements = await StockMovement.countDocuments();
      const totalQuotations = await Quotation.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalSales = await Sale.countDocuments();
      const totalVouchers = await Voucher.countDocuments();
      const totalInstallations = await Installation.countDocuments();
      const totalMaintenances = await Maintenance.countDocuments();
      const totalVisits = await Visit.countDocuments();
      const totalWorkOrders = await WorkOrder.countDocuments();
      const totalProjects = await Project.countDocuments();
      const totalSuppliers = await Supplier.countDocuments();
      const totalBrands = await Brand.countDocuments();

      const brands = await Brand.find({ isActive: true })
        .select('name logo')
        .sort({ name: 1 })
        .limit(20)
        .lean();

      const pendingOrders = await PublicOrder.find({ status: 'pendiente' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const pendingOrdersCount = await PublicOrder.countDocuments({ status: 'pendiente' });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todaySales = await PublicOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart },
            status: { $ne: 'cancelado' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
            count: { $sum: 1 }
          }
        }
      ]).then(r => r[0] || { total: 0, count: 0 });

      res.render('dashboard/index', {
        title: 'Dashboard',
        totalUsers,
        totalClients,
        totalProducts,
        totalMovements,
        totalQuotations,
        totalOrders,
        totalSales,
        totalVouchers,
        totalInstallations,
        totalMaintenances,
        totalVisits,
        totalWorkOrders,
        totalProjects,
        totalSuppliers,
        totalBrands,
        brands,
        pendingOrders,
        pendingOrdersCount,
        todaySalesTotal: todaySales.total || 0,
        todaySalesCount: todaySales.count || 0,
        user: req.session.user
      });
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      res.render('dashboard/index', {
        title: 'Dashboard',
        totalUsers: 0,
        totalClients: 0,
        totalProducts: 0,
        totalMovements: 0,
        totalQuotations: 0,
        totalOrders: 0,
        totalSales: 0,
        totalVouchers: 0,
        totalInstallations: 0,
        totalMaintenances: 0,
        totalVisits: 0,
        totalWorkOrders: 0,
        totalProjects: 0,
        totalSuppliers: 0,
        totalBrands: 0,
        brands: [],
        pendingOrders: [],
        pendingOrdersCount: 0,
        todaySalesTotal: 0,
        todaySalesCount: 0,
        user: req.session.user
      });
    }
  } else {
    // ============ USUARIO NO LOGUEADO → LANDING ============
    try {
      const categories = await Category.find({ parent: null, isActive: true }).sort({ name: 1 });
      const categoriesWithSubs = await Promise.all(categories.map(async (cat) => {
        const subs = await Category.find({ parent: cat._id, isActive: true }).sort({ name: 1 });
        return { ...cat.toObject(), subcategories: subs };
      }));

      const latestProducts = await Product.find({ isActive: true })
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .sort({ createdAt: -1 })
        .limit(8);

      // ✅ AGREGADO: Consultar marcas activas para el carrusel
      const brands = await Brand.find({ isActive: true })
        .select('name logo')
        .sort({ name: 1 })
        .limit(20)
        .lean();

      console.log('🏷️ Marcas para landing:', brands.length);

      const setting = await Setting.getGlobal();

      res.render('public/index', {
        title: (setting?.siteName || 'JP Security') + ' - ' + (setting?.siteTagline || 'Soluciones en Seguridad'),
        setting,
        categories: categoriesWithSubs,
        latestProducts,
        brands,   // ⬅️ AGREGADO
        user: null
      });
    } catch (error) {
      console.error('Error al cargar datos para la landing:', error);
      res.render('public/index', {
        title: 'JP Security - Soluciones en Seguridad',
        setting: null,
        categories: [],
        latestProducts: [],
        brands: [],   // ⬅️ AGREGADO
        user: null
      });
    }
  }
});

// ============================================================
// RUTA LANDING (accesible siempre)
// ============================================================
app.get('/landing', async (req, res) => {
  try {
    const categories = await Category.find({ parent: null, isActive: true }).sort({ name: 1 });
    const categoriesWithSubs = await Promise.all(categories.map(async (cat) => {
      const subs = await Category.find({ parent: cat._id, isActive: true }).sort({ name: 1 });
      return { ...cat.toObject(), subcategories: subs };
    }));

    const latestProducts = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 })
      .limit(8);

    // ✅ AGREGADO: Consultar marcas activas
    const brands = await Brand.find({ isActive: true })
      .select('name logo')
      .sort({ name: 1 })
      .limit(20)
      .lean();

    console.log('🏷️ Marcas para /landing:', brands.length);

    const setting = await Setting.getGlobal();

    res.render('public/index', {
      title: (setting?.siteName || 'JP Security') + ' - ' + (setting?.siteTagline || 'Soluciones en Seguridad'),
      setting,
      categories: categoriesWithSubs,
      latestProducts,
      brands,   // ⬅️ AGREGADO
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error al cargar datos para landing:', error);
    res.render('public/index', {
      title: 'JP Security - Soluciones en Seguridad',
      setting: null,
      categories: [],
      latestProducts: [],
      brands: [],   // ⬅️ AGREGADO
      user: req.session.user || null
    });
  }
});

// ============================================================
// MANEJO 404
// ============================================================
app.use((req, res) => {
  res.status(404).render('error/404', {
    title: 'Página no encontrada',
    setting: res.locals.setting || null,
    user: req.session.user || null
  });
});

// ============================================================
// MANEJO DE ERRORES GLOBAL
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    req.flash('error', 'El archivo es demasiado grande (máximo 2MB)');
    return res.redirect('back');
  }

  if (err.message && err.message.includes('Solo se permiten imágenes')) {
    req.flash('error', err.message);
    return res.redirect('back');
  }

  res.status(500).render('error/500', {
    title: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {},
    setting: res.locals.setting || null,
    user: req.session.user || null
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════');
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Archivos estáticos: ${path.join(__dirname, '../frontend/public')}`);
  console.log('═══════════════════════════════════════════════');
});