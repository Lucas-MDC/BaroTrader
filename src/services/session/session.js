/*
HTTP routes for stateless session management.
*/

import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Router } from 'express';
import { getAuthConfig } from '../../../config/index.js';
import { INVALID_CREDENTIALS_MESSAGE, logout } from './sessionService.js';

const router = Router();

function buildCookieOptions(authConfig) {
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

function handleLogin(req, res, next) {
  passport.authenticate('local', { session: false }, (error, user, info) => {
    if (error) return next(error);

    if (!user) {
      return res.status(info?.statusCode || 401).json({
        error: info?.message || INVALID_CREDENTIALS_MESSAGE
      });
    }

    const authConfig = getAuthConfig();
    const token = signSessionToken(user, authConfig);

    res.cookie(
      authConfig.jwtCookieName,
      token,
      buildCookieOptions(authConfig)
    );

    return res.status(200).json({ user });
  })(req, res, next);
}

function handleLogout(_req, res) {
  const authConfig = getAuthConfig();
  logout();

  res.clearCookie(
    authConfig.jwtCookieName,
    buildClearCookieOptions(authConfig)
  );

  return res.status(204).end();
}

router.post('/login', handleLogin);
router.delete('/logout', handleLogout);

export default router;
