import { describe, expect, it } from "vitest";
import { createMessage, getMessagesForPoll } from "./messageService";

describe("messageService", () => {
  it("creates messages and filters them by poll", () => {
    const firstMessage = createMessage("poll-1", "user-1", "First reply");
    const secondMessage = createMessage("poll-2", "user-2", "Second reply");
    const thirdMessage = createMessage("poll-1", "user-3", "Third reply", firstMessage.id);

    const pollMessages = getMessagesForPoll([firstMessage, secondMessage, thirdMessage], "poll-1");

    expect(firstMessage.id).toBeTruthy();
    expect(thirdMessage.answerTo).toBe(firstMessage.id);
    expect(pollMessages).toHaveLength(2);
    expect(pollMessages.map((message) => message.content)).toEqual(["First reply", "Third reply"]);
  });
});
