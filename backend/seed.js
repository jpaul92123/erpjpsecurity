const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
dotenv.config({ path: path.join(__dirname, '.env') });

// Importar modelos
const Role = require('./models/Role');
const User = require('./models/User');
const Client = require('./models/Client');

// Conectar a MongoDB
const connectDB = require('./config/db');

const seedDatabase = async () => {
  try {
    await connectDB();

    // 1. Crear roles (si no existen)
    console.log('🔐 Creando roles...');
    const adminRole = await Role.findOneAndUpdate(
      { name: 'admin' },
      { name: 'admin', permissions: [
      '*', // Mantén el comodín o lista todos
      'view_users', 'create_user', 'edit_user', 'delete_user',
      'view_clients', 'create_client', 'edit_client', 'delete_client',

      ] },
      { upsert: true, new: true }
    );
    const userRole = await Role.findOneAndUpdate(
      { name: 'user' },
      { name: 'user', permissions: ['view_dashboard'] },
      { upsert: true, new: true }
    );
    console.log('✅ Roles listos');

    // 2. Crear usuario administrador (si no existe)
    console.log('👤 Creando usuario administrador...');
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
      console.log('✅ Usuario admin creado');
    } else {
      console.log('ℹ️  Usuario admin ya existe');
    }

    // 3. Crear clientes de prueba (asociados al admin)
    console.log('🏢 Creando clientes de prueba...');
    const clientsData = [
      {
        businessName: 'Seguridad Total SAC',
        ruc: '20123456789',
        email: 'info@seguridadtotal.com',
        phone: '987654321',
        type: 'Jurídico',
        createdBy: adminUser._id
      },
      {
        businessName: 'Alarmas Peruanas EIRL',
        ruc: '20456789012',
        email: 'ventas@alarmasperuanas.com',
        phone: '912345678',
        type: 'Jurídico',
        createdBy: adminUser._id
      },
      {
        businessName: 'Juan Pérez',
        ruc: '12345678901',
        email: 'juan@perez.com',
        phone: '955555555',
        type: 'Natural',
        createdBy: adminUser._id
      },
      {
        businessName: 'Constructora San Miguel',
        ruc: '20567890123',
        email: 'constru@sanmiguel.com',
        phone: '987654321',
        type: 'Jurídico',
        createdBy: adminUser._id
      }
    ];

    // Insertar clientes solo si no existen (usando upsert)
    for (const clientData of clientsData) {
      await Client.findOneAndUpdate(
        { ruc: clientData.ruc },
        clientData,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Clientes de prueba creados/actualizados');

    console.log('🎉 ¡Seed completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
};

// Ejecutar
seedDatabase();