# IMA Facturas

Sistema de facturación con cotización automática del BNA (Banco Nación Argentina) y sincronización opcional con Google Sheets.

## Características

- 📊 **Cotización BNA automática** — Precio de venta del dólar actualizado cada 30 minutos.
- 🧾 **Facturas en USD, PDF en ARS** — Cargás los montos en USD, el sistema los convierte al precio de venta BNA y el PDF se imprime con el total en ARS.
- 📋 **Panel de facturas** — Lista todas las facturas con estados: Pendiente / Pagada / Vencida / Anulada.
- 📤 **Google Sheets** — Sincronizá cada factura con tu Google Sheet para llevar control compartido.
- 🎨 **Paleta IMA** — Misma estética que ima-cotizador.vercel.app.

---

## 🚀 Deploy en Vercel (recomendado)

### Paso 1: Subir el código a GitHub

1. Creá un repo nuevo en GitHub (ej: `ima-facturas`).
2. Descargá esta carpeta y subila al repo (o usá `git init` + `git push`).

### Paso 2: Crear base de datos PostgreSQL gratuita

Vercel no soporta SQLite en serverless, así que usamos PostgreSQL. La opción más fácil es **Neon** (gratis, sin tarjeta de crédito):

1. Andá a https://neon.tech y creá una cuenta.
2. Creá un proyecto nuevo (ej: "ima-facturas").
3. Copiá la **connection string** que te da (algo así: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`).

> También podés usar Vercel Postgres, Supabase o Railway. Cualquier Postgres sirve.

### Paso 3: Importar en Vercel

1. Andá a https://vercel.com/new
2. Importá tu repo de GitHub.
3. Framework: **Next.js** (lo detecta solo).
4. En **Environment Variables**, agregá:
   - `DATABASE_URL` = (la URL de Neon que copiaste en el paso 2)
5. Clickeá **Deploy**. Va a fallar la primera vez porque falta crear las tablas — no te preocupés, seguí al paso 4.

### Paso 4: Crear las tablas

Vercel te va a dar un dominio como `ima-facturas.vercel.app`. Pero antes de probar, hay que crear las tablas en la base:

1. Andá a la pestaña **Settings → Storage** del proyecto en Vercel, o abrí el dashboard de Neon.
2. La forma más fácil: en tu compu, cloná el repo, configurá `.env` con tu `DATABASE_URL`, y corré:
   ```bash
   npm install
   npx prisma db push
   ```
3. Listo. Ya están las tablas creadas.

> Alternativa: si tenés la CLI de Vercel instalada, también podés correr `npx prisma db push` desde tu compu apuntando a la DATABASE_URL de Vercel.

### Paso 5: Probar la app

1. Entrá a tu dominio de Vercel (`ima-facturas.vercel.app`).
2. Vas a ver la pantalla principal con el precio de venta BNA arriba.
3. Probá crear una factura → "Emitir factura" → cargar datos → "Emitir".
4. Andá a "Mis facturas" → "Ver / PDF" → "Imprimir / Guardar PDF".

---

## 🔌 Conectar Google Sheets

1. Abrí tu Google Sheet (nuevo o existente).
2. Menú: **Extensiones → Apps Script**.
3. En la app (pestaña **Configuración** → "Integración con Google Sheets"), clickeá **"Copiar"** el código.
4. Pegalo en el editor de Apps Script (borrá lo que viene por defecto).
5. **Implementar → Nueva implementación**.
6. En el engranaje (arriba a la izquierda), elegí: **Aplicación web**.
7. Configurá:
   - Descripción: `IMA Facturas v1`
   - Ejecutar como: **Tú mismo**
   - **Quién puede acceder: "Cualquiera"** ← MUY IMPORTANTE (no "Cualquiera con cuenta de Google")
8. Clickeá **Implementar** y autorizá los permisos.
9. Copiá la **URL del Web App** (`https://script.google.com/macros/s/.../exec`).
10. En la app → pestaña **Configuración** → pegá la URL en "URL del Web App de Google Sheets" → **Guardar**.
11. Para sincronizar una factura: pestaña **Mis facturas** → botón **Sheets** (violeta).

> Si te aparece el error *"Web App no es accesible públicamente"*, es porque te olvidaste del paso 7 (acceso: Cualquiera). Re-deployá el script con ese setting.

---

## 💻 Correr en local (Visual Studio Code)

### Requisitos

- Node.js 18+ (https://nodejs.org)
- VS Code con la extensión ESLint y Prettier (recomendado)

### Pasos

```bash
# 1. Descomprimir / clonar la carpeta
cd ima-facturas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
#    Para SQLite (más fácil, pero solo local):
#    - En prisma/schema.prisma cambiá provider = "postgresql" por provider = "sqlite"
#    - Creá un archivo .env con: DATABASE_URL="file:./dev.db"
#    
#    Para PostgreSQL (igual que en producción):
#    - Creá un archivo .env con: DATABASE_URL="postgresql://..."

# 4. Crear las tablas en la base
npx prisma db push

# 5. Levantar el server
npm run dev

# 6. Abrí http://localhost:3000 en tu navegador
```

---

## 📁 Estructura del proyecto

```
ima-facturas/
├── prisma/
│   └── schema.prisma              # Esquema de base de datos (PostgreSQL por defecto)
├── public/
│   └── logo.png                   # Logo IMA
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout raíz
│   │   ├── page.tsx               # Página principal con tabs
│   │   ├── globals.css            # Estilos con paleta IMA
│   │   └── api/
│   │       ├── dolar/route.ts     # Cotización BNA (cache 30 min)
│   │       ├── invoices/route.ts  # GET/POST facturas
│   │       ├── invoices/[id]/route.ts     # GET/DELETE factura
│   │       ├── invoices/[id]/status/route.ts  # PATCH estado
│   │       ├── settings/route.ts  # GET/PUT configuración
│   │       ├── sheets/sync/route.ts   # POST sync Google Sheets
│   │       └── sheets/script/route.ts # GET código Apps Script
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── header.tsx         # Header con logo IMA
│   │   │   ├── dolar-widget.tsx   # Widget cotización BNA
│   │   │   └── settings-panel.tsx # Panel de configuración
│   │   ├── invoices/
│   │   │   ├── create-invoice.tsx # Formulario crear factura
│   │   │   ├── invoices-list.tsx  # Lista de facturas
│   │   │   └── invoice-viewer.tsx # Visor imprimible (PDF)
│   │   └── ui/                    # shadcn/ui components
│   └── lib/
│       ├── db.ts                  # Cliente Prisma
│       ├── format.ts              # Formatadores ARS/USD/fecha
│       └── utils.ts               # cn() helper
├── .env.example                   # Template de variables de entorno
├── package.json                   # Dependencias
├── next.config.ts                 # Config de Next.js
├── tsconfig.json                  # Config de TypeScript
├── tailwind.config.ts             # Config de Tailwind
└── README.md                      # Este archivo
```

---

## 🛠️ Stack técnico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **ORM**: Prisma 6
- **DB**: PostgreSQL (Neon / Vercel Postgres / Supabase)
- **Fuente cotización**: dolarapi.com (BNA oficial)
- **PDF**: CSS @media print + window.print()

---

## ❓ Preguntas frecuentes

**¿La cotización se actualiza sola?**  
Sí. Cada 30 minutos el server consulta la API del BNA. También podés forzar la actualización con el botón circular ↻ arriba a la derecha del widget.

**¿Puedo usar la app desde el celu?**  
Sí, una vez deployada en Vercel la URL es accesible desde cualquier dispositivo.

**¿Las facturas se guardan en mi celu?**  
No, se guardan en la base de datos (PostgreSQL en Neon/Vercel). Por eso las ves desde cualquier dispositivo.

**¿Google Sheets es obligatorio?**  
No. Es opcional. Si no lo configurás, las facturas igual se guardan en la base de datos y las podés ver/imprimir desde la app.

**¿Cómo cambio el logo?**  
Reemplazá el archivo `public/logo.png` con tu nuevo logo (mismo nombre) y reiniciá el server.

**¿Puedo cambiar el IVA por defecto?**  
Sí, en la pestaña **Configuración** → "IVA por defecto (%)". También lo cambiás por factura en el formulario de creación.

---

## 📝 Notas

- Esta app NO emite comprobantes fiscales válidos para AFIP. Es un sistema de gestión interna. Para facturación formal AFIP, consultá a tu contador.
- La cotización USD→ARS corresponde al precio de venta del BNA al momento de emitir la factura. Ese valor queda "congelado" en la factura — no se recalcula si cambia la cotización después.
- Los datos del emisor se configuran una vez y se aplican a todas las facturas nuevas.

---

## 🆘 Soporte

Si algo no funciona:
1. Revisá la consola del navegador (F12 → Console) por errores.
2. Si el problema es Google Sheets, asegurate de haber configurado "Cualquiera" en el acceso del Web App.
3. Si el problema es la base de datos, verificá que `DATABASE_URL` esté bien y que hayas corrido `npx prisma db push`.
