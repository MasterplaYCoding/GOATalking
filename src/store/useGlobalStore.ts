import { create } from 'zustand';
import type { MarginalityTest, MarginalityTestResponse } from "../domain/MarginalityTest";
import type { Poll } from "../domain/Poll";
import type { User, UserVotes } from "../domain/User";
import { addOption, createPoll, updatePoll, vote } from "../services/pollService";
import { trackUserActivity } from "../services/browserMonitoringService";
import type { NewPollData } from "../components/PollCardCreate";

export type AppState = {
  polls: Poll[];
  users: User[];
  marginalityTests: MarginalityTest[];
  marginalityResponses: MarginalityTestResponse[];
  userVotes: UserVotes;
  currentUserId?: string;

  setPolls: (updater: Poll[] | ((currentPolls: Poll[]) => Poll[])) => void;
  setUsers: (users: User[]) => void;
  setMarginalityTests: (tests: MarginalityTest[]) => void;
  setMarginalityResponses: (responses: MarginalityTestResponse[]) => void;
  setUserVotes: (votes: UserVotes) => void;
  setCurrentUserId: (id: string) => void;

  handleUpdatePoll: (pollId: string, updates: Partial<Poll>) => void;
  handleDeletePoll: (pollId: string) => void;
  handleCreatePoll: (pollData: NewPollData) => void;
  handleVote: (pollId: string, optionId: string, userId: string) => void;
  handleSubmitMarginalityResponse: (response: MarginalityTestResponse) => void;
};

export const useGlobalStore = create<AppState>((set) => ({
  polls: [],
  users: [],
  marginalityTests: [],
  marginalityResponses: [],
  userVotes: {},
  currentUserId: undefined,

  setPolls: (updater) => set((state) => ({
    polls: typeof updater === 'function' ? updater(state.polls) : updater
  })),
  setUsers: (users) => set({ users }),
  setMarginalityTests: (marginalityTests) => set({ marginalityTests }),
  setMarginalityResponses: (marginalityResponses) => set({ marginalityResponses }),
  setUserVotes: (userVotes) => set({ userVotes }),
  setCurrentUserId: (currentUserId) => set({ currentUserId }),

  handleUpdatePoll: (pollId, updates) => set((state) => {
    trackUserActivity("poll", `update-poll:${pollId}`);
    return {
      polls: state.polls.map((poll) => (poll.id === pollId ? updatePoll(poll, updates) : poll))
    };
  }),

  handleDeletePoll: (pollId) => set((state) => {
    trackUserActivity("poll", `delete-poll:${pollId}`);
    return {
      polls: state.polls.filter((poll) => poll.id !== pollId)
    };
  }),

  handleCreatePoll: (pollData) => set((state) => {
    const ownerId = state.currentUserId ?? state.users[0]?.id;
    if (!ownerId) return state;

    let nextPoll = createPoll(
      pollData.title.trim(),
      "General",
      pollData.description.trim(),
      pollData.imageUrl.trim() || "/logo.png"
    );

    pollData.options.forEach((optionText) => {
      nextPoll = addOption(nextPoll, optionText.trim(), ownerId);
    });

    nextPoll = { ...nextPoll, ownerId };
    trackUserActivity("poll", `create-poll:${nextPoll.id}`);

    return { polls: [nextPoll, ...state.polls] };
  }),

  handleVote: (pollId, optionId, userId) => set((state) => {
    const poll = state.polls.find((p) => p.id === pollId);
    if (!poll) return state;

    const result = vote(poll, optionId, userId, state.userVotes);
    trackUserActivity("poll", `vote:${pollId}:${optionId}`);

    return {
      polls: state.polls.map((p) => (p.id === pollId ? result.poll : p)),
      userVotes: result.userVotes
    };
  }),

  handleSubmitMarginalityResponse: (response) => set((state) => {
    trackUserActivity("marginality", `submit-report:${response.testId}`);
    const withoutCurrentUsersResponse = state.marginalityResponses.filter(
      (currentResponse) =>
        !(currentResponse.testId === response.testId && currentResponse.userId === response.userId)
    );
    return {
      marginalityResponses: [...withoutCurrentUsersResponse, response]
    };
  }),
}));