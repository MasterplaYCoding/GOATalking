import { useEffect, useState, useRef } from "react";
import { useGlobalStore } from "../store/useGlobalStore";
import { API_BASE_URL } from "../config"; 

type ChatMessage = {
  _id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
};

export function GlobalChat() {
  const currentUserId = useGlobalStore(state => state.currentUserId);
  const users = useGlobalStore(state => state.users);
  
  const currentUser = users.find(u => u.id === currentUserId);
  const username = currentUser?.username || "Anonymous";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.type === "INITIAL_MESSAGES") {
        setMessages(parsed.data);
      } else if (parsed.type === "RECEIVE_MESSAGE") {
        setMessages(prev => [...prev, parsed.data]);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "SEND_MESSAGE",
      payload: {
        userId: currentUserId,
        username: username,
        text: inputText
      }
    }));

    setInputText("");
  };

  return (
    <div style={{ width: "300px", height: "400px", border: "1px solid #ccc", display: "flex", flexDirection: "column", background: "white", color: "black", borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ background: "#2F6F67", color: "white", padding: "10px", fontWeight: "bold", textAlign: "center" }}>
        Global Chat
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.map(msg => {
          const isMe = msg.userId === currentUserId;
          return (
            <div key={msg._id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <span style={{ fontSize: "0.75rem", color: "gray" }}>{msg.username}</span>
              <div style={{ background: isMe ? "#47C7AA" : "#eee", padding: "8px 12px", borderRadius: "12px", color: isMe ? "white" : "black", wordWrap: "break-word" }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", borderTop: "1px solid #ccc" }}>
        <input 
          type="text" 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px", border: "none", outline: "none" }}
        />
        <button type="submit" style={{ padding: "10px", background: "#2F6F67", color: "white", border: "none", cursor: "pointer" }}>Send</button>
      </form>
    </div>
  );
}