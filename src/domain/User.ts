export interface User {
    id: string;
    username: string;
    avatarUrl: string;
    email: string;
    passwordHash: string;
}

export type UserVotes = {
  [pollId: string]: {
    [userId: string]: string; 
  };
};