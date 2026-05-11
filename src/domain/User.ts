export interface User {
    id: string;
    username: string;
    avatarUrl: string;
    email: string;
    passwordHash: string;
    roleId?: string;
    roleName?: string;
    role?: {
      id?: string;
      name?: string;
    } | string;
    permissions?: Array<{
      id?: string;
      name?: string;
    } | string>;
}

export type UserVotes = {
  [pollId: string]: {
    [userId: string]: string; 
  };
};
