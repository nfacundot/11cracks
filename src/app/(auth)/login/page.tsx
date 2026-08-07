import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 text-6xl">⚽</div>
        <h1 className="text-3xl font-black">
          11<span className="text-green-400">Cracks</span>
        </h1>
        <p className="mt-1 text-sm text-green-100/70">¡Hola de nuevo, crack!</p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-green-100/70">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-bold text-green-400 underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
