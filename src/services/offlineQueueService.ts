export type QueuedAction = {
  id: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload?: unknown;
  timestamp: number;
};

const QUEUE_KEY = "goatalking_offline_queue";

export const getOfflineQueue = (): QueuedAction[] => {
  const stored = localStorage.getItem(QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addToOfflineQueue = (endpoint: string, method: "POST" | "PUT" | "DELETE", payload?: unknown) => {
  const queue = getOfflineQueue();
  const newAction: QueuedAction = {
    id: crypto.randomUUID(), 
    endpoint,
    method,
    payload,
    timestamp: Date.now(),
  };
  
  queue.push(newAction);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  console.log(`[Offline] Network down. Saved ${method} action to local queue.`);
};

export const clearOfflineQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};

export const syncOfflineQueue = async () => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`[Sync] Internet restored! Syncing ${queue.length} offline actions to backend...`);

  const remainingQueue: QueuedAction[] = [];

  for (const action of queue) {
    try {
      const response = await fetch(`http://localhost:3000${action.endpoint}`, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: action.payload ? JSON.stringify(action.payload) : undefined,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[Sync] Resource not found (404) for ${action.endpoint}. It may have been wiped from RAM. Skipping.`);
          continue;
        }
        throw new Error("Server rejected the synced action");
      }
    } catch (error) {
      console.error(`[Sync] Server is still unreachable or failed. Keeping action in queue.`, error);
      remainingQueue.push(action); 
    }
  }

  if (remainingQueue.length > 0) {
    localStorage.setItem("goatalking_offline_queue", JSON.stringify(remainingQueue));
  } else {
    clearOfflineQueue();
    console.log("[Sync] All offline actions synced or resolved successfully!");
  }
};
