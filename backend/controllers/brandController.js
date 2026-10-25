// ============================================================
// controllers/brandController.js
// ============================================================
const Brand = require('../models/Brand');
const Product = require('../models/Product');
// Ya no necesitamos fs ni path para manejar archivos locales

// ============================================================
// Helper: eliminar imagen (DESHABILITADO PARA CLOUDINARY)
// ============================================================
function deleteImage(imagePath) {
  // Como las imágenes ahora están en Cloudinary, no podemos borrarlas con fs.
  // Para borrarlas de Cloudinary, se requeriría usar su API, pero por ahora
  // es seguro no hacer nada para evitar errores.
  console.log('🗑️ Solicitud de eliminación (ignorada, la imagen está en Cloudinary):', imagePath);
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
  let logoPath = '/img/brand-default.png'; 

  try {
    const { name, description } = req.body;

    console.log('\n🆕 [brandController.store] Creando marca...');
    console.log('   name:', name);
    // Ahora mostramos el path (URL) que nos da Cloudinary
    console.log('   req.file:', req.file ? req.file.path : 'sin archivo');

    if (!name || !name.trim()) {
      req.flash('error', 'El nombre de la marca es obligatorio');
      return res.redirect('/brands/create');
    }

    // ✅ Si se subió imagen, usar la URL de Cloudinary
    if (req.file) {
      logoPath = req.file.path; // Cloudinary devuelve la URL completa aquí
      console.log('   logoPath (Cloudinary):', logoPath);
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

    if (error.code === 11000) {
      // Si hay duplicado, la imagen ya se subió a Cloudinary (quedará huérfana allí, pero no rompe la app)
      req.flash('error', 'Ya existe una marca con ese nombre');
    } else {
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
    console.log('   req.file:', req.file ? req.file.path : 'sin archivo');
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
      // (Opcional) Aquí podrías llamar a la API de Cloudinary para borrar la imagen vieja
      deleteImage(brand.logo); 
      
      updateData.logo = req.file.path; // Guarda la URL de Cloudinary
      console.log('   Nuevo logo (Cloudinary):', updateData.logo);
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

    if (error.code === 11000) {
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