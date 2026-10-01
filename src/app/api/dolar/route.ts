import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Caché en memoria — la cotización del BNA se actualiza 1 vez por día hábil.
// Refrescamos cada 30 minutos para estar seguros de captar la actualización diaria.
let cachedRate: { buy: number; sell: number; date: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

async function fetchBnaRate(): Promise<{ buy: number; sell: number; date: string }> {
  // Usamos dolarapi.com que provee el oficial del BNA
  const res = await fetch("https://dolarapi.com/v1/dolares/oficial", {
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`dolarapi respondió ${res.status}`);
  }
  const data = await res.json();
  return {
    buy: Number(data.compra) || 0,
    sell: Number(data.venta) || 0,
    date: data.fechaActualizacion || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  const now = Date.now();
  const isStale = !cachedRate || now - cachedRate.fetchedAt > CACHE_TTL_MS;

  if (forceRefresh || isStale) {
    try {
      const fresh = await fetchBnaRate();
      cachedRate = { ...fresh, fetchedAt: now };
      try {
        await db.dollarRate.create({
          data: {
            source: "BNA",
            buy: fresh.buy,
            sell: fresh.sell,
            fetchedAt: new Date(),
          },
        });
      } catch {
        /* no fallar por esto */
      }
    } catch (err) {
      if (!cachedRate) {
        return NextResponse.json(
          { ok: false, error: "No se pudo obtener la cotización del BNA", detail: String(err) },
          { status: 502 }
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    source: "BNA",
    buy: cachedRate!.buy,
    sell: cachedRate!.sell,
    // Para facturación usamos el precio de VENTA (es lo que el cliente paga)
    rate: cachedRate!.sell,
    date: cachedRate!.date,
    fetchedAt: new Date(cachedRate!.fetchedAt).toISOString(),
  });
}
