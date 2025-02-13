import express, { RequestHandler, Router } from 'express';
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
} from '../controllers/auth.controller';
import { protectRoute } from '../middleware/auth.middleware';

const router: Router = express.Router();

router.post('/signup', signup as RequestHandler);
router.post('/login', login as RequestHandler);
router.post('/logout', logout as RequestHandler);

router.put('/update-profile', protectRoute, updateProfile as RequestHandler);

router.get('/check', protectRoute, checkAuth as RequestHandler);

export default router;
