const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

// ============================================
// HELPERS
// ============================================

// Obtener categorías con sus subcategorías (árbol)
const getCategoriesTree = async () => {
  const categories = await Category.find({ parent: null, isActive: true }).sort({ name: 1 });
  const tree = await Promise.all(categories.map(async (cat) => {
    const subs = await Category.find({ parent: cat._id, isActive: true }).sort({ name: 1 });
    return { ...cat.toObject(), subcategories: subs };
  }));
  return tree;
};

// Normalizar producto: calcular finalPrice, asegurar números
const normalizeProduct = (p) => {
  const obj = p.toObject ? p.toObject() : { ...p };
  const customerPrice = obj.customerPrice || 0;
  const supplierPrice = obj.supplierPrice || 0;
  const discount = obj.discount || 0;
  const finalPrice = discount > 0
    ? parseFloat((customerPrice * (1 - discount / 100)).toFixed(2))
    : customerPrice;

  return {
    ...obj,
    customerPrice,
    supplierPrice,
    discount,
    finalPrice
  };
};

// ============================================
// LISTADO DE PRODUCTOS
// ============================================
exports.index = async (req, res) => {
  try {
    const query = req.query.q || '';
    const categoryFilter = req.query.category || '';
    const minPrice = req.query.min;
    const maxPrice = req.query.max;
    const sortBy = req.query.sort || 'recent';

    // -------- Construir filtro --------
    const filter = { isActive: true };

    if (query.trim()) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { model: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (categoryFilter) {
      const cat = await Category.findById(categoryFilter);
      if (cat) {
        if (cat.parent === null) {
          const subs = await Category.find({ parent: cat._id });
          const catIds = [cat._id, ...subs.map(s => s._id)];
          filter.category = { $in: catIds };
        } else {
          filter.subcategory = cat._id;
        }
      }
    }

    // Filtro por precio
    if (minPrice || maxPrice) {
      filter.customerPrice = {};
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min)) filter.customerPrice.$gte = min;
      if (!isNaN(max)) filter.customerPrice.$lte = max;
    }

    // -------- Ordenamiento --------
    let sortOptions = { createdAt: -1 };
    switch (sortBy) {
      case 'price-asc':  sortOptions = { customerPrice: 1 }; break;
      case 'price-desc': sortOptions = { customerPrice: -1 }; break;
      case 'name-asc':   sortOptions = { name: 1 }; break;
      case 'name-desc':  sortOptions = { name: -1 }; break;
      case 'recent':
      default:           sortOptions = { createdAt: -1 }; break;
    }

    // -------- Query --------
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('brand', 'name')
      .sort(sortOptions);

    // -------- Normalizar --------
    const normalizedProducts = products.map(normalizeProduct);

    // -------- Árbol de categorías --------
    const categoriesTree = await getCategoriesTree();

    // -------- Agrupar por categoría y subcategoría --------
    const grouped = {};
    normalizedProducts.forEach(p => {
      const catId = p.category ? p.category._id.toString() : 'sin-categoria';
      const subId = p.subcategory ? p.subcategory._id.toString() : 'sin-subcategoria';

      if (!grouped[catId]) {
        grouped[catId] = { category: p.category, subcategories: {} };
      }
      if (!grouped[catId].subcategories[subId]) {
        grouped[catId].subcategories[subId] = { subcategory: p.subcategory, products: [] };
      }
      grouped[catId].subcategories[subId].products.push(p);
    });

    // Ordenar productos dentro de cada subcategoría (por precio asc)
    Object.values(grouped).forEach(catGroup => {
      Object.values(catGroup.subcategories).forEach(subGroup => {
        subGroup.products.sort((a, b) => a.customerPrice - b.customerPrice);
      });
    });

    res.render('products/index', {
      title: 'Productos',
      grouped,
      categoriesTree,
      query,
      categoryFilter,
      minPrice,
      maxPrice,
      sortBy,
      products: normalizedProducts
    });
  } catch (error) {
    console.error('Error en index:', error);
    req.flash('error', 'Error al cargar productos: ' + error.message);
    res.redirect('/');
  }
};

