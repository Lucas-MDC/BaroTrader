/*
API router aggregator for service endpoints.
*/

import { Router } from 'express';
import registerRoutes from './register/register.js';
import sessionRoutes from './session/session.js';

const router = Router();

const serviceRouters = [registerRoutes, sessionRoutes];

/*
Register each service router under the API root.
*/
serviceRouters.forEach((serviceRouter) => {
    router.use(serviceRouter);
});

export default router;
