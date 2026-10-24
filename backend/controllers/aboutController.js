const About = require('../models/About');

// ============================================
// GET /about → Vista pública
// ============================================
exports.getPublic = async (req, res) => {
  try {
    const about = await About.getGlobal();

    // Filtrar solo servicios y proyectos activos
    const activeServices = (about.services || [])
      .filter(s => s.isActive)
      .sort((a, b) => a.order - b.order);

    const activeProjects = (about.projects || [])
      .filter(p => p.isActive)
      .sort((a, b) => {
        const dateA = new Date(a.serviceDate || a.createdAt);
        const dateB = new Date(b.serviceDate || b.createdAt);
        return dateB - dateA;
      });

    res.render('about/public', {
      title: 'Nosotros',
      about,
      services: activeServices,
      projects: activeProjects,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Error al cargar About:', error);
    req.flash('error', 'Error al cargar la página');
    res.redirect('/');
  }
};

// ============================================
// GET /about/admin → Vista de administración
// ============================================
exports.getAdmin = async (req, res) => {
  try {
    const about = await About.getGlobal();

    res.render('about/admin', {
      title: 'Administrar Nosotros',
      about,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al cargar About admin:', error);
    req.flash('error', 'Error al cargar la configuración');
    res.redirect('/');
  }
};

// ============================================
// POST /about/company → Actualizar info empresa
// ============================================
exports.updateCompany = async (req, res) => {
  try {
    const about = await About.getGlobal();

    about.companyInfo = {
      hero: {
        title:      req.body.heroTitle || 'Nosotros',
        subtitle:   req.body.heroSubtitle || '',
        background: req.body.heroBackground || ''
      },
      description:     req.body.description || '',
      history:         req.body.history || '',
      mission:         req.body.mission || '',
      vision:          req.body.vision || '',
      yearsExperience: parseInt(req.body.yearsExperience) || 0,
      clientsCount:    parseInt(req.body.clientsCount) || 0,
      projectsCount:   parseInt(req.body.projectsCount) || 0,
      values:          about.companyInfo ? about.companyInfo.values : []
    };

    await about.save();

    req.flash('success', 'Información de la empresa actualizada');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error al actualizar About:', error);
    req.flash('error', 'Error al guardar: ' + error.message);
    res.redirect('/about/admin');
  }
};

// ============================================
// POST /about/values → Actualizar valores
// ============================================
exports.updateValues = async (req, res) => {
  try {
    const about = await About.getGlobal();

    const icons = [].concat(req.body.valueIcon || []);
    const titles = [].concat(req.body.valueTitle || []);
    const descriptions = [].concat(req.body.valueDescription || []);

    const values = [];
    for (let i = 0; i < titles.length; i++) {
      if (!titles[i]) continue;
      values.push({
        icon: icons[i] || 'fa-star',
        title: titles[i] || '',
        description: descriptions[i] || ''
      });
    }

    if (!about.companyInfo) about.companyInfo = {};
    about.companyInfo.values = values;

    await about.save();

    req.flash('success', 'Valores actualizados');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'Error al guardar los valores');
    res.redirect('/about/admin');
  }
};

// ============================================
// SERVICIOS - CRUD
// ============================================

// POST /about/services → Crear servicio
exports.createService = async (req, res) => {
  try {
    const about = await About.getGlobal();

    const features = (req.body.features || '')
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    about.services.push({
      title:       req.body.title,
      description: req.body.description || '',
      image:       req.body.image || '',
      icon:        req.body.icon || 'fa-tools',
      features:    features,
      order:       about.services.length,
      isActive:    true
    });

    await about.save();

    req.flash('success', 'Servicio creado');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'Error al crear el servicio');
    res.redirect('/about/admin');
  }
};

// POST /about/services/:id → Actualizar servicio
exports.updateService = async (req, res) => {
  try {
    const about = await About.getGlobal();
    const service = about.services.id(req.params.id);

    if (!service) {
      req.flash('error', 'Servicio no encontrado');
      return res.redirect('/about/admin');
    }

    const features = (req.body.features || '')
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    service.title       = req.body.title;
    service.description = req.body.description || '';
    service.image       = req.body.image || '';
    service.icon        = req.body.icon || 'fa-tools';
    service.features    = features;
    service.isActive    = req.body.isActive === 'on';

    await about.save();

    req.flash('success', 'Servicio actualizado');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'Error al actualizar el servicio');
    res.redirect('/about/admin');
  }
};

// POST /about/services/:id/delete → Eliminar servicio
exports.deleteService = async (req, res) => {
  try {
    const about = await About.getGlobal();
    about.services.pull(req.params.id);
    await about.save();

    req.flash('success', 'Servicio eliminado');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'Error al eliminar');
    res.redirect('/about/admin');
  }
};

// ============================================
// PROYECTOS - CRUD
// ============================================

// POST /about/projects → Crear proyecto
exports.createProject = async (req, res) => {
  try {
    const about = await About.getGlobal();

    const images = (req.body.images || '')
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    about.projects.push({
      client:      req.body.client,
      address:     req.body.address,
      city:        req.body.city || '',
      description: req.body.description || '',
      images:      images,
      serviceDate: req.body.serviceDate ? new Date(req.body.serviceDate) : new Date(),
      serviceType: req.body.serviceType || '',
      order:       about.projects.length,
      isActive:    true
    });

    await about.save();

    req.flash('success', 'Proyecto creado');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'Error al crear el proyecto');
    res.redirect('/about/admin');
  }
};

// POST /about/projects/:id → Actualizar proyecto
exports.updateProject = async (req, res) => {
  try {
    const about = await About.getGlobal();
    const project = about.projects.id(req.params.id);

    if (!project) {
      req.flash('error', 'Proyecto no encontrado');
      return res.redirect('/about/admin');
    }

    const images = (req.body.images || '')
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    project.client      = req.body.client;
    project.address     = req.body.address;
    project.city        = req.body.city || '';
    project.description = req.body.description || '';
    project.images      = images;
    project.serviceDate = req.body.serviceDate ? new Date(req.body.serviceDate) : project.serviceDate;
    project.serviceType = req.body.serviceType || '';
    project.isActive    = req.body.isActive === 'on';

    await about.save();

    req.flash('success', 'Proyecto actualizado');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'Error al actualizar el proyecto');
    res.redirect('/about/admin');
  }
};

// POST /about/projects/:id/delete → Eliminar proyecto
exports.deleteProject = async (req, res) => {
  try {
    const about = await About.getGlobal();
    about.projects.pull(req.params.id);
    await about.save();

    req.flash('success', 'Proyecto eliminado');
    res.redirect('/about/admin');
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'Error al eliminar');
    res.redirect('/about/admin');
  }
};