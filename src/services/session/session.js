/*
HTTP routes for stateless session management.
*/

import passport from 'passport';
import { Router } from 'express';
import { INVALID_CREDENTIALS_MESSAGE, logout } from './sessionService.js';
import { clearSessionCookie, issueSessionCookie } from './sessionCookie.js';

const router = Router();

function handleLogin(req, res, next) {
  passport.authenticate('local', { session: false }, (error, user, info) => {
    if (error) return next(error);

    if (!user) {
      return res.status(info?.statusCode || 401).json({
        error: info?.message || INVALID_CREDENTIALS_MESSAGE
      });
    }

    issueSessionCookie(res, user);

    return res.status(200).json({ user });
  })(req, res, next);
}

function handleLogout(_req, res) {
  logout();
  clearSessionCookie(res);

  return res.status(204).end();
}

router.post('/login', handleLogin);
router.delete('/logout', handleLogout);

export default router;
