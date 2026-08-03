import jwt from 'jsonwebtoken';
import { getAuthConfig } from '../../../config/index.js';

function buildSessionCookieOptions(authConfig) {
  return {
    httpOnly: authConfig.cookieHttpOnly,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
    maxAge: authConfig.jwtExpiresInSeconds * 1000,
    path: '/'
  };
}

function buildClearCookieOptions(authConfig) {
  return {
    httpOnly: authConfig.cookieHttpOnly,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
    path: '/'
  };
}

function signSessionToken(user, authConfig) {
  return jwt.sign(
    { username: user.username },
    authConfig.jwtSecret,
    {
      algorithm: authConfig.jwtAlgorithm,
      expiresIn: authConfig.jwtExpiresInSeconds,
      subject: String(user.id)
    }
  );
}

export function issueSessionCookie(res, user) {
  const authConfig = getAuthConfig();
  const token = signSessionToken(user, authConfig);

  res.cookie(
    authConfig.jwtCookieName,
    token,
    buildSessionCookieOptions(authConfig)
  );
}

export function clearSessionCookie(res) {
  const authConfig = getAuthConfig();

  res.clearCookie(
    authConfig.jwtCookieName,
    buildClearCookieOptions(authConfig)
  );
}
