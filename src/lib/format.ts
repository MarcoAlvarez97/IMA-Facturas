// Utilidades de formato para IMA Facturas

export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Convierte cualquier fecha a un Date LOCAL sin sufrir desfasaje de timezone.
// Si date es "2026-10-05" (string YYYY-MM-DD del input type=date),
// new Date("2026-10-05") lo interpreta como UTC midnight, y al mostrarlo en
// Argentina (UTC-3) se convierte en 04/10/2026. Para evitarlo, parseamos manual.
function parseLocalDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  if (typeof date !== "string") return new Date(date);

  const s = date.trim();

  // Caso 1: YYYY-MM-DD (de un input type="date") — fecha pura, sin timezone
  const dateOnlyMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
  }

  // Caso 2: ISO completo con Z (UTC) — convertir a local pero preservando la "hora lógica"
  // Ej: "2026-10-01T03:00:00.000Z"
  // Si termina con Z, lo mostramos tal cual en su día original UTC
  if (s.endsWith("Z") || s.includes("T")) {
    // Para fechas con tiempo, usar la parte de fecha tal cual
    const parts = s.split("T");
    if (parts.length === 2) {
      const datePart = parts[0]; // YYYY-MM-DD
      const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        // Si la hora es temprana (00:00-03:00 UTC), puede estar en el día anterior en AR
        // Para fechas guardadas, preservamos el día del string
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
      }
    }
  }

  // Fallback: dejar que Date lo maneje
  return new Date(s);
}

export function formatDateAR(date: Date | string): string {
  const d = parseLocalDate(date);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTimeAR(date: Date | string): string {
  // Para datetime usamos el parsing original porque sí nos interesa la hora exacta
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
  vencida: "Vencida",
};

export const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700 border-amber-200",
  pagada: "bg-green-100 text-green-700 border-green-200",
  anulada: "bg-slate-100 text-slate-700 border-slate-200",
  vencida: "bg-red-100 text-red-700 border-red-200",
};
