import { z } from "zod";

export const EmailSchema = z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
});

export type Email = z.infer<typeof EmailSchema>;