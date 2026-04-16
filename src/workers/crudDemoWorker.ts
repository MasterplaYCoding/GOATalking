type WorkerCommand = { type: "start" } | { type: "stop" };

type WorkerEvent =
  | "create-first"
  | "create-second"
  | "delete-first"
  | "delete-second";

const scheduledTimeouts: number[] = [];
let isRunning = false;

function clearScheduledTimeouts() {
  scheduledTimeouts.forEach((timeoutId) => self.clearTimeout(timeoutId));
  scheduledTimeouts.length = 0;
}

function schedule(delay: number, eventType: WorkerEvent) {
  const timeoutId = self.setTimeout(() => {
    if (!isRunning) {
      return;
    }

    self.postMessage({ type: eventType });
  }, delay);

  scheduledTimeouts.push(timeoutId);
}

function runCycle() {
  if (!isRunning) {
    return;
  }

  schedule(0, "create-first");
  schedule(1400, "create-second");
  schedule(2800, "delete-first");
  schedule(4200, "delete-second");

  const nextCycleTimeoutId = self.setTimeout(() => {
    runCycle();
  }, 4300);

  scheduledTimeouts.push(nextCycleTimeoutId);
}

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  console.log("📍 Checkpoint 2: Worker heard message:", event.data.type); // <-- ADD THIS
  if (event.data.type === "stop") {
    isRunning = false;
    clearScheduledTimeouts();
    return;
  }

  isRunning = true;
  clearScheduledTimeouts();
  runCycle();
};

export {};
