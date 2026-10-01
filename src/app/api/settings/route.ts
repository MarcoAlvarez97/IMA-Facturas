import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensure-schema";

export async function GET() {
  await ensureSchema();
  const settings = await db.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  await ensureSchema();
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  const fields = [
    "companyName", "companyCuit", "companyAddress",
    "companyPhone", "companyEmail", "defaultTaxRate",
    "sheetsWebAppUrl", "invoicePrefix", "nextInvoiceNumber",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }
  const updated = await db.settings.upsert({
    where: { id: "singleton" },
    update: allowed,
    create: { id: "singleton", ...allowed },
  });
  return NextResponse.json({ ok: true, settings: updated });
}
