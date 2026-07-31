import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ŚRUBA</h1>
        <p className="text-muted-foreground">Zaloguj się do swojego konta</p>
      </div>

      <LoginForm />

      <div className="text-center space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--background)] px-2 text-muted-foreground">
              Lub
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
