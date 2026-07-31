"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

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

  const user = await prisma.user.findUnique({
    where: { email: validated.data.email.toLowerCase() },
  });

  if (!user?.passwordHash) {
    return { message: "Nieprawidłowy email lub hasło" };
  }

  const valid = await bcrypt.compare(validated.data.password, user.passwordHash);
  if (!valid) {
    return { message: "Nieprawidłowy email lub hasło" };
  }

  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  });

  redirect("/dashboard");
}