// ============================================
// FORM CREAR PRODUCTO
// ============================================
exports.create = async (req, res) => {
  try {
    const categories = await Category.find({ parent: null, isActive: true }).sort({ name: 1 });
    const subcategories = await Category.find({ parent: { $ne: null }, isActive: true }).sort({ name: 1 });
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });

    res.render('products/create', {
      title: 'Nuevo Producto',
      categories,
      subcategories,
      brands,
      product: null
    });
  } catch (error) {
    req.flash('error', 'Error al cargar datos: ' + error.message);
    res.redirect('/products');
  }
};

// ============================================
// GUARDAR PRODUCTO
// ============================================
exports.store = async (req, res) => {
  try {
    const {
      name, model, image, category, subcategory, brand,
      supplierPrice, customerPrice, discount,
      description, techSheet, saveAndContinue
    } = req.body;

    await Product.create({
      name,
      model: model || '',
      image: image || '',
      category,
      subcategory: subcategory || null,
      brand: brand || null,
      supplierPrice: parseFloat(supplierPrice) || 0,
      customerPrice: parseFloat(customerPrice) || 0,
      discount: parseFloat(discount) || 0,
      description: description || '',
      techSheet: techSheet || '',
      isActive: true
    });

    req.flash('success', 'Producto creado correctamente');

    if (saveAndContinue) {
      res.redirect('/products/create');
    } else {
      res.redirect('/products');
    }
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'Ya existe un producto con ese nombre y modelo');
    } else {
      req.flash('error', 'Error al crear producto: ' + error.message);
    }
    res.redirect('/products/create');
  }
};

// ============================================
// FORM EDITAR PRODUCTO
// ============================================
exports.edit = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/products');
    }

    const categories = await Category.find({ parent: null, isActive: true }).sort({ name: 1 });
    const subcategories = await Category.find({ parent: { $ne: null }, isActive: true }).sort({ name: 1 });
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });

    res.render('products/edit', {
      title: 'Editar Producto',
      product,
      categories,
      subcategories,
      brands
    });
  } catch (error) {
    req.flash('error', 'Error al cargar producto: ' + error.message);
    res.redirect('/products');
  }
};

// ============================================
// ACTUALIZAR PRODUCTO (✅ CORREGIDO)
// ============================================
exports.update = async (req, res) => {
  try {
    const {
      name, model, image, category, subcategory, brand,   // ⬅️ AGREGADO brand
      supplierPrice, customerPrice, discount,
      description, techSheet, isActive
    } = req.body;

    await Product.findByIdAndUpdate(req.params.id, {
      name,
      model: model || '',
      image: image || '',
      category,
      subcategory: subcategory || null,
      brand: brand || null,                                // ⬅️ Ahora sí existe
      supplierPrice: parseFloat(supplierPrice) || 0,
      customerPrice: parseFloat(customerPrice) || 0,
      discount: parseFloat(discount) || 0,
      description: description || '',
      techSheet: techSheet || '',
      isActive: isActive === 'on'
    }, { new: true, runValidators: true });

    req.flash('success', 'Producto actualizado');
    res.redirect('/products');
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'Ya existe un producto con ese nombre y modelo');
    } else {
      req.flash('error', 'Error al actualizar: ' + error.message);
    }
    res.redirect(`/products/${req.params.id}/edit`);
  }
};

// ============================================
// ELIMINAR PRODUCTO
// ============================================
exports.destroy = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'Producto eliminado');
    res.redirect('/products');
  } catch (error) {
    req.flash('error', 'No se puede eliminar, puede estar en uso');
    res.redirect('/products');
  }
};

// ============================================
// DETALLE DE PRODUCTO
// ============================================
exports.detail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('brand', 'name');

    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/products');
    }

    // Normalizar con finalPrice
    const normalizedProduct = normalizeProduct(product);

    res.render('products/detail', {
      title: product.name,
      product: normalizedProduct
    });
  } catch (error) {
    req.flash('error', 'Error al cargar producto');
    res.redirect('/products');
  }
};

