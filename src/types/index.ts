import { z } from "zod";
import { userValidationSchema } from "@/validators/users.validators";
import { restaurantValidationSchema } from "@/validators/restaurants.validator";

export type User = z.infer<typeof userValidationSchema>;
export type Restaurant = z.infer<typeof restaurantValidationSchema>;
