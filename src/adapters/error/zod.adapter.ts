import { ZodError } from "zod";
import { ErrorResponse } from "@/middlewares/error-handler";

const zodErrorAdapter = (error: ZodError): ErrorResponse => {
  return {
    name: "Validation Error",
    code: 400,
    errors: error.issues.map((issue) => {
      return {
        message: issue.message,
        path: issue.path.join(","),
      };
    }),
  };
};

export default zodErrorAdapter;
