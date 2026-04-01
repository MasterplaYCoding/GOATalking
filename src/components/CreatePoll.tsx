import { useState } from "react";


type CreatePollProps = {
  onCreate: (title: string) => void;
};


export function CreatePoll({ onCreate }: CreatePollProps) {
  const [title, setTitle] = useState("");

  return (
    <div>
      <input
        placeholder="Poll title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <button onClick={() => {
        if (!title.trim()) return;
        onCreate(title);
        setTitle("");
      }}>
        Create
      </button>
    </div>
  );
}