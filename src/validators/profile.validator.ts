import { z } from "zod";

export const getProfileSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }).min(1, "Username cannot be empty"),
    }),
});

export type getProfileSchema = z.infer<typeof getProfileSchema>;
