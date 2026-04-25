import { useEffect } from "react";
import { useGlobalStore } from "../store/useGlobalStore";

export const useWebSocket = (client: any) => {
  const setPolls = useGlobalStore((state) => state.setPolls);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_POLL") {
          
          client.refetchQueries({ include: "active" });
          
          setPolls((currentPolls) => {
             const parsedPoll = { ...data.payload, dateCreated: new Date(data.payload.dateCreated) };
             return [parsedPoll, ...currentPolls]; 
          });

        }
      } catch (error) {
        console.error(error);
      }
    };

    return () => {
      ws.close();
    };
  }, [client, setPolls]);
};