import Image from "next/image";

export function BallLogo({
  size = 96,
  className = "",
  src = "/img/icons/faviconlit.png",
}: {
  size?: number;
  className?: string;
  src?: string;
}) {
  return (
    <Image
      src={src}
      alt="11Cracks"
      width={size}
      height={size}
      priority
      className={`object-contain ${className}`}
    />
  );
}
