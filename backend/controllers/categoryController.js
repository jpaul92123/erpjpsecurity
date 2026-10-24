const Category = require('../models/Category');

// ==================== CATEGORÍAS (PADRE) ====================

exports.index = async (req, res) => {
  try {
    const categories = await Category.find({ parent: null }).sort({ name: 1 });
    const categoriesWithSubs = await Promise.all(categories.map(async (cat) => {
      const subcategories = await Category.find({ parent: cat._id }).sort({ name: 1 });
      return { ...cat.toObject(), subcategories };
    }));
    res.render('categories/index', { title: 'Categorías', categories: categoriesWithSubs });
  } catch (error) {
    req.flash('error', 'Error al cargar categorías');
    res.redirect('/');
  }
};
exports.create = (req, res) => {
  res.render('categories/create', { 
    title: 'Nueva Categoría', 
    category: null, 
    isSubcategory: false,
    parentCategory: null
  });
};

exports.store = async (req, res) => {
  try {
    const { name, description, image, parent } = req.body;
    await Category.create({ 
      name, 
      description: description || '', 
      image: image || '', 
      parent: parent || null 
    });
    req.flash('success', 'Categoría creada correctamente');
    res.redirect('/categories');
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'Ya existe una categoría con ese nombre en el mismo nivel');
    } else {
      req.flash('error', 'Error al crear categoría');
    }
    res.redirect('/categories/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Categoría no encontrada');
      return res.redirect('/categories');
    }
    const isSubcategory = category.parent !== null && category.parent !== undefined;
    let parents = [];
    if (isSubcategory) {
      // Obtener categorías padre (excluyendo la misma)
      parents = await Category.find({ parent: null, _id: { $ne: category._id } }).sort({ name: 1 });
    }
    res.render('categories/edit', {
      title: isSubcategory ? 'Editar Subcategoría' : 'Editar Categoría',
      category,
      isSubcategory,
      parents
    });
  } catch (error) {
    req.flash('error', 'Error al cargar categoría');
    res.redirect('/categories');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, image, parent, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Categoría no encontrada');
      return res.redirect('/categories');
    }

    // Preparar datos a actualizar
    const updateData = {
      name,
      description: description || '',
      isActive: isActive === 'on'
    };

    // Si se envía imagen, actualizar; si no, conservar la actual
    if (image !== undefined && image !== '') {
      updateData.image = image;
    } else {
      // Si no se envía imagen y es una subcategoría, conservar la imagen existente (si la tiene)
      // pero si se envía vacío explícitamente (para borrar), permitirlo
      if (image === '') {
        updateData.image = '';
      } else {
        // No modificar la imagen
        updateData.image = category.image;
      }
    }

    // Manejar el padre (para subcategorías)
    if (parent !== undefined) {
      updateData.parent = parent || null;
    }

    await Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    req.flash('success', 'Categoría actualizada correctamente');
    res.redirect('/categories');
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'Ya existe una categoría con ese nombre en el mismo nivel');
    } else {
      req.flash('error', 'Error al actualizar: ' + error.message);
    }
    res.redirect(`/categories/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const subcategories = await Category.find({ parent: req.params.id });
    if (subcategories.length > 0) {
      req.flash('error', 'No se puede eliminar porque tiene subcategorías asociadas');
      return res.redirect('/categories');
    }
    await Category.findByIdAndDelete(req.params.id);
    req.flash('success', 'Categoría eliminada');
    res.redirect('/categories');
  } catch (error) {
    req.flash('error', 'No se puede eliminar, puede estar en uso');
    res.redirect('/categories');
  }
};

// ==================== SUBCATEGORÍAS ====================

exports.createSubcategory = async (req, res) => {
  try {
    const parentCategory = await Category.findById(req.params.parentId);
    if (!parentCategory) {
      req.flash('error', 'Categoría padre no encontrada');
      return res.redirect('/categories');
    }
    res.render('categories/create', {
      title: 'Nueva Subcategoría',
      category: null,
      isSubcategory: true,
      parentCategory
    });
  } catch (error) {
    req.flash('error', 'Error al cargar datos');
    res.redirect('/categories');
  }
};

exports.getParents = async (req, res) => {
  try {
    const parents = await Category.find({ parent: null }).sort({ name: 1 });
    res.json(parents);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías padre' });
  }
};