// ============================================
// API: Subcategorías por categoría
// ============================================
exports.getSubcategories = async (req, res) => {
  try {
    const subs = await Category.find({
      parent: req.params.categoryId,
      isActive: true
    }).sort({ name: 1 });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar subcategorías' });
  }
};



// ============================================
// DESCARGAR CATÁLOGO (HTML imprimible)
// ============================================
exports.downloadCatalog = async (req, res) => {
  try {
    const categoryFilter = req.query.category || '';

    // -------- Construir filtro --------
    const filter = { isActive: true };

    let categoryName = 'Todas las categorías';
    let categoryObj = null;

    if (categoryFilter) {
      const cat = await Category.findById(categoryFilter);
      if (cat) {
        categoryObj = cat;
        categoryName = cat.name;

        if (cat.parent === null) {
          // Categoría padre: incluir subcategorías
          const subs = await Category.find({ parent: cat._id });
          const catIds = [cat._id, ...subs.map(s => s._id)];
          filter.category = { $in: catIds };
        } else {
          // Subcategoría
          filter.subcategory = cat._id;
        }
      }
    }

    // -------- Query --------
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('brand', 'name')
      .sort({ category: 1, subcategory: 1, name: 1 });

    // -------- Normalizar --------
    const normalizedProducts = products.map(normalizeProduct);

    // -------- Agrupar por categoría → subcategoría --------
    const grouped = {};
    normalizedProducts.forEach(p => {
      const catId = p.category ? p.category._id.toString() : 'sin-categoria';
      const subId = p.subcategory ? p.subcategory._id.toString() : 'sin-subcategoria';

      if (!grouped[catId]) {
        grouped[catId] = { category: p.category, subcategories: {} };
      }
      if (!grouped[catId].subcategories[subId]) {
        grouped[catId].subcategories[subId] = { subcategory: p.subcategory, products: [] };
      }
      grouped[catId].subcategories[subId].products.push(p);
    });

    // -------- Render sin layout --------
    res.render('products/catalog', {
      title: 'Catálogo de Productos',
      grouped,
      categoryName,
      categoryObj,
      totalProducts: normalizedProducts.length,
      generatedAt: new Date(),
      layout: false   // ⚠️ sin layout para imprimir limpio
    });
  } catch (error) {
    console.error('Error al generar catálogo:', error);
    req.flash('error', 'Error al generar el catálogo: ' + error.message);
    res.redirect('/products');
  }
};


// ============================================
// API: BÚSQUEDA EN TIEMPO REAL
// ============================================
exports.searchProducts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q || q.length < 2) {
      return res.json({ products: [] });
    }

    const regex = new RegExp(q, 'i');

    // 1. Buscar categorías y marcas que coincidan con el término
    const matchingCategories = await Category.find({
      isActive: true,
      name: regex
    }).select('_id');

    const matchingBrands = await Brand.find({
      isActive: true,
      name: regex
    }).select('_id');

    const categoryIds = matchingCategories.map(c => c._id);
    const brandIds = matchingBrands.map(b => b._id);

    // 2. Construir condiciones de búsqueda
    const orConditions = [
      { name: regex },
      { model: regex },
      { description: regex }
    ];

    if (categoryIds.length > 0) {
      orConditions.push({ category: { $in: categoryIds } });
      orConditions.push({ subcategory: { $in: categoryIds } });
    }

    if (brandIds.length > 0) {
      orConditions.push({ brand: { $in: brandIds } });
    }

    // 3. Buscar productos
    const products = await Product.find({
      isActive: true,
      $or: orConditions
    })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // 4. Calcular finalPrice en cada resultado
    const normalizedProducts = products.map(p => {
      const customerPrice = p.customerPrice || 0;
      const discount = p.discount || 0;
      const finalPrice = discount > 0
        ? parseFloat((customerPrice * (1 - discount / 100)).toFixed(2))
        : customerPrice;

      return { ...p, customerPrice, finalPrice, discount };
    });

    res.json({ products: normalizedProducts });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ products: [], error: error.message });
  }
};