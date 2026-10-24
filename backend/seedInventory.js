const connectDB = require('./config/db');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const Warehouse = require('./models/Warehouse');
const Product = require('./models/Product');
const StockMovement = require('./models/StockMovement');
const User = require('./models/User');

const seedInventory = async () => {
  try {
    await connectDB();

    // Verificar admin
    const admin = await User.findOne({ email: 'admin@jpsecurity.com' });
    if (!admin) {
      console.log('❌ No existe usuario admin. Ejecuta primero node seed.js');
      process.exit(1);
    }

    // Limpiar datos existentes (opcional)
    console.log('🧹 Limpiando datos existentes...');
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Warehouse.deleteMany({});
    await Product.deleteMany({});
    await StockMovement.deleteMany({});

    // Crear categorías
    console.log('📁 Creando categorías...');
    const categories = await Category.insertMany([
      { name: 'Cámaras', description: 'Cámaras de seguridad HD y 4K' },
      { name: 'Alarmas', description: 'Sistemas de alarma y sensores' },
      { name: 'Cerraduras', description: 'Cerraduras electrónicas y biométricas' },
      { name: 'Accesorios', description: 'Fuentes, cables y accesorios' },
      { name: 'Control de Acceso', description: 'Sistemas de control de acceso y biometricos' }
    ]);
    console.log('✅ Categorías creadas:', categories.length);

    // Crear marcas
    console.log('🏷️ Creando marcas...');
    const brands = await Brand.insertMany([
      { name: 'Hikvision' },
      { name: 'Dahua' },
      { name: 'ZKTeco' },
      { name: 'Genérico' },
      { name: 'Axis' }
    ]);
    console.log('✅ Marcas creadas:', brands.length);

    // Crear almacenes
    console.log('🏠 Creando almacenes...');
    const warehouses = await Warehouse.insertMany([
      { name: 'Almacén Central', location: 'Lima - San Miguel' },
      { name: 'Almacén Norte', location: 'Lima - Los Olivos' },
      { name: 'Almacén Sur', location: 'Lima - Surco' }
    ]);
    console.log('✅ Almacenes creados:', warehouses.length);

    // Crear productos
    console.log('📦 Creando productos...');
    const products = await Product.insertMany([
      {
        code: 'CAM-001',
        name: 'Cámara IP 4MP',
        description: 'Cámara de seguridad IP con visión nocturna y audio bidireccional',
        category: categories[0]._id,
        brand: brands[0]._id,
        unit: 'Unidad',
        price: 350,
        cost: 280
      },
      {
        code: 'CAM-002',
        name: 'Cámara PTZ 2MP',
        description: 'Cámara con pan, tilt y zoom, ideal para grandes áreas',
        category: categories[0]._id,
        brand: brands[1]._id,
        unit: 'Unidad',
        price: 850,
        cost: 680
      },
      {
        code: 'ALM-001',
        name: 'Kit Alarma Inalámbrica',
        description: 'Kit con 4 sensores, sirena y control remoto',
        category: categories[1]._id,
        brand: brands[2]._id,
        unit: 'Kit',
        price: 890,
        cost: 650
      },
      {
        code: 'ALM-002',
        name: 'Sensor Movimiento PIR',
        description: 'Sensor de movimiento infrarrojo para alarmas',
        category: categories[1]._id,
        brand: brands[3]._id,
        unit: 'Unidad',
        price: 95,
        cost: 70
      },
      {
        code: 'CER-001',
        name: 'Cerradura Biométrica',
        description: 'Lectura de huella y tarjeta, con batería de respaldo',
        category: categories[2]._id,
        brand: brands[2]._id,
        unit: 'Unidad',
        price: 620,
        cost: 450
      },
      {
        code: 'CER-002',
        name: 'Cerradura Electrónica',
        description: 'Cerradura con teclado numérico y control remoto',
        category: categories[2]._id,
        brand: brands[4]._id,
        unit: 'Unidad',
        price: 450,
        cost: 320
      },
      {
        code: 'ACC-001',
        name: 'Fuente de Alimentación 12V 5A',
        description: 'Fuente para sistemas de seguridad y cámaras',
        category: categories[3]._id,
        brand: brands[3]._id,
        unit: 'Unidad',
        price: 120,
        cost: 85
      },
      {
        code: 'ACC-002',
        name: 'Cable UTP Cat6 300m',
        description: 'Cable de red para cámaras IP',
        category: categories[3]._id,
        brand: brands[3]._id,
        unit: 'Rollos',
        price: 250,
        cost: 180
      },
      {
        code: 'ACC-003',
        name: 'Switch PoE 8 Puertos',
        description: 'Switch con alimentación PoE para cámaras IP',
        category: categories[3]._id,
        brand: brands[1]._id,
        unit: 'Unidad',
        price: 420,
        cost: 330
      }
    ]);
    console.log('✅ Productos creados:', products.length);

    // Crear movimientos de stock (entradas)
    console.log('📊 Creando movimientos de stock...');
    const movements = await StockMovement.insertMany([
      {
        product: products[0]._id,
        warehouse: warehouses[0]._id,
        type: 'entry',
        quantity: 10,
        unitPrice: 280,
        total: 2800,
        description: 'Compra inicial',
        documentNumber: 'FACT-001',
        createdBy: admin._id
      },
      {
        product: products[1]._id,
        warehouse: warehouses[0]._id,
        type: 'entry',
        quantity: 5,
        unitPrice: 680,
        total: 3400,
        description: 'Compra inicial',
        documentNumber: 'FACT-002',
        createdBy: admin._id
      },
      {
        product: products[2]._id,
        warehouse: warehouses[1]._id,
        type: 'entry',
        quantity: 8,
        unitPrice: 650,
        total: 5200,
        description: 'Compra para almacén Norte',
        documentNumber: 'FACT-003',
        createdBy: admin._id
      },
      {
        product: products[3]._id,
        warehouse: warehouses[0]._id,
        type: 'entry',
        quantity: 20,
        unitPrice: 70,
        total: 1400,
        description: 'Compra inicial',
        documentNumber: 'FACT-004',
        createdBy: admin._id
      },
      {
        product: products[4]._id,
        warehouse: warehouses[2]._id,
        type: 'entry',
        quantity: 6,
        unitPrice: 450,
        total: 2700,
        description: 'Compra para almacén Sur',
        documentNumber: 'FACT-005',
        createdBy: admin._id
      },
      {
        product: products[5]._id,
        warehouse: warehouses[0]._id,
        type: 'entry',
        quantity: 12,
        unitPrice: 320,
        total: 3840,
        description: 'Compra inicial',
        documentNumber: 'FACT-006',
        createdBy: admin._id
      }
    ]);
    console.log('✅ Movimientos creados:', movements.length);

    console.log('🎉 Seed de inventario completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedInventory();