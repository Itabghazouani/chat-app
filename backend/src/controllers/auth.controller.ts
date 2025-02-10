import { Request, Response } from 'express';
import User from '../models/user.model.ts';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.ts';
import { IUser } from '../types/user.types.ts';
import cloudinary from '../lib/cloudinary.ts';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { email, fullName, password } = req.body;
  try {
    if (!email || !fullName || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
      return;
    }
    const user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      fullName,
      password: hashedPassword,
    }) as IUser;

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        profilPic: newUser.profilPic,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in signup controller', error.message);
    } else {
      console.error('Unknown error in signup controller');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      profilPic: user.profilPic,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in login controller', error.message);
    } else {
      console.error('Unknown error in login controller');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.cookie('jwt', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in logout controller', error.message);
    } else {
      console.error('Unknown error in logout controller');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { profilPic } = req.body;
    if (!req.user) {
      res.status(400).json({ message: 'User not authenticated' });
      return;
    }
    const userId = req.user._id;

    if (!profilPic) {
      res.status(400).json({ message: 'Profile picture is required' });
      return;
    }

    const uploadResponse = await cloudinary.uploader.upload(profilPic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilPic: uploadResponse.secure_url },
      { new: true },
    );

    res.status(200).json({ updatedUser });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in update profile:', error.message);
    } else {
      console.error('Unknown error in update profile');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkAuth = (req: Request, res: Response) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in checkAuth controller', error.message);
    } else {
      console.error('Unknown error in checkAuth controller');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
