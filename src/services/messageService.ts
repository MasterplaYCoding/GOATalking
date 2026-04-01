import { nanoid } from "nanoid";
import type { Message } from "../domain/Message";


export function createMessage(
  pollId: string,
  userId: string,
  content: string,
  answerTo?: string
): Message {
  return {
    id: nanoid(),
    pollId,
    userId,
    content,
    answerTo
  };
}


export function getMessagesForPoll(
  messages: Message[],
  pollId: string
): Message[] {
  return messages.filter(m => m.pollId === pollId);
}