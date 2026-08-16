import Image from "next/image";
import { AvatarSvg } from "@/components/avatar-svg";
import type { AvatarConfig } from "@/lib/avatar";

export function Avatar({
  name,
  src,
  config,
  size = 40,
  className = "",
}: {
  name: string;
  src?: string | null;
  config?: AvatarConfig | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-600 font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {config ? (
        <AvatarSvg config={config} size={size} />
      ) : src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
