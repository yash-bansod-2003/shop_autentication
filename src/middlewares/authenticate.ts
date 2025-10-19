import { Request, RequestHandler } from "express";
import jwksClient from "jwks-rsa";
import { expressjwt, GetVerificationKey } from "express-jwt";
import configuration from "@/lib/configuration";

const authenticate: RequestHandler = expressjwt({
  secret: jwksClient.expressJwtSecret({
    jwksUri: String(configuration.jwks_uri),
    cache: true,
    rateLimit: true,
  }) as GetVerificationKey,
  algorithms: ["RS256"],
  getToken(req: Request) {
    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && Boolean(authorizationHeader?.split(" ")?.[1])) {
      const token = authorizationHeader.split(" ")[1];
      if (token) {
        return token;
      }
    }

    const { accessToken: token } = req.cookies as Record<
      string,
      string | undefined
    >;
    return token;
  },
});

export default authenticate;

export interface AuthenticatedRequest extends Request {
  auth: {
    sub: string;
    role: string;
    restaurantId: number;
    iat: number;
    exp: number;
  };
}
