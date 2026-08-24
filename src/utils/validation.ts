import { z } from "zod";

/**
 * Form schemas. Inputs are kept as strings (that is what HTML inputs give us)
 * and converted to numbers only when we send data to the server.
 */

export const mobileField = z
  .string()
  .trim()
  .regex(/^[0-9+\s-]{10,15}$/, { message: "Enter a valid mobile number" });

const ageField = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || (Number(v) >= 10 && Number(v) <= 100), { message: "Age must be 10-100" });

export const genderField = z.enum(["", "male", "female", "other"]).optional();
export const planField = z.enum(["monthly", "quarterly", "half_yearly", "yearly"]);

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  mobile: mobileField,
  age: ageField,
  gender: genderField,
  plan: planField,
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const memberFormSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  mobile: mobileField,
  age: ageField,
  gender: genderField,
  plan: planField,
  plan_price: z
    .string()
    .trim()
    .refine((v) => v !== "" && Number(v) >= 0, { message: "Enter a valid amount" }),
  payment_status: z.enum(["paid", "pending", "overdue"]),
  expiry_date: z.string().min(1, "Expiry date is required"),
  notes: z.string().trim().max(300).optional(),
});

export type MemberFormInput = z.infer<typeof memberFormSchema>;

export const paymentFormSchema = z.object({
  member_id: z.string().min(1, "Select a member"),
  amount: z
    .string()
    .trim()
    .refine((v) => v !== "" && Number(v) > 0, { message: "Enter a valid amount" }),
  method: z.enum(["cash", "upi", "card", "bank"]),
  status: z.enum(["paid", "pending", "overdue"]),
  note: z.string().trim().max(200).optional(),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;

/** Optional numeric value from a form string, safe for server function inputs. */
export const toNumber = (value?: string) => (value && value !== "" ? Number(value) : undefined);
