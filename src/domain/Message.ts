export interface Message {
    id: string;
    pollId: string;
    userId: string;
    content: string;
    answerTo?: string;
}