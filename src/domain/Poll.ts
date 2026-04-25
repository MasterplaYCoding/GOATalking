export interface PollOption {
  id: string;
  text: string;
  votes: number;
  userId?: string;
}

export interface Poll {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  category: string;
  options: PollOption[];
  dateCreated: Date;
  interactionCount: number;
  ownerId?: string;
  listId?: string | null;
}
