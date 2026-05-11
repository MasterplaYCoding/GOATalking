import { create } from 'zustand';
import type { MarginalityTest, MarginalityTestResponse } from "../domain/MarginalityTest";
import type { PollList } from "../domain/PollList";
import type { Poll } from "../domain/Poll";
import type { User, UserVotes } from "../domain/User";
import { addOption, createPoll, updatePoll, vote } from "../services/pollService";
import { trackUserActivity } from "../services/browserMonitoringService";
import type { NewPollData } from "../components/PollCardCreate";
import { addToOfflineQueue } from "../services/offlineQueueService";
import { API_BASE_URL } from "../config";

const USER_VOTES_STORAGE_KEY = "goatalking_user_votes";
const CURRENT_USER_STORAGE_KEY = "goatalking_current_user_id";

const readPersistedUserVotes = (): UserVotes => {
  if (typeof localStorage === "undefined") {
    return {};
  }

  try {
    const storedVotes = localStorage.getItem(USER_VOTES_STORAGE_KEY);
    return storedVotes ? (JSON.parse(storedVotes) as UserVotes) : {};
  } catch {
    return {};
  }
};

const persistUserVotes = (userVotes: UserVotes) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(USER_VOTES_STORAGE_KEY, JSON.stringify(userVotes));
};

const readPersistedCurrentUserId = () => {
  if (typeof localStorage === "undefined") {
    return "demo-user";
  }

  return localStorage.getItem(CURRENT_USER_STORAGE_KEY) ?? "demo-user";
};

const persistCurrentUserId = (currentUserId: string) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUserId);
};

export type AppState = {
  polls: Poll[];
  lists: PollList[];
  users: User[];
  marginalityTests: MarginalityTest[];
  marginalityResponses: MarginalityTestResponse[];
  userVotes: UserVotes;
  currentUserId?: string;

  setPolls: (updater: Poll[] | ((currentPolls: Poll[]) => Poll[])) => void;
  setLists: (lists: PollList[]) => void;
  setUsers: (users: User[]) => void;
  setMarginalityTests: (tests: MarginalityTest[]) => void;
  setMarginalityResponses: (responses: MarginalityTestResponse[]) => void;
  setUserVotes: (votes: UserVotes) => void;
  setCurrentUserId: (id: string) => void;

  handleUpdatePoll: (pollId: string, updates: Partial<Poll>) => Promise<void>;
  handleDeletePoll: (pollId: string) => Promise<void>;
  handleCreatePoll: (pollData: NewPollData) => Promise<void>;
  handleVote: (pollId: string, optionId: string, userId: string) => Promise<void>;
  handleSubmitMarginalityResponse: (response: MarginalityTestResponse) => Promise<void>;
  handleCreateList: (payload: { name: string; description: string; ownerId?: string }) => void;
  handleUpdateList: (listId: string, updates: Partial<Pick<PollList, "name" | "description">>) => void;
  handleDeleteList: (listId: string) => void;
  handleAssignPollToList: (pollId: string, listId: string | null) => void;
};

