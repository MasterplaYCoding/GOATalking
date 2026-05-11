import { useEffect } from "react";
import { WS_URL } from "../config";
import { useGlobalStore } from "../store/useGlobalStore";

export const useWebSocket = (client: any) => {
  const setPolls = useGlobalStore((state) => state.setPolls);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_POLL") {
          client.refetchQueries({ include: "active" });
          
          setPolls((currentPolls) => {
            const parsedPoll = { 
              ...data.payload, 
              dateCreated: new Date(data.payload.dateCreated) 
            };

            const existingPollIndex = currentPolls.findIndex(p => p.title === parsedPoll.title);

            if (existingPollIndex !== -1) {
              const updatedPolls = [...currentPolls];
              updatedPolls[existingPollIndex] = parsedPoll;
              return updatedPolls;
            }

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