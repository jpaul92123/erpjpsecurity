// ============================================================
// controllers/settingController.js
// ============================================================
const Setting = require('../models/Setting');
const Category = require('../models/Category');
// Ya no necesitamos fs ni path para borrar archivos locales

// ============================================================
// Helper: eliminar imagen (DESHABILITADO PARA CLOUDINARY)
// ============================================================
function deleteImage(imagePath) {
  // Como las imágenes están en Cloudinary, no se pueden borrar con fs
  console.log('🗑️ Solicitud de eliminación (ignorada, imagen en Cloudinary):', imagePath);
}

// ============================================
// GET /settings  →  Mostrar formulario
// ============================================
exports.getSettings = async (req, res) => {
  try {
    const setting = await Setting.getGlobal();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    res.render('settings/index', {
      title: 'Configuración del Sitio',
      setting,
      categories,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al cargar configuración:', error);
    req.flash('error', 'Error al cargar la configuración');
    res.redirect('/');
  }
};

// ============================================
// POST /settings  →  Guardar cambios
// ============================================
exports.updateSettings = async (req, res) => {
  try {
    const setting = await Setting.getGlobal();
    const files = req.files || {};

    console.log('\n💾 Guardando configuración...');
    console.log('📁 Archivos subidos:', Object.keys(files));

    // ==========================================
    // LOGO
    // ==========================================
    if (files.logo && files.logo[0]) {
      // ✅ AHORA GUARDAMOS LA URL DE CLOUDINARY
      setting.logo = files.logo[0].path;
      console.log('✅ Nuevo logo (Cloudinary):', setting.logo);
    } else if (req.body.logo && req.body.logo.trim()) {
      setting.logo = req.body.logo.trim();
    }

    // ==========================================
    // FAVICON
    // ==========================================
    if (files.favicon && files.favicon[0]) {
      // ✅ AHORA GUARDAMOS LA URL DE CLOUDINARY
      setting.favicon = files.favicon[0].path;
      console.log('✅ Nuevo favicon (Cloudinary):', setting.favicon);
    } else if (req.body.favicon && req.body.favicon.trim()) {
      setting.favicon = req.body.favicon.trim();
    }

    // ==========================================
    // DATOS BÁSICOS
    // ==========================================
    setting.siteName    = req.body.siteName || setting.siteName;
    setting.siteTagline = req.body.siteTagline || '';
    setting.icon        = req.body.icon || 'fa-shield-halved';

    // ==========================================
    // EMPRESA
    // ==========================================
    setting.company = {
      legalName: req.body.companyLegalName || '',
      ruc:       req.body.companyRuc || '',
      phone:     req.body.companyPhone || '',
      email:     req.body.companyEmail || '',
      address:   req.body.companyAddress || '',
      city:      req.body.companyCity || '',
      country:   req.body.companyCountry || ''
    };

    // ==========================================
    // HORARIOS
    // ==========================================
    setting.schedule = {
      weekdays: req.body.scheduleWeekdays || '',
      saturday: req.body.scheduleSaturday || '',
      sunday:   req.body.scheduleSunday || '',
      holidays: req.body.scheduleHolidays || ''
    };

    // ==========================================
    // REDES SOCIALES
    // ==========================================
    setting.social = {
      facebook:  req.body.socialFacebook || '',
      instagram: req.body.socialInstagram || '',
      whatsapp:  req.body.socialWhatsapp || '',
      youtube:   req.body.socialYoutube || '',
      tiktok:    req.body.socialTiktok || '',
      linkedin:  req.body.socialLinkedin || '',
      twitter:   req.body.socialTwitter || ''
    };

    // ==========================================
    // COLORES
    // ==========================================
    setting.colors = {
      primary:   req.body.colorPrimary || '#0d6efd',
      secondary: req.body.colorSecondary || '#0a58ca',
      accent:    req.body.colorAccent || '#ffc107'
    };

    // ==========================================
    // SEO
    // ==========================================
    setting.metaDescription = req.body.metaDescription || '';
    setting.metaKeywords    = req.body.metaKeywords || '';

    // ==========================================
    // SLIDES DEL HERO
    // ==========================================
    const slides = [];
    const titles    = [].concat(req.body.slideTitle || []);
    const subtitles = [].concat(req.body.slideSubtitle || []);
    const buttons   = [].concat(req.body.slideButtonText || []);
    const links     = [].concat(req.body.slideButtonLink || []);
    const imageUrls = [].concat(req.body.slideImage || []);
    const bgColors  = [].concat(req.body.slideBgColor || []);
    const txtColors = [].concat(req.body.slideTextColor || []);
    const cats      = [].concat(req.body.slideCategory || []);
    const actives   = [].concat(req.body.slideActive || []);

    console.log('🎞️ Procesando slides...');

    for (let i = 0; i < 3; i++) {
      const title    = titles[i] || '';
      const subtitle = subtitles[i] || '';
      const imageUrl = imageUrls[i] || '';

      // ✅ Buscar imagen subida para este slide
      const uploadedFile = files[`slideImage${i}`] && files[`slideImage${i}`][0];
      let finalImage = imageUrl;

      if (uploadedFile) {
        // AHORA GUARDAMOS LA URL DE CLOUDINARY
        finalImage = uploadedFile.path;
        console.log(`  ✅ Slide ${i + 1} - Imagen subida (Cloudinary):`, finalImage);
      }

      // Saltar si el slide está vacío
      if (!title && !subtitle && !finalImage) continue;

      // Detectar si está activo (viene como array "0", "1", "2" o como "on")
      const isActive =
        actives.includes(String(i)) ||
        actives[i] === 'on' ||
        actives[i] === 'true';

      slides.push({
        title:      title,
        subtitle:   subtitle,
        buttonText: buttons[i] || '',
        buttonLink: links[i] || '',
        image:      finalImage,
        bgColor:    bgColors[i] || '#0d6efd',
        textColor:  txtColors[i] || '#ffffff',
        category:   cats[i] || null,
        isActive:   isActive
      });

      if (slides.length >= 3) break;
    }

    setting.heroSlides = slides;
    console.log('✅ Slides guardados:', slides.length);

    await setting.save();

    req.flash('success', '✅ Configuración guardada correctamente');
    res.redirect('/settings');
  } catch (error) {
    console.error('❌ Error al guardar configuración:', error);
    req.flash('error', 'Error al guardar la configuración: ' + error.message);
    res.redirect('/settings');
  }
};

// ============================================
// API pública: GET /api/settings  →  JSON
// ============================================
exports.getSettingsJSON = async (req, res) => {
  try {
    const setting = await Setting.getGlobal();
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};