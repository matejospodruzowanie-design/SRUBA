"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

const RegisterSchema = z.object({
  name: z.string().min(1, "Imię jest wymagane").trim(),
  email: z.string().email("Podaj poprawny email").trim(),
  password: z
    .string()
    .min(8, "Minimum 8 znaków")
    .regex(/[a-zA-Z]/, "Przynajmniej jedna litera")
    .regex(/[0-9]/, "Przynajmniej jedna cyfra")
    .regex(/[^a-zA-Z0-9]/, "Przynajmniej jeden znak specjalny")
    .trim(),
});

export type RegisterState =
  | { errors?: { name?: string[]; email?: string[]; password?: string[] }; message?: string }
  | undefined;

export async function register(state: RegisterState, formData: FormData) {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return { message: "Użytkownik z tym adresem email już istnieje" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
    },
  });

  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  });

  redirect("/dashboard");
}
