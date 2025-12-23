import { Router } from 'express';
import registerRoutes from './register/register.js';

const router = Router();

const serviceRouters = [registerRoutes];

serviceRouters.forEach((serviceRouter) => {
    router.use(serviceRouter);
});

export default router;
