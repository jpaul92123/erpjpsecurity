const Warehouse = require('../models/Warehouse');

exports.index = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });
    res.render('warehouses/index', { title: 'Almacenes', warehouses });
  } catch (error) {
    req.flash('error', 'Error al cargar almacenes');
    res.redirect('/');
  }
};

exports.create = (req, res) => {
  res.render('warehouses/create', { title: 'Nuevo Almacén' });
};

exports.store = async (req, res) => {
  try {
    const { name, location } = req.body;
    await Warehouse.create({ name, location });
    req.flash('success', 'Almacén creado correctamente');
    res.redirect('/warehouses');
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'Ya existe un almacén con ese nombre');
    } else {
      req.flash('error', 'Error al crear almacén');
    }
    res.redirect('/warehouses/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      req.flash('error', 'Almacén no encontrado');
      return res.redirect('/warehouses');
    }
    res.render('warehouses/edit', { title: 'Editar Almacén', warehouse });
  } catch (error) {
    req.flash('error', 'Error al cargar almacén');
    res.redirect('/warehouses');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, location, isActive } = req.body;
    await Warehouse.findByIdAndUpdate(
      req.params.id,
      { name, location, isActive: isActive === 'on' },
      { new: true, runValidators: true }
    );
    req.flash('success', 'Almacén actualizado');
    res.redirect('/warehouses');
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'Ya existe un almacén con ese nombre');
    } else {
      req.flash('error', 'Error al actualizar');
    }
    res.redirect(`/warehouses/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    req.flash('success', 'Almacén eliminado');
    res.redirect('/warehouses');
  } catch (error) {
    req.flash('error', 'No se puede eliminar, puede estar en uso');
    res.redirect('/warehouses');
  }
};