import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensure-schema";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await ctx.params;
  const body = await req.json();
  const newStatus = body.status; // "pendiente" | "pagada" | "anulada" | "vencida"

  if (!["pendiente", "pagada", "anulada", "vencida"].includes(newStatus)) {
    return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
  }

  const updated = await db.invoice.update({
    where: { id },
    data: {
      status: newStatus,
      paidAt: newStatus === "pagada" ? new Date() : null,
    },
    include: { items: true },
  });
  return NextResponse.json({ ok: true, invoice: updated });
}
