import { db } from "@/lib/db";

// Crea todas las tablas si no existen. Esto corre automáticamente en cada
// request, así la app es "self-healing" — no necesita prisma db push manual.
// Usamos SQL directo (CREATE TABLE IF NOT EXISTS) para no fallar si ya existen.

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "issuerCuit" TEXT NOT NULL,
    "issuerAddress" TEXT,
    "clientName" TEXT NOT NULL,
    "clientCuit" TEXT,
    "clientAddress" TEXT,
    "clientEmail" TEXT,
    "description" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "usdRate" DOUBLE PRECISION NOT NULL,
    "usdRateDate" TIMESTAMP(3) NOT NULL,
    "usdSubtotal" DOUBLE PRECISION NOT NULL,
    "usdTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usdTaxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usdTotal" DOUBLE PRECISION NOT NULL,
    "arsSubtotal" DOUBLE PRECISION NOT NULL,
    "arsTaxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arsTotal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "paidAt" TIMESTAMP(3),
    "sheetsSynced" BOOLEAN NOT NULL DEFAULT false,
    "sheetsRowId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_number_key" ON "Invoice"("number");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "usdAmount" DOUBLE PRECISION NOT NULL,
    "arsAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "companyCuit" TEXT,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "defaultTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 21,
    "sheetsWebAppUrl" TEXT,
    "invoicePrefix" TEXT,
    "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DollarRate" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'BNA',
    "buy" DOUBLE PRECISION NOT NULL,
    "sell" DOUBLE PRECISION NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DollarRate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DollarRate_source_fetchedAt_idx" ON "DollarRate"("source", "fetchedAt");
`;

export async function ensureSchema() {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    try {
      // Ejecutar cada statement por separado (Algunos drivers no soportan multi-statement)
      const statements = CREATE_TABLES_SQL
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await db.$executeRawUnsafe(stmt);
        } catch (err: unknown) {
          // Ignorar errores de "ya existe" — son esperados si las tablas ya están creadas
          const msg = String(err).toLowerCase();
          if (
            msg.includes("already exists") ||
            msg.includes("duplicate") ||
            msg.includes("constraint")
          ) {
            // ok
          } else {
            console.error("ensureSchema statement error:", stmt.substring(0, 80), err);
          }
        }
      }

      // Crear settings singleton si no existe, con la URL de Google Sheets del usuario precargada
      try {
        await db.settings.upsert({
          where: { id: "singleton" },
          update: {},
          create: {
            id: "singleton",
            // URL de Google Sheets del usuario — precargada
            sheetsWebAppUrl:
              "https://script.google.com/macros/s/AKfycbzOeaNRhA3SOuCsw_31iwiDRjZ9nF5GKCv1IPzB1qKNRmUhy7XCCzTcoX7XIrXViWMjWA/exec",
            defaultTaxRate: 21,
            invoicePrefix: "001",
            nextInvoiceNumber: 1,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.error("ensureSchema settings upsert error:", err);
      }

      schemaReady = true;
    } catch (err) {
      console.error("ensureSchema fatal error:", err);
      schemaReady = false;
    } finally {
      schemaPromise = null;
    }
  })();

  return schemaPromise;
}
