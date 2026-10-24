// ============================================================
// public/js/sale-print.js
// Sistema de impresión de ventas - Datos completos desde backend
// ============================================================

function printSale(sale) {
    if (!sale) {
        alert('No hay datos de venta para imprimir');
        return;
    }

    console.log('🖨️ Imprimiendo venta:', sale);

    // ==========================================
    // LEER CONFIGURACIÓN GLOBAL (desde setting-globals)
    // ==========================================
    const APP = window.APP_SETTING || {};
    const COMPANY = APP.company || {};
    const COLORS = APP.colors || {};
    const SOCIAL = APP.social || {};
    const SCHEDULE = APP.schedule || {};

    console.log('🏢 Setting cargado:', APP);

    // Helper: valor con fallback
    function val(value, fallback) {
        return (value !== undefined && value !== null && value !== '') ? value : (fallback || '');
    }

    // Helper: formatear fecha
    function formatDate(dateStr, withTime) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        if (withTime !== false) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return d.toLocaleDateString('es-PE', options);
    }

    // ==========================================
    // DATOS DEL CLIENTE
    // ==========================================
    const clientName = sale.client ? sale.client.businessName : 'Cliente Anónimo';
    const clientRuc = (sale.client && sale.client.ruc) || 'No especificado';
    const clientPhone = (sale.client && sale.client.phone) || 'No especificado';
    const clientEmail = (sale.client && sale.client.email) || '';
    const clientAddress = (sale.client && sale.client.address) || '';
    const clientType = (sale.client && sale.client.type) || '';

    // ==========================================
    // DATOS DE LA VENTA
    // ==========================================
    const saleNumber = sale.number || 'VEN-000000';
    const saleDate = formatDate(sale.date || sale.createdAt);
    const paymentMethod = sale.paymentMethod || 'Efectivo';
    const status = sale.status || 'Pagado';
    const notes = sale.notes || '';
    const createdBy = sale.createdBy ? sale.createdBy.name : 'Usuario';
    const quotationRef = sale.convertedFromQuotation
        ? (sale.convertedFromQuotation.number || sale.convertedFromQuotation)
        : '';

    // ==========================================
    // TOTALES
    // ==========================================
    const subtotal = sale.subtotal || 0;
    const igv = sale.igv || 0;
    const discount = sale.discount || 0;
    const total = sale.total || 0;
    const includeIgv = sale.includeIgv !== undefined ? sale.includeIgv : true;

    // ==========================================
    // EMPRESA (desde setting-globals)
    // ==========================================
    const companyName = val(COMPANY.legalName, val(APP.siteName, 'JP Security'));
    const companyTagline = val(APP.siteTagline, 'Soluciones en Seguridad Electrónica');
    const companyRuc = val(COMPANY.ruc, '');
    const companyPhone = val(COMPANY.phone, '');
    const companyEmail = val(COMPANY.email, '');
    const companyAddress = val(COMPANY.address, '');
    const companyCity = val(COMPANY.city, '');
    const companyCountry = val(COMPANY.country, '');
    const companyFullAddress = [companyAddress, companyCity, companyCountry].filter(Boolean).join(' - ');

    const logoUrl = val(APP.logo, '');

    const primaryColor = val(COLORS.primary, '#0d6efd');
    const secondaryColor = val(COLORS.secondary, '#0a58ca');
    const accentColor = val(COLORS.accent, '#ffc107');

    // ==========================================
    // ESTADO BADGE
    // ==========================================
    let statusBadge = '';
    if (status === 'Pagado') {
        statusBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 50rem; font-size: 11px; font-weight: 700; border: 1px solid #86efac;">✅ Pagado</span>`;
    } else if (status === 'Anulado') {
        statusBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 50rem; font-size: 11px; font-weight: 700; border: 1px solid #fca5a5;">❌ Anulado</span>`;
    } else {
        statusBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 50rem; font-size: 11px; font-weight: 700; border: 1px solid #cbd5e1;">${status}</span>`;
    }

    // ==========================================
    // CONSTRUIR TABLA DE ITEMS
    // ==========================================
    let itemsHtml = '';
    if (sale.items && sale.items.length > 0) {
        sale.items.forEach(function(item) {
            const productName = item.product && item.product.name
                ? item.product.name
                : (item.description || 'Producto');
            const productModel = item.product && item.product.model
                ? item.product.model
                : '';
            const productSku = item.product && item.product.sku
                ? item.product.sku
                : '';
            const productBrand = item.product && item.product.brand && item.product.brand.name
                ? item.product.brand.name
                : '';
            const imageUrl = (item.product && item.product.image) || '/img/product-default.png';

            itemsHtml += `
                <tr>
                    <td style="text-align: center; padding: 10px 6px;">
                        <div style="width: 46px; height: 46px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; margin: 0 auto; overflow: hidden;">
                            <img src="${imageUrl}"
                                 width="38"
                                 height="38"
                                 style="object-fit: contain;"
                                 onerror="this.src='/img/product-default.png'">
                        </div>
                    </td>
                    <td style="padding: 10px 8px;">
                        <div style="font-weight: 600; color: #1e293b; font-size: 13px; line-height: 1.3;">
                            ${productName}
                        </div>
                        ${item.description && item.description !== productName ? `
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px; font-style: italic;">
                                ${item.description}
                            </div>
                        ` : ''}
                        <div style="font-size: 11px; color: #64748b; margin-top: 3px; display: flex; gap: 10px; flex-wrap: wrap;">
                            ${productBrand ? `<span><strong>Marca:</strong> ${productBrand}</span>` : ''}
                            ${productModel ? `<span><strong>Modelo:</strong> ${productModel}</span>` : ''}
                            ${productSku ? `<span><strong>SKU:</strong> ${productSku}</span>` : ''}
                        </div>
                    </td>
                    <td style="text-align: center; padding: 10px 6px; font-weight: 700; color: #1e293b; font-size: 14px;">
                        ${item.quantity}
                    </td>
                    <td style="text-align: right; padding: 10px 6px; color: #475569; font-size: 13px; white-space: nowrap;">
                        S/ ${item.unitPrice.toFixed(2)}
                    </td>
                    <td style="text-align: right; padding: 10px 8px; font-weight: 700; color: ${primaryColor}; font-size: 14px; white-space: nowrap;">
                        S/ ${item.total.toFixed(2)}
                    </td>
                </tr>
            `;
        });
    } else {
        itemsHtml = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8; font-style: italic; font-size: 14px;">
                    No hay productos en esta venta
                </td>
            </tr>
        `;
    }

    // ==========================================
    // ABRIR VENTANA
    // ==========================================
    const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    if (!printWindow) {
        alert('Por favor, permita ventanas emergentes para imprimir');
        return;
    }

    // ==========================================
    // HTML COMPLETO
    // ==========================================
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo ${saleNumber} - ${companyName}</title>
    <style>
        /* ================================================
           BASE
           ================================================ */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            padding: 24px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .print-container {
            background: white;
            max-width: 900px;
            margin: 0 auto;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        }

        /* ================================================
           HEADER CON GRADIENTE DE MARCA
           ================================================ */
        .header-banner {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            padding: 32px 40px;
            color: white;
            position: relative;
            overflow: hidden;
        }
        .header-banner::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 300px;
            height: 300px;
            background: rgba(255,255,255,0.08);
            border-radius: 50%;
        }
        .header-banner::after {
            content: '';
            position: absolute;
            bottom: -60%;
            left: 20%;
            width: 200px;
            height: 200px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 2;
            gap: 24px;
            flex-wrap: wrap;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
            min-width: 260px;
        }
        .brand-logo {
            width: 72px;
            height: 72px;
            border-radius: 16px;
            background: rgba(255,255,255,0.15);
            border: 2px solid rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            flex-shrink: 0;
            overflow: hidden;
        }
        .brand-logo img {
            max-width: 80%;
            max-height: 80%;
            object-fit: contain;
        }
        .brand-info h1 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 4px;
            letter-spacing: -0.3px;
        }
        .brand-info p {
            margin: 0;
            font-size: 12px;
            opacity: 0.85;
        }
        .brand-info small {
            display: block;
            font-size: 11px;
            opacity: 0.75;
            margin-top: 3px;
            font-weight: 500;
        }

        .doc-info {
            text-align: right;
            flex-shrink: 0;
        }
        .doc-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.2);
            padding: 6px 16px;
            border-radius: 50rem;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .doc-number {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .doc-date {
            font-size: 12px;
            opacity: 0.85;
            margin-top: 4px;
        }

        /* ================================================
           INFO CLIENTE / ORDEN
           ================================================ */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            padding: 28px 40px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }

        .info-block {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .info-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${primaryColor};
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .info-title::before {
            content: '';
            width: 14px;
            height: 2px;
            background: ${primaryColor};
            border-radius: 2px;
        }

        .info-row {
            display: flex;
            gap: 8px;
            font-size: 13px;
            line-height: 1.5;
        }
        .info-row .label {
            color: #64748b;
            font-weight: 500;
            min-width: 80px;
            flex-shrink: 0;
        }
        .info-row .value {
            color: #1e293b;
            font-weight: 600;
            word-break: break-word;
        }

        /* ================================================
           TABLA DE PRODUCTOS
           ================================================ */
        .table-section {
            padding: 28px 40px;
        }
        .table-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .table-title-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            background: ${primaryColor};
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 13px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }

        thead th {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            color: white;
            padding: 14px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        thead th:first-child { text-align: center; width: 70px; }
        thead th:nth-child(2) { width: 40%; }
        thead th:nth-child(3) { text-align: center; width: 80px; }
        thead th:nth-child(4) { text-align: right; width: 120px; }
        thead th:last-child { text-align: right; width: 120px; }

        tbody td {
            padding: 12px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:nth-child(even) { background: #fafbfc; }

        /* ================================================
           TOTALES
           ================================================ */
        .totals-section {
            padding: 0 40px 28px;
            display: flex;
            justify-content: flex-end;
        }

        .totals-box {
            min-width: 340px;
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 14px;
        }
        .total-row .label {
            color: #64748b;
            font-weight: 500;
        }
        .total-row .value {
            color: #1e293b;
            font-weight: 600;
        }
        .total-row.discount .value { color: #dc2626; }
        .total-row.discount .label { color: #dc2626; }

        .total-row.grand-total {
            border-top: 2px solid ${primaryColor};
            padding-top: 16px;
            margin-top: 8px;
        }
        .total-row.grand-total .label {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .total-row.grand-total .value {
            font-size: 24px;
            font-weight: 800;
            color: ${primaryColor};
            letter-spacing: -0.5px;
        }

        /* ================================================
           NOTAS
           ================================================ */
        .notes-section {
            margin: 0 40px 28px;
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border-left: 4px solid ${accentColor};
            border-radius: 8px;
            padding: 16px 20px;
        }
        .notes-section .notes-title {
            font-size: 12px;
            font-weight: 700;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .notes-section .notes-text {
            color: #78350f;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-line;
        }

        /* ================================================
           FOOTER OSCURO
           ================================================ */
        .footer {
            background: #0f172a;
            color: #cbd5e1;
            padding: 28px 40px 20px;
        }
        .footer-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .footer-logo {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            flex-shrink: 0;
            overflow: hidden;
        }
        .footer-logo img {
            max-width: 70%;
            max-height: 70%;
            object-fit: contain;
        }
        .footer-brand-name {
            font-size: 15px;
            font-weight: 700;
            color: white;
        }
        .footer-brand-tagline {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        .footer-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 12px;
            line-height: 1.5;
        }
        .footer-item .fi-icon {
            color: ${primaryColor};
            margin-top: 1px;
            width: 16px;
            flex-shrink: 0;
            text-align: center;
            font-size: 13px;
        }
        .footer-item span {
            color: #cbd5e1;
            word-break: break-word;
        }

        .footer-bottom {
            text-align: center;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 11px;
            color: #64748b;
        }

        /* ================================================
           IMPRESIÓN
           ================================================ */
        @media print {
            body {
                padding: 0;
                background: white;
            }
            .print-container {
                max-width: 100%;
                border-radius: 0;
                box-shadow: none;
            }
            .header-banner,
            thead th,
            .footer,
            .totals-box,
            .notes-section {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
            thead { display: table-header-group; }
            .footer { page-break-before: auto; }
        }

        /* ================================================
           RESPONSIVE
           ================================================ */
        @media (max-width: 768px) {
            body { padding: 12px; }
            .header-banner { padding: 24px 20px; }
            .header-content { flex-direction: column; align-items: flex-start; }
            .doc-info { text-align: left; }
            .info-grid {
                grid-template-columns: 1fr;
                padding: 20px;
                gap: 20px;
            }
            .table-section { padding: 20px; }
            .totals-section { padding: 0 20px 20px; }
            .totals-box { min-width: 100%; }
            .notes-section { margin: 0 20px 20px; }
            .footer { padding: 24px 20px 16px; }
            thead th { font-size: 10px; padding: 10px 6px; }
            tbody td { padding: 10px 6px; font-size: 12px; }
            .brand-info h1 { font-size: 17px; }
            .doc-number { font-size: 22px; }
        }
    </style>
</head>
<body>

<div class="print-container">

    <!-- ============================================
         HEADER
         ============================================ -->
    <div class="header-banner">
        <div class="header-content">

            <div class="brand">
                <div class="brand-logo">
                    ${logoUrl
                        ? `<img src="${logoUrl}" alt="${companyName}">`
                        : `<span>🛡️</span>`
                    }
                </div>
                <div class="brand-info">
                    <h1>${companyName}</h1>
                    <p>${companyTagline}</p>
                    ${companyRuc ? `<small>RUC: ${companyRuc}</small>` : ''}
                </div>
            </div>

            <div class="doc-info">
                <div class="doc-badge">
                    🧾 Recibo de Venta
                </div>
                <div class="doc-number">${saleNumber}</div>
                <div class="doc-date">${saleDate}</div>
            </div>

        </div>
    </div>

    <!-- ============================================
         INFO CLIENTE + VENTA
         ============================================ -->
    <div class="info-grid">

        <div class="info-block">
            <div class="info-title">Datos del Cliente</div>
            <div class="info-row">
                <span class="label">Cliente:</span>
                <span class="value">${clientName}</span>
            </div>
            <div class="info-row">
                <span class="label">RUC/DNI:</span>
                <span class="value">${clientRuc}</span>
            </div>
            <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">${clientPhone}</span>
            </div>
            ${clientEmail ? `
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${clientEmail}</span>
                </div>
            ` : ''}
            ${clientAddress ? `
                <div class="info-row">
                    <span class="label">Dirección:</span>
                    <span class="value">${clientAddress}</span>
                </div>
            ` : ''}
        </div>

        <div class="info-block">
            <div class="info-title">Detalles de la Venta</div>
            <div class="info-row">
                <span class="label">Emisión:</span>
                <span class="value">${saleDate}</span>
            </div>
            <div class="info-row">
                <span class="label">Pago:</span>
                <span class="value">${paymentMethod}</span>
            </div>
            <div class="info-row">
                <span class="label">Estado:</span>
                <span class="value">${statusBadge}</span>
            </div>
            ${quotationRef ? `
                <div class="info-row">
                    <span class="label">Cotización:</span>
                    <span class="value">${quotationRef}</span>
                </div>
            ` : ''}
        </div>

    </div>

    <!-- ============================================
         TABLA DE PRODUCTOS
         ============================================ -->
    <div class="table-section">
        <div class="table-title">
            <span class="table-title-icon">📦</span>
            Productos y Servicios
        </div>

        <table>
            <thead>
                <tr>
                    <th>Img</th>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>P. Unit.</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
    </div>

    <!-- ============================================
         TOTALES
         ============================================ -->
    <div class="totals-section">
        <div class="totals-box">
            <div class="total-row">
                <span class="label">Subtotal</span>
                <span class="value">S/ ${subtotal.toFixed(2)}</span>
            </div>
            ${!includeIgv && igv > 0 ? `
                <div class="total-row">
                    <span class="label">IGV (18%)</span>
                    <span class="value">S/ ${igv.toFixed(2)}</span>
                </div>
            ` : ''}
            ${discount > 0 ? `
                <div class="total-row discount">
                    <span class="label">Descuento</span>
                    <span class="value">- S/ ${discount.toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="total-row grand-total">
                <span class="label">Total</span>
                <span class="value">S/ ${total.toFixed(2)}</span>
            </div>
        </div>
    </div>

    <!-- ============================================
         NOTAS
         ============================================ -->
    ${notes ? `
        <div class="notes-section">
            <div class="notes-title">📝 Notas</div>
            <div class="notes-text">${notes}</div>
        </div>
    ` : ''}

    <!-- ============================================
         FOOTER
         ============================================ -->
    <div class="footer">

        <div class="footer-brand">
            <div class="footer-logo">
                ${logoUrl
                    ? `<img src="${logoUrl}" alt="${companyName}">`
                    : `<span>🛡️</span>`
                }
            </div>
            <div>
                <div class="footer-brand-name">${companyName}</div>
                <div class="footer-brand-tagline">${companyTagline}</div>
            </div>
        </div>

        <div class="footer-grid">
            ${companyFullAddress ? `
                <div class="footer-item">
                    <span class="fi-icon">📍</span>
                    <span>${companyFullAddress}</span>
                </div>
            ` : ''}
            ${companyPhone ? `
                <div class="footer-item">
                    <span class="fi-icon">📞</span>
                    <span>${companyPhone}</span>
                </div>
            ` : ''}
            ${companyEmail ? `
                <div class="footer-item">
                    <span class="fi-icon">📧</span>
                    <span>${companyEmail}</span>
                </div>
            ` : ''}
            ${companyRuc ? `
                <div class="footer-item">
                    <span class="fi-icon">🆔</span>
                    <span>RUC: ${companyRuc}</span>
                </div>
            ` : ''}
            ${SOCIAL.whatsapp ? `
                <div class="footer-item">
                    <span class="fi-icon">💬</span>
                    <span>WhatsApp: +${SOCIAL.whatsapp}</span>
                </div>
            ` : ''}
            ${SCHEDULE.weekdays ? `
                <div class="footer-item">
                    <span class="fi-icon">🕐</span>
                    <span>${SCHEDULE.weekdays}</span>
                </div>
            ` : ''}
        </div>

        <div class="footer-bottom">
            Recibo generado por ${createdBy} • ${new Date().toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
        </div>

    </div>

</div>

<script>
    window.onload = function() {
        setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 800);
        }, 400);
    };
<\/script>

</body>
</html>
    `);
    printWindow.document.close();
}