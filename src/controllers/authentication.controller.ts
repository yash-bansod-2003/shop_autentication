import { Request, Response, NextFunction } from "express";
import JsonWebToken from "jsonwebtoken";
import UserService from "@/services/users.service";
import TokensService from "@/services/tokens.service";
import { User } from "@/types/index";
import { TOKEN_OPTIONS } from "@/lib/constants";
import { AuthenticatedRequest } from "@/middlewares/authenticate";
import { Logger } from "winston";
import createError from "http-errors";
import HashingService from "@/services/hashing.service";

class AutenticationController {
  constructor(
    private readonly userService: UserService,
    private readonly hashingService: HashingService,
    private readonly accessTokensService: TokensService,
    private readonly refreshTokensService: TokensService,
    private readonly forgotTokensService: TokensService,
    private readonly logger: Logger,
  ) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, ...rest } = req.body as User;
      this.logger.debug(`initiate registering user ${email}`);
      const userExists = await this.userService.findOne({ where: { email } });
      if (userExists) {
        this.logger.debug(`user already exists with ${email} email`);
        throw createError(400, "user already exists");
      }

      this.logger.debug("creating hash of the password");
      const passwordHash = await this.hashingService.hash(password);

      this.logger.debug("registering user");
      const user = await this.userService.create({
        email,
        password: passwordHash,
        ...rest,
      });
      this.logger.debug("user registered successfully");
      res.json({ ...user, password: undefined });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as Pick<User, "email" | "password">;
      this.logger.debug(`Attempting login for user with email: ${email}`);
      const user = await this.userService.findOne({
        where: { email },
      });

      this.logger.debug(`User not found for email: ${email}`);
      if (!user) {
        throw createError(404, "user not found");
      }
      this.logger.debug(`Matching password for email: ${email}`);
      const isPasswordCorrect = await this.hashingService.compare(
        password,
        user.password,
      );
      if (!isPasswordCorrect) {
        this.logger.debug(`Wrong credentials for email: ${email}`);
        throw createError(400, "wrong credentials");
      }
      this.logger.debug(`User with email: ${email} logged in successfully`);

      const payload: JsonWebToken.JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const signOptions: JsonWebToken.SignOptions = {
        algorithm: "RS256",
        expiresIn: TOKEN_OPTIONS.ACCESS_TOKEN_EXPIRATION_DURATION,
        issuer: TOKEN_OPTIONS.ISSUER,
      };

      this.logger.debug("persist refresh token");
      const saveRefreshToken = await this.refreshTokensService.create({ user });

      if (!saveRefreshToken) {
        throw createError(500, "refresh token not persist");
      }

      this.logger.debug("generating access token");
      const accessToken = this.accessTokensService.sign(payload, signOptions);

      const refreshToken = this.refreshTokensService.sign(
        { ...payload, jti: String(saveRefreshToken.id) },
        {
          expiresIn: TOKEN_OPTIONS.REFRESH_TOKEN_EXPIRATION_DURATION,
          issuer: TOKEN_OPTIONS.ISSUER,
        },
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60,
        secure: false,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365,
        secure: false,
      });

      res.json({ id: user.id });
      return;
    } catch (error) {
      this.logger.error(`Error during login: ${(error as Error).message}`);
      next(error);
      return;
    }
  }

  async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req as AuthenticatedRequest).auth.sub;
      this.logger.debug(`Fetching profile for user id: ${id}`);
      const user = await this.userService.findOne({
        where: { id: Number(id) },
      });
      this.logger.debug(`User not found for id: ${id}`);
      if (!user) {
        this.logger.debug(`Profile fetched for user id: ${id}`);
        throw createError(404, "user not found");
      }
      return res.json({ ...user, password: undefined });
    } catch (error) {
      this.logger.error(`Error fetching profile: ${(error as Error).message}`);
      next(error);
    }
  }

  async forgot(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as { email: string };

      if (!email) {
        throw createError(400, "email is required");
      }

      this.logger.debug(`Initiating forgot password for email: ${email}`);
      const user = await this.userService.findOne({ where: { email } });
      this.logger.debug(`User not found for email: ${email}`);
      if (!user) {
        throw createError(404, "user not found");
      }
      const payload: JsonWebToken.JwtPayload = {
        sub: String(user.id),
        role: user.role,
        email: user.email,
      };

      this.logger.debug(`Forgot password token generated for email: ${email}`);
      const token = this.forgotTokensService.sign(payload, {
        expiresIn: TOKEN_OPTIONS.FORGOT_PASSWORD_TOKEN_EXPIRATION_DURATION,
      });

      return res.json({ token });
    } catch (error) {
      this.logger.error(
        `Error during forgot password: ${(error as Error).message}`,
      );
      next(error);
    }
  }

  async reset(req: Request, res: Response, next: NextFunction) {
    try {
      this.logger.debug(`Attempting password reset with token`);
      const { token } = req.params;
      if (!token) {
        throw createError(400, "token is required");
      }
      const match = this.forgotTokensService.verify(token);
      this.logger.debug(`Invalid token for password reset`);
      if (!match) {
        throw createError(500, "internal server error");
      }
      const { email } = match as JsonWebToken.JwtPayload;
      this.logger.debug(`Verifying user existence for email: ${email}`);

      const userExists = await this.userService.findOne({
        where: { email: email as string },
      });

      this.logger.debug(`User not found for email: ${email}`);
      if (!userExists) {
        throw createError(404, "user not found");
      }

      const { password } = req.body as { password: string };

      if (!password) {
        throw createError(400, "password is required");
      }

      const passwordHash = await this.hashingService.hash(password);

      const user = await this.userService.update(
        { email: email as string },
        {
          password: passwordHash,
        },
      );

      this.logger.debug(`Failed to update password for email: ${email}`);
      if (!user) {
        throw createError(500, "internal server error");
      }
      this.logger.debug(`Password reset successful for email: ${email}`);

      return res.json(user);
    } catch (error) {
      this.logger.error(
        `Error during password reset: ${(error as Error).message}`,
      );
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.cookies;
    this.logger.debug(`initiate refresh token process`);

    try {
      const match = this.refreshTokensService.verify(refreshToken as string);
      if (!match) {
        this.logger.debug("invalid token");
        return next(createError.Unauthorized());
      }
      const { sub: userId, jti } = match as JsonWebToken.JwtPayload;
      const user = await this.userService.findOne({
        where: { id: Number(userId) },
      });
      if (!user) {
        this.logger.debug("user not found");
        return next(createError.NotFound("user not found"));
      }

      const refreshTokenExists = await this.refreshTokensService.findOne({
        where: { id: Number(jti) },
      });

      if (!refreshTokenExists) {
        this.logger.debug("refresh token not found");
        return next(createError.NotFound("refresh token not found"));
      }

      const payload: JsonWebToken.JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const signOptions: JsonWebToken.SignOptions = {
        algorithm: "RS256",
        expiresIn: TOKEN_OPTIONS.ACCESS_TOKEN_EXPIRATION_DURATION,
        issuer: TOKEN_OPTIONS.ISSUER,
      };

      this.logger.debug("generating access token");
      const accessToken = this.accessTokensService.sign(payload, signOptions);

      const deleteUserRefreshToken = await this.refreshTokensService.delete({
        id: Number(jti),
      });

      if (!deleteUserRefreshToken) {
        this.logger.debug("delete user refresh token failed");
        return next(createError.InternalServerError());
      }

      this.logger.debug("persist refresh token");
      const savedRefreshToken = await this.refreshTokensService.create({
        user,
      });

      if (!savedRefreshToken) {
        this.logger.debug("persist refresh token failed");
        return next(
          createError.InternalServerError("refresh token not persist"),
        );
      }

      this.logger.debug("generating refresh token");
      const refreshTokenNew = this.refreshTokensService.sign(
        { ...payload, jti: String(savedRefreshToken.id) },
        {
          expiresIn: TOKEN_OPTIONS.REFRESH_TOKEN_EXPIRATION_DURATION,
          issuer: TOKEN_OPTIONS.ISSUER,
        },
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60,
        secure: false,
      });

      res.cookie("refreshToken", refreshTokenNew, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365,
        secure: false,
      });

      this.logger.debug("token refreshed successfully");
      return res.json({ status: "success" });
    } catch (error) {
      this.logger.debug(error);
      return next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const id = (req as AuthenticatedRequest).auth.sub;
    try {
      const user = await this.userService.findOne({
        where: { id: Number(id) },
      });
      if (!user) {
        this.logger.debug("user not found");
        return next(createError.NotFound("user not found"));
      }

      const deleteUserRefreshTokens = await this.refreshTokensService.delete({
        user: { id: user.id },
      });

      if (!deleteUserRefreshTokens) {
        this.logger.debug("delete user refresh tokens failed");
        return next(createError.InternalServerError());
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.json({ id: user.id });
    } catch (error) {
      this.logger.error("logout user failed", error);
      next(createError.InternalServerError());
    }
  }
}

export default AutenticationController;
