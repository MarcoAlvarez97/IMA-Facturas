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
