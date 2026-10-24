const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { guest, auth } = require('../middlewares/auth');

router.get('/login', guest, authController.showLogin);
router.post('/login', authController.login);
router.get('/register', guest, authController.showRegister);
router.post('/register', authController.register);
router.get('/logout', auth, authController.logout);

module.exports = router;