import type { Poll } from "../../domain/Poll";
import { PollCardEdit } from "../../components/PollCardEdit";


type PollPageProps = {
    pollId: string;
    polls: Poll[];
    onUpdatePoll: (pollId: string, updates: Partial<Poll>) => void;
    
};

export function PollEditPage({
    pollId,
    polls,
    onUpdatePoll,
}: PollPageProps) {
    const poll = polls.find((currentPoll) => currentPoll.id === pollId);

    if (!poll) {
        return (
            <div style={{ minHeight: "100vh", padding: "24px", boxSizing: "border-box", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <h1 style={{ color: "white", margin: 0 }}>Poll not found</h1>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", padding: "32px 24px", boxSizing: "border-box", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
                <PollCardEdit
                    pollId={poll.id}
                    polls={polls}
                    onUpdatePoll={onUpdatePoll}
                />
            </div> 
        </div>
    );
}
