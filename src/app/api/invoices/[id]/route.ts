import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensure-schema";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await ctx.params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Factura no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, invoice });
}

// PATCH /api/invoices/[id] — editar factura completa o parcial
// Body (todos opcionales, pero al menos uno):
// {
//   number?: string,
//   clientName?: string,
//   clientCuit?: string,
//   clientAddress?: string,
//   clientEmail?: string,
//   description?: string,
//   issuedAt?: string,
//   dueAt?: string,
//   items?: [{ description, quantity, unitPrice }],
//   taxRate?: number,
//   usdRate?: number  // si se cambia, recalcula ARS
// }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await ctx.params;

  try {
    const body = await req.json();

    const existing = await db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Factura no encontrada" }, { status: 404 });
    }

    // 1) Validar número único si se quiere cambiar
    if (body.number && body.number !== existing.number) {
      const exists = await db.invoice.findUnique({ where: { number: body.number } });
      if (exists) {
        return NextResponse.json(
          { ok: false, error: `Ya existe una factura con el número ${body.number}` },
          { status: 400 }
        );
      }
    }

    // 2) Recalcular subtotales si vienen items nuevos o taxRate nuevo
    const itemsInput = Array.isArray(body.items) ? body.items : null;
    const taxRate = body.taxRate !== undefined ? Number(body.taxRate) : existing.usdTaxRate;
    const usdRate = body.usdRate !== undefined ? Number(body.usdRate) : existing.usdRate;

    let usdSubtotal = existing.usdSubtotal;
    let usdTaxAmount = existing.usdTaxAmount;
    let usdTotal = existing.usdTotal;
    let arsSubtotal = existing.arsSubtotal;
    let arsTaxAmount = existing.arsTaxAmount;
    let arsTotal = existing.arsTotal;
    let itemsData: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      usdAmount: number;
      arsAmount: number;
    }> | null = null;

    if (itemsInput) {
      usdSubtotal = 0;
      itemsData = itemsInput.map((it: { description: string; quantity: number; unitPrice: number }, i: number) => {
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
      usdTaxAmount = +(usdSubtotal * taxRate / 100).toFixed(2);
      usdTotal = +(usdSubtotal + usdTaxAmount).toFixed(2);
      arsSubtotal = +(usdSubtotal * usdRate).toFixed(2);
      arsTaxAmount = +(usdTaxAmount * usdRate).toFixed(2);
      arsTotal = +(usdTotal * usdRate).toFixed(2);
    } else if (body.taxRate !== undefined || body.usdRate !== undefined) {
      // Sin items nuevos pero cambió taxRate o usdRate → recalcular sobre el subtotal existente
      usdTaxAmount = +(usdSubtotal * taxRate / 100).toFixed(2);
      usdTotal = +(usdSubtotal + usdTaxAmount).toFixed(2);
      arsSubtotal = +(usdSubtotal * usdRate).toFixed(2);
      arsTaxAmount = +(usdTaxAmount * usdRate).toFixed(2);
      arsTotal = +(usdTotal * usdRate).toFixed(2);
    }

    // 3) Construir el objeto de actualización
    const updateData: Record<string, unknown> = {};
    if (body.number !== undefined) updateData.number = body.number;
    if (body.clientName !== undefined) updateData.clientName = body.clientName;
    if (body.clientCuit !== undefined) updateData.clientCuit = body.clientCuit || null;
    if (body.clientAddress !== undefined) updateData.clientAddress = body.clientAddress || null;
    if (body.clientEmail !== undefined) updateData.clientEmail = body.clientEmail || null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.issuedAt !== undefined) updateData.issuedAt = new Date(body.issuedAt);
    if (body.dueAt !== undefined) updateData.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.usdRate !== undefined) {
      updateData.usdRate = usdRate;
      updateData.usdRateDate = new Date();
    }
    if (body.taxRate !== undefined || body.usdRate !== undefined || itemsInput) {
      updateData.usdSubtotal = usdSubtotal;
      updateData.usdTaxRate = taxRate;
      updateData.usdTaxAmount = usdTaxAmount;
      updateData.usdTotal = usdTotal;
      updateData.arsSubtotal = arsSubtotal;
      updateData.arsTaxAmount = arsTaxAmount;
      updateData.arsTotal = arsTotal;
    }

    // 4) Actualizar items (si vinieron nuevos): borrar los viejos y crear los nuevos
    if (itemsData && itemsData.length > 0) {
      await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
      updateData.items = {
        create: itemsData,
      };
    }

    const updated = await db.invoice.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    return NextResponse.json({ ok: true, invoice: updated });
  } catch (err) {
    console.error("Error editando factura:", err);
    return NextResponse.json(
      { ok: false, error: "Error al editar factura", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await ctx.params;
  try {
    await db.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo eliminar" }, { status: 500 });
  }
}
