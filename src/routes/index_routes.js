import { Router } from 'express';
import login_router from './home_routes.js';
// import register_router from './register_routes.js';
// import home_router from './home_internal_routes.js';


const router = Router();

// monta cada sub-roteador sob um prefixo
router.use('/', login_router);

/*
router.use('/register', register_router);
router.use('/home', home_router);
*/

export default router;