export const useGlobalStore = create<AppState>((set, get) => ({
  polls: [],
  lists: [],
  users: [],
  marginalityTests: [],
  marginalityResponses: [],
  userVotes: readPersistedUserVotes(),
  currentUserId: readPersistedCurrentUserId(),

  setPolls: (updater) => set((state) => ({
    polls: typeof updater === 'function' ? updater(state.polls) : updater
  })),
  setLists: (lists) => set({ lists }),
  setUsers: (users) => set({ users }),
  setMarginalityTests: (marginalityTests) => set({ marginalityTests }),
  setMarginalityResponses: (marginalityResponses) => set({ marginalityResponses }),
  setUserVotes: (userVotes) => {
    persistUserVotes(userVotes);
    set({ userVotes });
  },
  setCurrentUserId: (currentUserId) => {
    persistCurrentUserId(currentUserId);
    set({ currentUserId });
  },

  handleUpdatePoll: async (pollId, updates) => {
    trackUserActivity("poll", `update-poll:${pollId}`);
    
    set((state) => ({
      polls: state.polls.map((poll) => (poll.id === pollId ? updatePoll(poll, updates) : poll))
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": get().currentUserId || "demo-user"
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Server rejected update");
    } catch {
      addToOfflineQueue(`/api/polls/${pollId}`, "PUT", updates);
    }
  },

  handleDeletePoll: async (pollId) => {
    trackUserActivity("poll", `delete-poll:${pollId}`);
    
    set((state) => ({
      polls: state.polls.filter((poll) => poll.id !== pollId)
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Server rejected delete");
    } catch {
      addToOfflineQueue(`/api/polls/${pollId}`, "DELETE");
    }
  },

  handleCreatePoll: async (pollData) => {
    const state = get();
    const ownerId = state.currentUserId ?? state.users[0]?.id ?? "demo-user";

    let tempPoll = createPoll(
      pollData.title.trim(),
      "General",
      pollData.description.trim(),
      pollData.imageUrl.trim() || "/logo.png"
    );

    pollData.options.forEach((optionText) => {
      tempPoll = addOption(tempPoll, optionText.trim(), ownerId);
    });

    tempPoll = { ...tempPoll, ownerId, dateCreated: new Date(), listId: null };

    trackUserActivity("poll", `create-poll:${tempPoll.id}`);
    
    // Instantly draw the fake one
    set((state) => ({ polls: [tempPoll, ...state.polls] }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/polls`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": get().currentUserId || "demo-user"
        },
        body: JSON.stringify(tempPoll),
      });
      
      if (!response.ok) throw new Error("Server rejected create");

      const realPollRaw = await response.json();
      
      const realPoll = {
        ...realPollRaw,
        dateCreated: new Date(realPollRaw.dateCreated)
      };

      set((state) => ({
        polls: state.polls.map(p => p.id === tempPoll.id ? realPoll : p)
      }));

    } catch {
      addToOfflineQueue("/api/polls", "POST", tempPoll);
    }
  },

handleVote: async (pollId, optionId, userId) => {
    const state = get();
    const poll = state.polls.find((p) => p.id === pollId);
    if (!poll) return;

    const result = vote(poll, optionId, userId, state.userVotes);
    trackUserActivity("poll", `vote:${pollId}:${optionId}`);
    persistUserVotes(result.userVotes);
    
    set({
      polls: state.polls.map((p) => (p.id === pollId ? result.poll : p)),
      userVotes: result.userVotes
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/polls/vote`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": get().currentUserId || "demo-user"
        },
        body: JSON.stringify({ pollId, optionId, userId }),
      });
      
      if (!response.ok) throw new Error("Server rejected vote");

      const realPollRaw = await response.json();
      const realPoll = { ...realPollRaw, dateCreated: new Date(realPollRaw.dateCreated) };

      set((state) => ({
        polls: state.polls.map(p => p.id === pollId ? realPoll : p)
      }));

    } catch {
      addToOfflineQueue(`/api/polls/vote`, "POST", { pollId, optionId, userId });
    }
  },

  handleSubmitMarginalityResponse: async (response) => {
    trackUserActivity("marginality", `submit-report:${response.testId}`);
    
    const startedAt = localStorage.getItem("test_started_at");
    
    if (startedAt) {
      localStorage.removeItem("test_started_at");
    }

    set((state) => {
      const withoutCurrentUsersResponse = state.marginalityResponses.filter(
        (currentResponse) =>
          !(currentResponse.testId === response.testId && currentResponse.userId === response.userId)
      );
      return {
        marginalityResponses: [...withoutCurrentUsersResponse, response]
      };
    });

    const payload = {
      ...response,
      startedAt: startedAt ? Number(startedAt) : undefined
    };

    console.log("FRONTEND SENDING:", payload);

    try {
      const res = await fetch(`${API_BASE_URL}/api/marginality/responses`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": get().currentUserId || "demo-user"
        },
        body: JSON.stringify(payload), 
      });
      if (!res.ok) throw new Error("Server rejected response");
    } catch {
      addToOfflineQueue("/api/marginality/responses", "POST", response);
    }
  },

  handleCreateList: ({ name, description, ownerId }) => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedDescription) {
      return;
    }

    const nextList: PollList = {
      id: `list-${Date.now().toString(36)}`,
      name: trimmedName,
      description: trimmedDescription,
      createdAt: new Date(),
      ownerId,
    };

    set((state) => ({
      lists: [...state.lists, nextList],
    }));
  },

  handleUpdateList: (listId, updates) => {
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              ...updates,
              name: updates.name?.trim() ?? list.name,
              description: updates.description?.trim() ?? list.description,
            }
          : list
      ),
    }));
  },

  handleDeleteList: (listId) => {
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== listId),
      polls: state.polls.map((poll) =>
        poll.listId === listId
          ? {
              ...poll,
              listId: null,
            }
          : poll
      ),
    }));
  },

  handleAssignPollToList: (pollId, listId) => {
    set((state) => ({
      polls: state.polls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              listId,
            }
          : poll
      ),
    }));
  },
}));
