import type { MarginalityTest, MarginalityTestResponse } from "../domain/MarginalityTest";
import { useState } from "react";
import type { Message } from "../domain/Message";
import type { Poll } from "../domain/Poll";
import type { User, UserVotes } from "../domain/User";

export type AppState = {
  polls: Poll[];
  users: User[];
  messages: Message[];
  marginalityTests: MarginalityTest[];
  marginalityResponses: MarginalityTestResponse[];
  userVotes: UserVotes;
  currentUserId?: string;
};

export function useAppState() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [marginalityTests, setMarginalityTests] = useState<MarginalityTest[]>([]);
  const [marginalityResponses, setMarginalityResponses] = useState<MarginalityTestResponse[]>([]);
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  return {
    polls,
    setPolls,
    users,
    setUsers,
    messages,
    setMessages,
    marginalityTests,
    setMarginalityTests,
    marginalityResponses,
    setMarginalityResponses,
    userVotes,
    setUserVotes,
    currentUserId,
    setCurrentUserId
  };
}
