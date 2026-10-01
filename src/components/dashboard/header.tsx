"use client";

export function Header() {
  return (
    <header className="ima-gradient shadow-lg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-xl sm:text-2xl font-extrabold leading-tight tracking-tight">
            Facturación
          </h1>
          <p className="text-white/75 text-xs sm:text-sm">
            IMA Soluciones Industriales · Argentina
          </p>
        </div>
        {/* Logo IMA blanco grande a la derecha */}
        <div className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="IMA Soluciones Industriales"
            className="object-contain brightness-0 invert"
            style={{ width: "auto", height: "48px" }}
          />
        </div>
      </div>
    </header>
  );
}
