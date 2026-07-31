import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ŚRUBA</h1>
        <p className="text-muted-foreground">Utwórz nowe konto</p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
