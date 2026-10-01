import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export async function GET() {
  const invoices = await db.invoice.findMany({
    include: { items: true },
    orderBy: { issuedAt: "desc" },
  });
  return NextResponse.json({ ok: true, invoices });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validación mínima
    const {
      issuerName, issuerCuit, issuerAddress,
      clientName, clientCuit, clientAddress, clientEmail,
      description, issuedAt, dueAt,
      usdRate, usdRateDate,
      items, taxRate = 0,
    } = body ?? {};

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ ok: false, error: "Falta el nombre del cliente" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "La factura debe tener al menos un ítem" }, { status: 400 });
    }
    if (!usdRate || usdRate <= 0) {
      return NextResponse.json({ ok: false, error: "La cotización USD es inválida" }, { status: 400 });
    }

    // Calcular subtotales
    let usdSubtotal = 0;
    const itemsData = items.map((it: InvoiceItemInput, i: number) => {
      const qty = Number(it.quantity) || 1;
      const unit = Number(it.unitPrice) || 0;
      const usdAmount = +(qty * unit).toFixed(2);
      const arsAmount = +(usdAmount * usdRate).toFixed(2);
      usdSubtotal += usdAmount;
      return {
        description: it.description || `Ítem ${i + 1}`,
        quantity: qty,
        unitPrice: unit,
        usdAmount,
        arsAmount,
      };
    });
    usdSubtotal = +usdSubtotal.toFixed(2);
    const taxRateNum = Number(taxRate) || 0;
    const usdTaxAmount = +(usdSubtotal * taxRateNum / 100).toFixed(2);
    const usdTotal = +(usdSubtotal + usdTaxAmount).toFixed(2);
    const arsSubtotal = +(usdSubtotal * usdRate).toFixed(2);
    const arsTaxAmount = +(usdTaxAmount * usdRate).toFixed(2);
    const arsTotal = +(usdTotal * usdRate).toFixed(2);

    // Obtener número correlativo
    const settings = await db.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    const prefix = settings.invoicePrefix || "001";
    const seq = settings.nextInvoiceNumber || 1;
    const number = `${prefix}-${String(seq).padStart(6, "0")}`;

    const invoice = await db.invoice.create({
      data: {
        number,
        issuerName: issuerName || settings.companyName || "IMA Soluciones",
        issuerCuit: issuerCuit || settings.companyCuit || "",
        issuerAddress: issuerAddress || settings.companyAddress || "",
        clientName,
        clientCuit,
        clientAddress,
        clientEmail,
        description,
        issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
        dueAt: dueAt ? new Date(dueAt) : null,
        usdRate: Number(usdRate),
        usdRateDate: usdRateDate ? new Date(usdRateDate) : new Date(),
        usdSubtotal,
        usdTaxRate: taxRateNum,
        usdTaxAmount,
        usdTotal,
        arsSubtotal,
        arsTaxAmount,
        arsTotal,
        status: "pendiente",
        items: { create: itemsData },
      },
      include: { items: true },
    });

    // Incrementar correlativo
    await db.settings.update({
      where: { id: "singleton" },
      data: { nextInvoiceNumber: seq + 1 },
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (err) {
    console.error("Error creando factura:", err);
    return NextResponse.json(
      { ok: false, error: "Error al crear factura", detail: String(err) },
      { status: 500 }
    );
  }
}
