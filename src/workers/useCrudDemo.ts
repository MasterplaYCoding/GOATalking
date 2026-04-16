import { useRef, useState, useEffect } from "react";
import { createPoll, addOption } from "../services/pollService";
import { trackUserActivity } from "../services/browserMonitoringService";
import DemoWorker from "./crudDemoWorker?worker";
import type { Poll } from "../domain/Poll";

export function useCrudDemo(activeUserId: string, setPolls: (updater: Poll[] | ((currentPolls: Poll[]) => Poll[])) => void) {

  const [isCrudDemoRunning, setIsCrudDemoRunning] = useState(false);
  const crudDemoWorkerRef = useRef<Worker | null>(null);
  const demoPollIdsRef = useRef<string[]>([]);

  const userIdRef = useRef(activeUserId);
  useEffect(() => {
    userIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    return () => crudDemoWorkerRef.current?.terminate();
  }, []);

  const stopCrudDemo = () => {
    crudDemoWorkerRef.current?.postMessage({ type: "stop" });
    crudDemoWorkerRef.current?.terminate();
    crudDemoWorkerRef.current = null;

    if (demoPollIdsRef.current.length > 0) {
      const demoPollIds = new Set(demoPollIdsRef.current);
      setPolls((currentPolls) => currentPolls.filter((poll) => !demoPollIds.has(poll.id)));
    }
    demoPollIdsRef.current = [];
    setIsCrudDemoRunning(false);
    trackUserActivity("demo", "stop-crud-thread");
  };

  const handleCrudWorkerEvent = (eventType: string) => {
    const ownerId = userIdRef.current; 

    if (eventType === "create-first") {
      let demoPoll = createPoll("Live CRUD Demo Poll", "General", "Created by demo thread.", "/logo.png");
      demoPoll = addOption(addOption(demoPoll, "Create works", ownerId), "Delete works", ownerId);
      demoPoll = { ...demoPoll, ownerId };
      console.log("Creating poll with ownerId:", ownerId, " | Current actual user ID:", activeUserId);
      demoPollIdsRef.current.push(demoPoll.id);
      setPolls((currentPolls) => {
        const newPolls = [demoPoll, ...currentPolls];
        console.log(`📦 STORE UPDATE: Store had ${currentPolls.length} polls. Now saving ${newPolls.length} polls.`);
        return newPolls;
      });
      trackUserActivity("demo", `create:${demoPoll.id}`);
    } 
    else if (eventType === "create-second") {
      let secondDemoPoll = createPoll("Second Demo Poll", "General", "Another demo entity.", "/logo.png");
      secondDemoPoll = addOption(addOption(secondDemoPoll, "Visible add", ownerId), "Visible delete", ownerId);
      secondDemoPoll = { ...secondDemoPoll, ownerId };
      demoPollIdsRef.current.push(secondDemoPoll.id);
      setPolls((currentPolls) => {
        const newPolls = [secondDemoPoll, ...currentPolls];
        console.log(`📦 STORE UPDATE: Store had ${currentPolls.length} polls. Now saving ${newPolls.length} polls.`);
        return newPolls;
      });
      trackUserActivity("demo", `create:${secondDemoPoll.id}`);
    } 
    else if (eventType === "delete-first" || eventType === "delete-second") {
      const nextDemoPollId = demoPollIdsRef.current[0];
      if (nextDemoPollId) {
        setPolls((currentPolls) => currentPolls.filter((poll) => poll.id !== nextDemoPollId));
        demoPollIdsRef.current = demoPollIdsRef.current.filter((pollId) => pollId !== nextDemoPollId);
        trackUserActivity("demo", `delete:${nextDemoPollId}`);
      }
    } 
    else if (eventType === "done") {
      stopCrudDemo();
    }
  };

  const handleRunCrudDemo = () => {
    if (isCrudDemoRunning) {
      stopCrudDemo();
      return;
    }
    setIsCrudDemoRunning(true);
    trackUserActivity("demo", "start-crud-thread");
    demoPollIdsRef.current = [];

    crudDemoWorkerRef.current?.terminate();
    const worker = new DemoWorker();

    worker.onmessage = (event) => handleCrudWorkerEvent(event.data.type);
    
    crudDemoWorkerRef.current = worker;
    worker.postMessage({ type: "start" });
  };

  return { isCrudDemoRunning, handleRunCrudDemo };
}