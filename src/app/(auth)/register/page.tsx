import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 text-6xl">⚽</div>
        <h1 className="text-3xl font-black">
          Únete a <span className="text-green-400">11Cracks</span>
        </h1>
        <p className="mt-1 text-sm text-green-100/70">
          Crea tu cuenta y empieza a entrenar tu mente futbolera
        </p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-green-100/70">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-green-400 underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
