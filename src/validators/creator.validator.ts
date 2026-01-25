import {z} from "zod";

export const createSchema = z.object({
    body:z.object({
        username: z.string({message: "Invalid username provided"}),
        first_name: z.string({message: "Invalid first name provided"}),
        last_name: z.string({message: "Invalid last name provided"}),
        bio: z.string({message: "Invalid bio name provided"}).optional(),
        avatar_url: z.string({message: "Invalid avatar provided"}).optional(),
    })
})

export type createSchema = z.infer<typeof createSchema>

export const updateSchema = z.object({
    body:z.object({
        username: z.string({message: "Invalid username provided"}).optional(),
        first_name: z.string({message: "Invalid first name provided"}).optional(),
        last_name: z.string({message: "Invalid last name provided"}).optional(),
        avatar_url: z.string({message: "Invalid avatar provided"}).optional(),
        bio: z.string({message: "Invalid bio provided"}).optional(),
    })
})

export type updateSchema = z.infer<typeof updateSchema>