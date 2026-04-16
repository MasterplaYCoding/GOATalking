import { nanoid } from "nanoid";
import type { Poll, PollOption } from "../domain/Poll";
import type { UserVotes } from "../domain/User";

export function createPoll(
  title: string,
  category: string,
  description: string,
  imageUrl: string
): Poll {
  return {
    id: nanoid(),
    title,
    category,
    description,
    imageUrl,
    options: [],
    dateCreated: new Date(),
    interactionCount: 0,
  };
}

export function addOption(
  poll: Poll,
  text: string,
  userId?: string
): Poll {
  const newOption: PollOption = {
    id: nanoid(),
    text,
    votes: 0,
    userId
  };

  return {
    ...poll,
    options: [...poll.options, newOption]
  };
}

export function getCurrentStandings(poll: Poll): [PollOption, number][] {
  const totalVotes = poll.interactionCount;

  return [...poll.options]
    .sort((a, b) => b.votes - a.votes)
    .map((option) => {
      const percentage = totalVotes === 0 
        ? 0 
        : (option.votes / totalVotes) * 100;

      return [option, percentage];
    });
}

export function vote(
  poll: Poll,
  optionId: string,
  userId: string,
  userVotes: UserVotes
): { poll: Poll; userVotes: UserVotes } {
  const pollVotes = userVotes[poll.id] || {};
  
  const previousOptionId = pollVotes[userId];

  if (previousOptionId === optionId || poll.ownerId === userId) {
    return { poll, userVotes };
  }

  const updatedPoll: Poll = {
    ...poll,
    options: poll.options.map(o => {
      if (o.id === optionId) {
        return { ...o, votes: o.votes + 1 };
      }
      if (o.id === previousOptionId) {
        return { ...o, votes: Math.max(0, o.votes - 1) }; 
      }
      return o; 
    }),
    
    interactionCount: previousOptionId ? poll.interactionCount : poll.interactionCount + 1
  };

  const updatedVotes: UserVotes = {
    ...userVotes,
    [poll.id]: {
      ...pollVotes,
      [userId]: optionId 
    }
  };

  return { poll: updatedPoll, userVotes: updatedVotes };
}


export function deletePoll(
  polls: Poll[],
  pollId: string
): Poll[] {
  return polls.filter(p => p.id !== pollId);
}

export function updatePoll(
  poll: Poll,
  updates: Partial<Poll>
): Poll {
  return {
    ...poll,
    ...updates
  };
}