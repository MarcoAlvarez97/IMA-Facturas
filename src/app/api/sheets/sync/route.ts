import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensure-schema";

// Sincroniza una factura a Google Sheets vía Web App de Apps Script.
// IMPORTANTE: el Web App debe estar deployado con "Quién puede acceder: Cualquiera"
// (sin login). Si se deja "Cualquiera con cuenta de Google" devuelve 403.

interface InvoiceWithItems {
  id: string;
  number: string;
  issuerName: string;
  issuerCuit: string;
  clientName: string;
  clientCuit: string | null;
  clientEmail: string | null;
  description: string | null;
  issuedAt: Date;
  dueAt: Date | null;
  usdRate: number;
  usdTotal: number;
  arsTotal: number;
  status: string;
  paidAt: Date | null;
  items: Array<{ description: string; quantity: number; unitPrice: number; usdAmount: number; arsAmount: number }>;
}

function rowFromInvoice(inv: InvoiceWithItems): Record<string, string | number> {
  return {
    id: inv.id,
    numero: inv.number,
    fecha: new Date(inv.issuedAt).toISOString().split("T")[0],
    vencimiento: inv.dueAt ? new Date(inv.dueAt).toISOString().split("T")[0] : "",
    cliente: inv.clientName,
    cuit_cliente: inv.clientCuit || "",
    email_cliente: inv.clientEmail || "",
    descripcion: inv.description || "",
    items: inv.items.map((i) => `${i.description} x${i.quantity} @ USD ${i.unitPrice}`).join(" | "),
    usd_total: inv.usdTotal,
    cotizacion_usd: inv.usdRate,
    ars_total: inv.arsTotal,
    estado: inv.status,
    fecha_pago: inv.paidAt ? new Date(inv.paidAt).toISOString().split("T")[0] : "",
  };
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const invoiceId: string | undefined = body?.invoiceId;
    if (!invoiceId) {
      return NextResponse.json({ ok: false, error: "Falta invoiceId" }, { status: 400 });
    }

    const settings = await db.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    const webAppUrl = settings.sheetsWebAppUrl;
    if (!webAppUrl) {
      return NextResponse.json(
        { ok: false, error: "Falta configurar la URL del Web App de Google Sheets en Configuración" },
        { status: 400 }
      );
    }

    const invoice = (await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    })) as InvoiceWithItems | null;
    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Factura no encontrada" }, { status: 404 });
    }

    const row = rowFromInvoice(invoice);
    const payload = JSON.stringify({ action: "upsertInvoice", row });

    // IMPORTANTE: usar text/plain para que no haya preflight CORS desde el navegador.
    // Aunque esto corre server-side, Apps Script a veces rechaza application/json.
    const res = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      redirect: "follow",
    });

    const text = await res.text();

    // Detectar si el Web App no está configurado como "Cualquiera"
    if (res.status === 403 || text.includes("您需要存取權") || text.includes("request-access") || text.includes("需要存取權") || text.includes("<title>拒絕存取</title>")) {
      return NextResponse.json({
        ok: false,
        error: "El Web App de Google Sheets no es accesible públicamente. Re-deployá el script con: 'Quién puede acceder: Cualquiera' (sin login).",
        hint: "En Apps Script: Implementar → Administrar implementaciones → Editar → Quién puede acceder: Cualquiera → Guardar.",
        status: res.status,
      }, { status: 502 });
    }

    // Detectar si el Web App fue borrado o la URL cambió (Google devuelve HTML en chino)
    if (text.includes("找不到頁面") || text.includes("抱歉，現時無法開啟該檔案") || (text.includes("<html") && !text.includes("{"))) {
      return NextResponse.json({
        ok: false,
        error: "La URL del Web App de Google Sheets no es válida o el script fue eliminado. Verificá la URL en Apps Script → Implementar → Administrar implementaciones.",
        hint: "Si re-deployaste el script, copiá la URL nueva y pegala en Configuración.",
        detail: text.substring(0, 200),
      }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: `Google Sheets respondió con error ${res.status}`,
        detail: text.substring(0, 500),
      }, { status: 502 });
    }

    // Intentar parsear la respuesta como JSON
    let data: unknown = null;
    let parsedOk = false;
    try {
      data = JSON.parse(text);
      parsedOk = true;
    } catch {
      // Si no es JSON, probablemente es HTML de Google pidiendo login
      if (text.includes("<html") || text.includes("<!DOCTYPE")) {
        return NextResponse.json({
          ok: false,
          error: "Google Sheets devolvió una página HTML en lugar de ejecutar el script. La URL del Web App es inválida o el script fue borrado.",
          hint: "Verificá la URL en Apps Script → Implementar → Administrar implementaciones. Si re-deployaste, copiá la URL nueva.",
        }, { status: 502 });
      }
      data = text.substring(0, 500);
    }

    // Solo marcar como sincronizado si el JSON de respuesta tiene ok: true
    if (parsedOk && typeof data === "object" && data !== null && (data as { ok?: boolean }).ok === true) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { sheetsSynced: true },
      });
      return NextResponse.json({ ok: true, response: data });
    } else if (parsedOk && typeof data === "object" && data !== null && (data as { ok?: boolean }).ok === false) {
      // El script respondió JSON pero con error
      return NextResponse.json({
        ok: false,
        error: "El script de Google Sheets respondió con error: " + ((data as { error?: string }).error || "desconocido"),
        detail: data,
      }, { status: 502 });
    }

    // Respuesta inesperada (no JSON ni HTML conocido)
    await db.invoice.update({
      where: { id: invoiceId },
      data: { sheetsSynced: true },
    });
    return NextResponse.json({ ok: true, response: data, warning: "Respuesta no-JSON del Web App" });
  } catch (err) {
    console.error("Sheets sync error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
