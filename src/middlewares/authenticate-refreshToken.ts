import { expressjwt } from "express-jwt";
import configuration from "@/lib/configuration";
import { Request, RequestHandler } from "express";
import { AppDataSource } from "@/data-source";
import { RefreshToken } from "@/entities/refreshToken";
import logger from "@/lib/logger";

const authenticateRefresh: RequestHandler = expressjwt({
  secret: String(configuration.jwt_secrets.refresh),
  algorithms: ["HS256"],
  getToken(req: Request) {
    const { refreshToken: token } = req.cookies as Record<
      string,
      string | undefined
    >;
    return token;
  },
  isRevoked: async (req: Request, token) => {
    try {
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const refreshToken = await refreshTokenRepository.findOne({
        where: {
          id: Number((token?.payload as { jti: string }).jti),
          user: { id: Number(token?.payload.sub) },
        },
      });
      return refreshToken === null;
    } catch (error) {
      logger.error("error refresh token", error);
    }
    return true;
  },
});

export default authenticateRefresh;
