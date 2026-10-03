/* eslint-disable @next/next/no-img-element */
export function BrandLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <>
      {/* Modo claro (día) */}
      <img
        src="/img/emotes/11-crackslogta.svg"
        alt="11Cracks"
        draggable={false}
        className={`${className} object-contain dark:hidden`}
      />
      {/* Modo oscuro (noche) */}
      <img
        src="/img/icons/icontas.png"
        alt="11Cracks"
        draggable={false}
        className={`${className} hidden object-contain dark:block`}
      />
    </>
  );
}
