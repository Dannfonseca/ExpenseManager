import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken'; // Importar JWT aqui
const router = express.Router();
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { registerLimiter } from '../middlewares/rateLimiter.js';

// A função foi movida para dentro deste arquivo também
const generateAndSetToken = (res, userId, userRole) => {
    const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
};

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

const failureRedirectUrl = `${process.env.FRONTEND_URL}/login?error=auth_failed`;

const socialAuthCallback = (req, res) => {
  generateAndSetToken(res, req.user._id, req.user.role);
  res.redirect(process.env.FRONTEND_URL); 
};

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: failureRedirectUrl, session: false }), socialAuthCallback);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: failureRedirectUrl, session: false }), socialAuthCallback);

export default router;