import passport from 'passport';
import passportJwt from 'passport-jwt';
import passportLocal from 'passport-local';
import { getAuthConfig } from '../../config/index.js';
import { getUserModel } from '../models/user/index.js';
import { login, SessionError } from '../services/session/sessionService.js';

const { Strategy: JwtStrategy } = passportJwt;
const { Strategy: LocalStrategy } = passportLocal;

let configured = false;

function extractJwtFromCookie(req) {
  /*
  HttpOnly only hides the cookie from browser JavaScript; the server can still
  read it from the Cookie header after cookie-parser runs.
  */
  const { jwtCookieName } = getAuthConfig();
  return req?.cookies?.[jwtCookieName] || null;
}

function mapPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  };
}

export function configurePassport() {
  /*
  Passport strategies are process-global. Re-registering them is harmless, but
  this guard keeps app factory calls predictable in tests and local reloads.
  */
  if (configured) return;

  const authConfig = getAuthConfig();

  passport.use(
    'local',
    new LocalStrategy(
      { usernameField: 'username', passwordField: 'password' },
      async (username, password, done) => {
        try {
          const user = await login({ username, password });
          return done(null, user);
        } catch (error) {
          if (error instanceof SessionError) {
            return done(null, false, {
              message: error.message,
              statusCode: error.statusCode
            });
          }

          return done(error);
        }
      }
    )
  );

  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: extractJwtFromCookie,
        secretOrKey: authConfig.jwtSecret,
        algorithms: [authConfig.jwtAlgorithm]
      },
      async (payload, done) => {
        try {
          const userId = Number.parseInt(payload?.sub, 10);
          if (!Number.isInteger(userId) || userId <= 0) {
            return done(null, false);
          }

          const user = await getUserModel().findById(userId);
          if (!user) {
            return done(null, false);
          }

          return done(null, mapPublicUser(user));
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  configured = true;
}
