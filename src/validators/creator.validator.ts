import {z} from "zod";
import { DISPLAY_NAME_MAX_LENGTH } from "../utils/display-name";

const usernameSchema = z.string({message: "Invalid username provided"})
    .trim()
    .min(1, {message: "Username cannot be empty"})
    .max(50, {message: "Username must be 50 characters or fewer"});

const displayNameSchema = z.string({message: "Invalid display name provided"})
    .trim()
    .max(DISPLAY_NAME_MAX_LENGTH, {message: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer`})
    .nullable()
    .optional();

export const createSchema = z.object({
    body:z.object({
        username: usernameSchema,
        first_name: z.string({message: "Invalid first name provided"}),
        last_name: z.string({message: "Invalid last name provided"}),
        bio: z.string({message: "Invalid bio name provided"}).optional(),
        avatar_url: z.string({message: "Invalid avatar provided"}).optional(),
        display_name: displayNameSchema,
    })
})

export type createSchema = z.infer<typeof createSchema>

export const updateSchema = z.object({
    body:z.object({
        username: usernameSchema.optional(),
        first_name: z.string({message: "Invalid first name provided"}).optional(),
        last_name: z.string({message: "Invalid last name provided"}).optional(),
        avatar_url: z.string({message: "Invalid avatar provided"}).optional(),
        bio: z.string({message: "Invalid bio provided"}).optional(),
        display_name: displayNameSchema,
    })
})

export type updateSchema = z.infer<typeof updateSchema>
