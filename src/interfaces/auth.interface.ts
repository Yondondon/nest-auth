import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
  jwtId: string;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
