import { Request, Response } from 'express';
import User from '../models/user.model.ts';
import Message from '../models/message-model.ts';
import cloudinary from '../lib/cloudinary.ts';

export const getUsersForSidebar = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const loggedInUserId = req.user?._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select('-password');
    res.status(200).json(filteredUsers);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in get users for sidebar controller', error.message);
    } else {
      console.error('Unknown error in get users for sidebar controller');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user?._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in get messages controller', error.message);
    } else {
      console.error('Unknown error in get messages controller');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user?._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in send messages controller', error.message);
    } else {
      console.error('Unknown error in send messages controller');
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
