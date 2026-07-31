"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Podaj poprawny email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});

export type LoginState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;

export async function login(state: LoginState, formData: FormData) {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validated = LoginSchema.safeParse({
    email: typeof rawEmail === "string" ? rawEmail.trim() : rawEmail,
    password: rawPassword,
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email.toLowerCase(),
      password: validated.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { message: "Nieprawidłowy email lub hasło" };
      }
      return { message: "Wystąpił błąd. Spróbuj ponownie." };
    }
    throw error;
  }
}
