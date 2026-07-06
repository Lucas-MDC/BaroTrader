import cookieParser from 'cookie-parser';
import express from 'express';
import passport from 'passport';
import { configurePassport } from '../auth/passport.js';

export function installAppMiddleware(app) {
  /*
  Keep src/app.js focused on composition while centralizing global middleware.
  */
  configurePassport();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(passport.initialize());
}
