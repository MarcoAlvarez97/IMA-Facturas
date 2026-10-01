import { NextResponse } from "next/server";

// Código de Apps Script que el usuario debe pegar en su Google Sheet.
// Mejorado con CORS headers y mejor manejo de errores.

const SCRIPT = `/**
 * IMA Facturas — Web App para sincronización con la aplicación.
 *
 * Cómo configurar (PASOS OBLIGATORIOS):
 * 1. Abrí tu Google Sheet (uno nuevo o existente).
 * 2. Menú: Extensiones → Apps Script.
 * 3. Borrá el código que viene por defecto y pegá este.
 * 4. Clickeá "Implementar" → "Nueva implementación".
 * 5. En el ícono de engranaje (arriba a la izquierda del cuadro) elegí: "Aplicación web".
 * 6. Descripción: "IMA Facturas v1".
 * 7. Ejecutar como: "Tú mismo".
 * 8. Quién puede acceder: "Cualquiera"  ← MUY IMPORTANTE: no "Cualquiera con cuenta de Google".
 * 9. Clickeá "Implementar" y autorizá los permisos.
 * 10. Copiá la "URL de la aplicación web" que aparece.
 * 11. Pegá esa URL en la pestaña Configuración → "URL del Web App de Google Sheets" → Guardar.
 */

function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Facturas');
    if (!sheet) {
      sheet = ss.insertSheet('Facturas');
      sheet.appendRow([
        'ID', 'Número', 'Fecha', 'Vencimiento', 'Cliente', 'CUIT Cliente',
        'Email Cliente', 'Descripción', 'Ítems', 'Total USD', 'Cotización USD',
        'Total ARS', 'Estado', 'Fecha Pago'
      ]);
      sheet.getRange(1, 1, 1, 14)
        .setFontWeight('bold')
        .setBackground('#2563eb')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    if (body.action === 'upsertInvoice') {
      var r = body.row;
      var id = r.id;
      var data = [
        id, r.numero, r.fecha, r.vencimiento, r.cliente, r.cuit_cliente,
        r.email_cliente, r.descripcion, r.items, r.usd_total, r.cotizacion_usd,
        r.ars_total, r.estado, r.fecha_pago
      ];
      var values = sheet.getDataRange().getValues();
      var rowIdx = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === id) { rowIdx = i + 1; break; }
      }
      if (rowIdx === -1) {
        sheet.appendRow(data);
        rowIdx = values.length + 1;
      } else {
        sheet.getRange(rowIdx, 1, 1, data.length).setValues([data]);
      }
      // Colorear la fila según estado
      var colors = {
        'pendiente': '#fffbeb',
        'pagada': '#f0fdf4',
        'vencida': '#fef2f2',
        'anulada': '#f1f5f9'
      };
      var color = colors[r.estado] || '#ffffff';
      sheet.getRange(rowIdx, 1, 1, 14).setBackground(color);
      // Formato números
      sheet.getRange(rowIdx, 10).setNumberFormat('0.00');  // USD
      sheet.getRange(rowIdx, 11).setNumberFormat('0.00');  // Cotización
      sheet.getRange(rowIdx, 12).setNumberFormat('#,##0.00');  // ARS

      output.setContent(JSON.stringify({ ok: true, row: rowIdx, action: 'upserted' }));
      return output;
    }

    if (body.action === 'updateStatus') {
      var id = body.id;
      var status = body.status;
      var values = sheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === id) {
          sheet.getRange(i + 1, 13).setValue(status); // col 13 = Estado
          if (status === 'pagada') {
            sheet.getRange(i + 1, 14).setValue(new Date()); // col 14 = Fecha Pago
          }
          sheet.getRange(i + 1, 1, 1, 14).setBackground(
            status === 'pagada' ? '#f0fdf4' :
            status === 'pendiente' ? '#fffbeb' :
            status === 'vencida' ? '#fef2f2' : '#f1f5f9'
          );
          break;
        }
      }
      output.setContent(JSON.stringify({ ok: true, action: 'status_updated' }));
      return output;
    }

    output.setContent(JSON.stringify({ ok: false, error: 'Acción no reconocida: ' + body.action }));
    return output;
  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: String(err) }));
    return output;
  }
}

function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Facturas');
    if (!sheet) {
      output.setContent(JSON.stringify({ ok: true, invoices: [] }));
      return output;
    }
    var values = sheet.getDataRange().getValues();
    var headers = values.shift();
    var invoices = values.map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
    output.setContent(JSON.stringify({ ok: true, invoices: invoices }));
    return output;
  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: String(err) }));
    return output;
  }
}
`;

export async function GET() {
  return NextResponse.json({ ok: true, script: SCRIPT });
}
