const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });

// Importar modelos
const Role = require('./models/Role');
const User = require('./models/User');

// Conectar a MongoDB
const connectDB = require('./config/db');

const seedDatabase = async () => {
  try {
    await connectDB();

    // ============================================================
    // 1. CREAR ROLES
    // ============================================================
    console.log('🔐 Creando roles...');

    // -------- ADMIN: acceso total --------
    const adminRole = await Role.findOneAndUpdate(
      { name: 'admin' },
      {
        name: 'admin',
        permissions: ['*']
      },
      { upsert: true, new: true }
    );
    console.log('✅ Rol admin listo');

    // -------- USER: solo ventas y servicios --------
    const userRole = await Role.findOneAndUpdate(
      { name: 'user' },
      {
        name: 'user',
        permissions: [
          // Ventas
          'ventas',
          'view_quotations', 'create_quotation', 'edit_quotation', 'delete_quotation',
          'view_orders', 'create_order', 'edit_order', 'delete_order',
          'view_sales', 'create_sale', 'edit_sale', 'delete_sale',
          'view_vouchers', 'create_voucher', 'edit_voucher', 'delete_voucher',
          // Servicios
          'servicios',
          'view_installations', 'create_installation', 'edit_installation', 'delete_installation',
          'view_maintenances', 'create_maintenance', 'edit_maintenance', 'delete_maintenance',
          'view_visits', 'create_visit', 'edit_visit', 'delete_visit',
          'view_work_orders', 'create_work_order', 'edit_work_order', 'delete_work_order',
          'view_projects', 'create_project', 'edit_project', 'delete_project'
        ]
      },
      { upsert: true, new: true }
    );
    console.log('✅ Rol user listo');

    // ============================================================
    // 2. CREAR USUARIOS
    // ============================================================
    console.log('👤 Creando usuarios...');

    // -------- ADMIN --------
    let adminUser = await User.findOne({ email: 'admin@jpsecurity.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Administrador',
        email: 'admin@jpsecurity.com',
        password: 'Admin123',
        role: adminRole._id,
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Usuario admin creado: admin@jpsecurity.com / Admin123');
    } else {
      // Actualizar rol por si cambió
      adminUser.role = adminRole._id;
      await adminUser.save();
      console.log('ℹ️  Usuario admin ya existía (rol actualizado)');
    }

    // -------- USER --------
    let normalUser = await User.findOne({ email: 'user@jpsecurity.com' });
    if (!normalUser) {
      normalUser = new User({
        name: 'Usuario Ventas',
        email: 'user@jpsecurity.com',
        password: 'User1234',
        role: userRole._id,
        isActive: true
      });
      await normalUser.save();
      console.log('✅ Usuario user creado: user@jpsecurity.com / User1234');
    } else {
      // Actualizar rol por si cambió
      normalUser.role = userRole._id;
      await normalUser.save();
      console.log('ℹ️  Usuario user ya existía (rol actualizado)');
    }

    console.log('🎉 ¡Seed completado exitosamente!');
    console.log('');
    console.log('📋 CREDENCIALES:');
    console.log('   👑 Admin: admin@jpsecurity.com / Admin123');
    console.log('   👤 User:  user@jpsecurity.com / User1234');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
};

// Ejecutar
seedDatabase();