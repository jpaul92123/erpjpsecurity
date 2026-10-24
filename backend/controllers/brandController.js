// ============================================================
// controllers/brandController.js
// ============================================================
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// ============================================================
// Helper: eliminar imagen
// ============================================================
function deleteImage(imagePath) {
  if (!imagePath) return;
  if (imagePath.includes('default')) return;

  // ✅ RUTA CORRECTA: backend/../frontend/public/uploads/...
  const fullPath = path.join(__dirname, '..', '..', 'frontend', 'public', imagePath);

  console.log('🔍 Intentando eliminar:', fullPath);

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log('🗑️ Imagen eliminada:', imagePath);
    } catch (err) {
      console.error('❌ Error al eliminar imagen:', err);
    }
  } else {
    console.log('⚠️ Imagen no encontrada en disco:', fullPath);
  }
}

// ============================================================
// LISTADO
// ============================================================
exports.index = async (req, res) => {
  try {
    console.log('📊 [brandController.index] Cargando marcas...');

    const brands = await Brand.find()
      .sort({ name: 1 })
      .lean();

    console.log('✅ Marcas cargadas:', brands.length);

    res.render('brands/index', {
      title: 'Marcas',
      brands
    });
  } catch (error) {
    console.error('❌ Error al cargar marcas:', error);
    req.flash('error', 'Error al cargar marcas');
    res.redirect('/');
  }
};

// ============================================================
// FORMULARIO DE CREACIÓN
// ============================================================
exports.create = (req, res) => {
  res.render('brands/create', {
    title: 'Nueva Marca'
  });
};

// ============================================================
// GUARDAR
// ============================================================
exports.store = async (req, res) => {
  let logoPath = '/img/brand-default.png';  // ✅ Declarar fuera del try

  try {
    const { name, description } = req.body;

    console.log('\n🆕 [brandController.store] Creando marca...');
    console.log('   name:', name);
    console.log('   req.file:', req.file ? req.file.filename : 'sin archivo');

    if (!name || !name.trim()) {
      req.flash('error', 'El nombre de la marca es obligatorio');
      return res.redirect('/brands/create');
    }

    // ✅ Si se subió imagen, usar su ruta
    if (req.file) {
      logoPath = `/uploads/brands/${req.file.filename}`;
      console.log('   logoPath:', logoPath);
    }

    const brand = await Brand.create({
      name: name.trim(),
      description: (description || '').trim(),
      logo: logoPath,
      isActive: true,
      createdBy: req.session.user.id
    });

    console.log('✅ Marca creada:', brand._id, brand.name);
    console.log('   Logo guardado:', brand.logo);

    req.flash('success', `✅ Marca "${brand.name}" creada correctamente`);
    res.redirect('/brands');
  } catch (error) {
    console.error('\n❌ Error al crear marca:', error);
    console.error('   Código:', error.code);
    console.error('   Mensaje:', error.message);

    // ✅ Solo eliminar si el error NO es de duplicado (así conservas la imagen)
    // Si el error es 11000 (duplicado), la imagen ya se subió pero no se usó
    if (error.code === 11000) {
      // Eliminar la imagen que se subió pero no se usó
      if (req.file) {
        deleteImage(`/uploads/brands/${req.file.filename}`);
      }
      req.flash('error', 'Ya existe una marca con ese nombre');
    } else {
      // Para otros errores, NO eliminar la imagen (así puedes revisar)
      console.error('⚠️ Imagen NO eliminada para diagnóstico:', logoPath);
      req.flash('error', 'Error al crear marca: ' + error.message);
    }

    res.redirect('/brands/create');
  }
};

// ============================================================
// MOSTRAR DETALLE
// ============================================================
exports.show = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).lean();

    if (!brand) {
      req.flash('error', 'Marca no encontrada');
      return res.redirect('/brands');
    }

    const productsCount = await Product.countDocuments({ brand: brand._id });
    brand.productsCount = productsCount;

    res.render('brands/detail', {
      title: brand.name,
      brand
    });
  } catch (error) {
    console.error('❌ Error al cargar marca:', error);
    req.flash('error', 'Error al cargar marca');
    res.redirect('/brands');
  }
};

// ============================================================
// FORMULARIO DE EDICIÓN
// ============================================================
exports.edit = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).lean();

    if (!brand) {
      req.flash('error', 'Marca no encontrada');
      return res.redirect('/brands');
    }

    res.render('brands/edit', {
      title: 'Editar Marca',
      brand
    });
  } catch (error) {
    console.error('❌ Error al cargar marca:', error);
    req.flash('error', 'Error al cargar marca');
    res.redirect('/brands');
  }
};

// ============================================================
// ACTUALIZAR
// ============================================================
exports.update = async (req, res) => {
  try {
    const { name, description, isActive, removeLogo } = req.body;
    const brandId = req.params.id;

    console.log('\n✏️ [brandController.update] Actualizando marca...');
    console.log('   ID:', brandId);
    console.log('   req.file:', req.file ? req.file.filename : 'sin archivo');
    console.log('   removeLogo:', removeLogo);

    const brand = await Brand.findById(brandId);
    if (!brand) {
      req.flash('error', 'Marca no encontrada');
      return res.redirect('/brands');
    }

    const updateData = {
      name: name.trim(),
      description: (description || '').trim(),
      isActive: isActive === 'on'
    };

    // ✅ Si subieron nueva imagen
    if (req.file) {
      deleteImage(brand.logo);
      updateData.logo = `/uploads/brands/${req.file.filename}`;
      console.log('   Nuevo logo:', updateData.logo);
    } else if (removeLogo === 'on') {
      deleteImage(brand.logo);
      updateData.logo = '/img/brand-default.png';
      console.log('   Logo eliminado, usando default');
    }

    await Brand.findByIdAndUpdate(brandId, updateData, {
      new: true,
      runValidators: true
    });

    console.log('✅ Marca actualizada');
    req.flash('success', '✅ Marca actualizada correctamente');
    res.redirect(`/brands/${brandId}`);
  } catch (error) {
    console.error('❌ Error al actualizar marca:', error);

    // ✅ Solo eliminar si el error es de duplicado
    if (error.code === 11000) {
      if (req.file) {
        deleteImage(`/uploads/brands/${req.file.filename}`);
      }
      req.flash('error', 'Ya existe una marca con ese nombre');
    } else {
      req.flash('error', 'Error al actualizar marca: ' + error.message);
    }

    res.redirect(`/brands/${req.params.id}/edit`);
  }
};

// ============================================================
// ELIMINAR
// ============================================================
exports.destroy = async (req, res) => {
  try {
    const brandId = req.params.id;

    const hasProducts = await Product.findOne({ brand: brandId });
    if (hasProducts) {
      req.flash('error', 'No se puede eliminar: la marca tiene productos asociados');
      return res.redirect('/brands');
    }

    const brand = await Brand.findByIdAndDelete(brandId);
    if (!brand) {
      req.flash('error', 'Marca no encontrada');
      return res.redirect('/brands');
    }

    deleteImage(brand.logo);

    req.flash('success', '🗑️ Marca eliminada correctamente');
    res.redirect('/brands');
  } catch (error) {
    console.error('❌ Error al eliminar marca:', error);
    req.flash('error', 'Error al eliminar marca');
    res.redirect('/brands');
  }
};