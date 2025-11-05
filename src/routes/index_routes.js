const { Router } = require('express');
const login_router = require('./login_routes.js');
const register_router = require('./register_routes.js');
/*

const home_router   = require('./home_routes');
*/

const router = Router();

// monta cada sub-roteador sob um prefixo
router.use('/', login_router);
router.use('/register', register_router);
/*
router.use('/home', home_router);
*/

module.exports = router;