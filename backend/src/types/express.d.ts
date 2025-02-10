import { IUserWithoutPassword } from './user.types';

declare global {
  namespace Express {
    interface Request {
      user?: IUserWithoutPassword;
    }
  }
}
