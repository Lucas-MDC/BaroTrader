import passport from 'passport';

function authenticateJwt(req, res, next, onFailure) {
  /*
  Authenticate API requests with the JWT stored in the session cookie.
  */
  passport.authenticate('jwt', { session: false }, (error, user) => {
    if (error) return next(error);
    if (!user) return onFailure(req, res);

    req.user = user;
    return next();
  })(req, res, next);
}

export function requireApiAuth(req, res, next) {
  return authenticateJwt(req, res, next, (_req, response) =>
    response.status(401).json({ error: 'Authentication required.' })
  );
}
