export interface IUserSeed {
  email: string;
  fullName: string;
  password: string;
  profilePic?: string;
}

export interface IUserSeedMetadata extends IUserSeed {
  role?: 'user' | 'admin';
  isActive?: boolean;
  tags?: string[];
}

export type IProcessedUserSeed = Omit<IUserSeed, 'password'> & {
  password: string;
  hashedAt?: Date;
};
