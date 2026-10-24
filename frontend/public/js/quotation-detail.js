// ============================================================
// quotation-detail.js - Lógica para la vista de detalle de cotización
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // --- 1. IMPRESIÓN ---
    // Función global para imprimir (se llama desde el botón)
    window.printQuotation = function(quotation) {
        if (!quotation) {
            alert('No hay datos de cotización para imprimir');
            return;
        }

        // Función auxiliar para formatear fecha
        function formatDate(dateStr) {
            if (!dateStr) return '-';
            const d = new Date(dateStr);
            return d.toLocaleDateString('es-PE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Datos del cliente
        const clientName = quotation.client ? quotation.client.businessName : 'Cliente Anónimo';
        const clientRuc = quotation.rucDni || quotation.client?.ruc || 'No especificado';
        const clientPhone = quotation.celular || quotation.client?.phone || 'No especificado';
        const clientEmail = quotation.client?.email || '';

        // Datos de la cotización
        const quotationNumber = quotation.number || 'COT-0000';
        const quotationDate = formatDate(quotation.createdAt);
        const validUntil = quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('es-PE') : 'No especificada';
        const paymentMethod = quotation.modalidadPago || 'Contado';
        const guarantee = quotation.garantiaMeses > 0 ? `${quotation.garantiaMeses} meses` : 'No especificada';
        const notes = quotation.notas || 'Sin notas adicionales';
        const createdBy = quotation.createdBy ? quotation.createdBy.name : 'Usuario';

        // Totales
        const subtotal = quotation.subtotal || 0;
        const igv = quotation.igv || 0;
        const discount = quotation.discount || 0;
        const total = quotation.total || 0;
        const includeIgv = quotation.includeIgv !== undefined ? quotation.includeIgv : true;

        // Construir filas de la tabla
        let itemsHtml = '';
        if (quotation.items && quotation.items.length > 0) {
            quotation.items.forEach((item) => {
                const productName = item.product && item.product.name ? item.product.name : item.description;
                const productModel = item.product && item.product.model ? ` | ${item.product.model}` : '';
                const imageUrl = item.image || '/img/product-default.png';
                itemsHtml += `
                    <tr>
                        <td style="text-align: center; vertical-align: middle;">
                            <img src="${imageUrl}" width="40" height="40" style="object-fit: contain; border-radius: 4px;" onerror="this.src='/img/product-default.png'">
                        </td>
                        <td style="vertical-align: middle;">
                            <strong>${productName}</strong>
                            ${productModel ? `<br><small style="color: #6c757d;">${productModel}</small>` : ''}
                        </td>
                        <td style="text-align: center; vertical-align: middle;">${item.quantity}</td>
                        <td style="text-align: right; vertical-align: middle;">S/. ${item.unitPrice.toFixed(2)}</td>
                        <td style="text-align: right; vertical-align: middle; font-weight: 500;">S/. ${item.total.toFixed(2)}</td>
                    </tr>
                `;
            });
        } else {
            itemsHtml = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                        No hay productos en esta cotización
                    </td>
                </tr>
            `;
        }

        // Abrir ventana de impresión
        const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
        if (!printWindow) {
            alert('Por favor, permita ventanas emergentes para imprimir');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cotización ${quotationNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #333; padding: 30px; max-width: 1000px; margin: 0 auto; }
                    .print-container { background: #fff; padding: 20px; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a73e8; padding-bottom: 20px; margin-bottom: 25px; }
                    .header-left { display: flex; align-items: center; gap: 15px; }
                    .header-left img { height: 80px; max-width: 200px; object-fit: contain; }
                    .header-left .company-info h2 { font-size: 24px; color: #1a73e8; margin: 0; }
                    .header-left .company-info p { margin: 2px 0; font-size: 13px; color: #555; }
                    .header-right { text-align: right; }
                    .header-right .doc-title { font-size: 28px; font-weight: 700; color: #1a73e8; letter-spacing: 2px; }
                    .header-right .doc-number { font-size: 18px; font-weight: 600; color: #333; margin-top: 5px; }
                    .header-right .doc-date { font-size: 14px; color: #777; margin-top: 3px; }
                    .client-section { background: #f8f9fa; border-radius: 8px; padding: 15px 20px; margin-bottom: 25px; display: flex; flex-wrap: wrap; justify-content: space-between; }
                    .client-section .client-info { flex: 2; min-width: 250px; }
                    .client-section .client-info p { margin: 4px 0; font-size: 14px; }
                    .client-section .client-info .label { font-weight: 600; color: #555; }
                    .client-section .order-info { flex: 1; min-width: 200px; text-align: right; }
                    .client-section .order-info p { margin: 4px 0; font-size: 14px; }
                    .client-section .order-info .label { font-weight: 600; color: #555; }
                    .table-wrapper { overflow-x: auto; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; font-size: 14px; }
                    thead th { background: #1a73e8; color: #fff; padding: 10px 12px; text-align: center; font-weight: 600; border: 1px solid #1a73e8; }
                    tbody td { padding: 10px 12px; border-bottom: 1px solid #e9ecef; vertical-align: middle; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .fw-bold { font-weight: 600; }
                    .totals-box { display: flex; justify-content: flex-end; padding: 15px 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 25px; }
                    .totals-box .totals-inner { min-width: 280px; }
                    .totals-box .totals-inner p { display: flex; justify-content: space-between; margin: 5px 0; font-size: 15px; }
                    .totals-box .totals-inner .total-line { border-top: 2px solid #1a73e8; padding-top: 8px; margin-top: 8px; font-size: 20px; font-weight: 700; color: #1a73e8; }
                    .totals-box .totals-inner .discount-line { color: #d32f2f; }
                    .notes-section { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 18px; border-radius: 4px; margin-bottom: 20px; }
                    .notes-section .label { font-weight: 600; color: #856404; }
                    .notes-section .note-text { color: #856404; margin-top: 3px; }
                    .footer { margin-top: 30px; border-top: 2px solid #e9ecef; padding-top: 20px; text-align: center; font-size: 13px; color: #6c757d; }
                    .footer .company-name { font-size: 16px; font-weight: 700; color: #1a73e8; }
                    .footer .company-details { margin-top: 5px; line-height: 1.6; }
                    .footer .company-details span { margin: 0 10px; }
                    @media print { body { padding: 0; } .print-container { padding: 15px; } .no-print { display: none !important; } table { page-break-inside: auto; } tr { page-break-inside: avoid; page-break-after: auto; } thead { display: table-header-group; } tfoot { display: table-footer-group; } }
                    @media (max-width: 768px) { .header { flex-direction: column; align-items: center; text-align: center; } .header-left { flex-direction: column; align-items: center; } .header-right { text-align: center; margin-top: 10px; } .client-section { flex-direction: column; align-items: center; text-align: center; } .client-section .order-info { text-align: center; margin-top: 10px; } .totals-box { justify-content: center; } }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <div class="header-left">
                            <img src="/img/logo-1.svg" alt="Logo" onerror="this.style.display='none'">
                            <div class="company-info">
                                <h2>JP SECURITY SISTEM S.A.C.</h2>
                                <p>Especialistas en sistemas de seguridad electrónica</p>
                                <p>RUC: 20602355684</p>
                            </div>
                        </div>
                        <div class="header-right">
                            <div class="doc-title">COTIZACIÓN</div>
                            <div class="doc-number">${quotationNumber}</div>
                            <div class="doc-date">${quotationDate}</div>
                        </div>
                    </div>

                    <div class="client-section">
                        <div class="client-info">
                            <p><span class="label">Cliente:</span> ${clientName}</p>
                            <p><span class="label">RUC / DNI:</span> ${clientRuc}</p>
                            <p><span class="label">Celular:</span> ${clientPhone}</p>
                            ${clientEmail ? `<p><span class="label">Email:</span> ${clientEmail}</p>` : ''}
                        </div>
                        <div class="order-info">
                            <p><span class="label">Fecha Emisión:</span> ${quotationDate}</p>
                            <p><span class="label">Válido hasta:</span> ${validUntil}</p>
                            <p><span class="label">Pago:</span> ${paymentMethod}</p>
                            <p><span class="label">Garantía:</span> ${guarantee}</p>
                        </div>
                    </div>

                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 10%;">Img</th>
                                    <th style="width: 40%;">Descripción</th>
                                    <th style="width: 15%;">Cantidad</th>
                                    <th style="width: 15%;">P. Unitario</th>
                                    <th style="width: 20%;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="totals-box">
                        <div class="totals-inner">
                            <p><span>Subtotal</span><span>S/. ${subtotal.toFixed(2)}</span></p>
                            ${!includeIgv && igv > 0 ? `<p><span>IGV (18%)</span><span>S/. ${igv.toFixed(2)}</span></p>` : ''}
                            ${discount > 0 ? `<p class="discount-line"><span>Descuento</span><span>- S/. ${discount.toFixed(2)}</span></p>` : ''}
                            <p class="total-line"><span>TOTAL</span><span>S/. ${total.toFixed(2)}</span></p>
                        </div>
                    </div>

                    ${notes && notes !== 'Sin notas adicionales' ? `
                        <div class="notes-section">
                            <div class="label">📝 Notas</div>
                            <div class="note-text">${notes}</div>
                        </div>
                    ` : ''}

                    <div class="footer">
                        <div class="company-name">JP SECURITY SISTEM S.A.C.</div>
                        <div class="company-details">
                            <span>📍 Av Libertad 1443 – San Miguel - Lima – Perú</span>
                            <span>📞 935 909 756</span>
                            <span>🌐 www.jpsecuritys.netlify.app</span>
                            <br>
                            <span>RUC: 20602355684</span>
                            <span>📧 info@jpsecurity.com</span>
                        </div>
                        <div style="margin-top: 10px; font-size: 12px; color: #999;">
                            Cotización generada por ${createdBy} • ${new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        }, 300);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- 2. MODAL CREAR VENTA ---
    const clientSelect = document.getElementById('clientId');
    const newClientFields = document.getElementById('nuevoClienteFields');

    if (clientSelect) {
        clientSelect.addEventListener('change', function() {
            if (this.value === 'new') {
                if (newClientFields) {
                    newClientFields.style.display = 'block';
                    // Hacer obligatorios los campos de nuevo cliente
                    const inputs = newClientFields.querySelectorAll('input');
                    inputs.forEach(inp => inp.required = true);
                }
            } else {
                if (newClientFields) {
                    newClientFields.style.display = 'none';
                    const inputs = newClientFields.querySelectorAll('input');
                    inputs.forEach(inp => inp.required = false);
                }
            }
        });
    }

    // Botón "Nuevo Cliente" dentro del modal
    const btnNewClient = document.getElementById('btnNuevoClienteVenta');
    if (btnNewClient && clientSelect) {
        btnNewClient.addEventListener('click', function() {
            clientSelect.value = 'new';
            clientSelect.dispatchEvent(new Event('change'));
        });
    }

    // --- 3. VALIDACIÓN DEL FORMULARIO DE VENTA ---
    const formCrearVenta = document.getElementById('formCrearVenta');
    if (formCrearVenta) {
        formCrearVenta.addEventListener('submit', function(e) {
            // Si se seleccionó "new", validar que los campos estén llenos
            if (clientSelect && clientSelect.value === 'new') {
                const nombre = document.getElementById('clienteNombreVenta');
                if (!nombre || !nombre.value.trim()) {
                    e.preventDefault();
                    alert('Por favor, ingrese el nombre del nuevo cliente.');
                    nombre.focus();
                    return false;
                }
            }
            // El formulario se enviará normalmente
            return true;
        });
    }

    // --- 4. MENSAJES FLASH (opcional) ---
    // Si hay mensajes flash, mostrarlos con Toast o alert
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(function(msg) {
        setTimeout(function() {
            msg.style.transition = 'opacity 1s';
            msg.style.opacity = '0';
            setTimeout(function() {
                msg.remove();
            }, 1000);
        }, 5000);
    });

    // --- 5. BOTÓN IMPRIMIR (alternativa usando la función global) ---
    // Ya está definida window.printQuotation, solo asegurar que el botón la llame
    console.log('✅ quotation-detail.js cargado correctamente');
});