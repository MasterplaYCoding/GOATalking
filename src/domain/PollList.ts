export interface PollList {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  ownerId?: string;
}

export interface PollListStats {
  listId: string | null;
  pollCount: number;
  totalInteractions: number;
}
