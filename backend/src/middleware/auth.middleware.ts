import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

interface JwtPayload {
  userId: string;
}

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    if (!decoded) {
      res.status(401).json({ message: 'Unauthorized - Invalid Token' });
      return;
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in protectRoute middleware', error.message);
    } else {
      console.error('Unknown error in protectRoute middleware');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
