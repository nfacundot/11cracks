"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CameraIcon } from "@/components/camera-icon";
import { setAvatar } from "@/actions/user";

export function AvatarUpload({ name, src }: { name: string; src?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const upload = async (file: File) => {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al subir la imagen");
        return;
      }

      const setRes = await setAvatar(data.url);
      if (!setRes.success) throw new Error();

      router.refresh();
    } catch {
      setError("No se pudo actualizar tu foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative rounded-full transition active:scale-95"
        aria-label="Cambiar foto de perfil"
      >
        <Avatar name={name} src={src} size={88} className="ring-4 ring-white shadow-lg dark:ring-emerald-800" />
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition group-hover:bg-green-600">
          <CameraIcon className="h-4 w-4" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      {uploading && <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Subiendo...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-zinc-400 dark:text-zinc-500">Toca para cambiar tu foto</p>
    </div>
  );
}
