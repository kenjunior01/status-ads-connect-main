import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória"),
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  role: z.enum(["creator", "advertiser"], {
    required_error: "Selecione o tipo de conta",
  }),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .regex(/^\+\d{8,16}$/, "Use formato internacional com DDI, ex: +2588XXXXXXXX"),
  email: z
    .string()
    .email("Email inválido")
    .optional(),
  age: z
    .number()
    .min(13, "Idade mínima 13")
    .max(100, "Idade máxima 100"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
