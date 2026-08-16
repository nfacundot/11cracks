import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { BallLogo } from "@/components/ball-logo";

export const metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div
      className="flex flex-1 flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/img/back/bkreg.png)" }}
    >
      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <div className="animate-float mb-3 flex justify-center">
            <BallLogo size={112} src="/img/icons/favicon.png" />
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-green-100/70">
            Crea tu cuenta y empieza a entrenar tu mente futbolera
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-green-100/70">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-bold text-green-600 underline dark:text-green-400">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
