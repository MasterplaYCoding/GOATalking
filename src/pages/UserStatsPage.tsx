import { useEffect, useMemo, useState } from "react";
import type { Poll } from "../domain/Poll";
import type { UserVotes } from "../domain/User";
import { useResponsive } from "../hooks/useResponsive";
import { UserPollsTable } from "../components/UserPollsTable";
import { API_BASE_URL } from "../config";


type UserStatsPageProps = {
    polls: Poll[];
    setPolls: (updater: Poll[] | ((currentPolls: Poll[]) => Poll[])) => void;
    currentUserId: string;
    userVotes: UserVotes;
};

type BackendPoll = Omit<Poll, "dateCreated"> & { dateCreated: string };

const CHART_COLORS = [
    "#A3E4D7",
    "#73C6B6",
    "#47C7AA",
    "#315B58",
    "#1F3D3A",
];

type ChartDataPoint = {
    label: string;
    value: number;
    color: string;
};

const PieChartCard = ({ title, description, data }: { title: string; description: string; data: ChartDataPoint[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let cumulativePercent = 0;
    const gradientStops = total === 0
        ? "#e0e0e0 0% 100%"
        : data.map((item) => {
            const percent = (item.value / total) * 100;
            const stop = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
            cumulativePercent += percent;
            return stop;
        }).join(", ");

    return (
        <div
            style={{
                backgroundColor: "#C4DBD5",
                borderRadius: "20px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                height: "100%",
                minHeight: "420px", 
                boxSizing: "border-box",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
        >
            <h3 style={{ margin: "0 0 8px 0", color: "#1F3D3A", textAlign: "center" }}>{title}</h3>
            <p style={{ margin: "0 0 24px 0", color: "#315B58", textAlign: "center", fontSize: "0.9rem" }}>
                {description}
            </p>

            <div
                style={{
                    width: "160px",
                    height: "160px",
                    borderRadius: "50%",
                    background: `conic-gradient(${gradientStops})`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    marginBottom: "32px",
                    flexShrink: 0,
                }}
            />

            {/* The Legend */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.map((item, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: item.color }} />
                            <span style={{ color: "#1F3D3A", fontWeight: 500 }}>{item.label}</span>
                        </div>
                        <span style={{ color: "#315B58", fontWeight: "bold" }}>
                            {item.value} {item.value === 1 ? "poll" : "polls"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function UserStatsPage({
    polls,
    setPolls,
    currentUserId,
    userVotes,
}: UserStatsPageProps) {
    const { isMobile, isTablet } = useResponsive();
    
    // Track if the backend generator is currently running
    const [isGeneratorRunning, setIsGeneratorRunning] = useState(false);

    useEffect(() => {
        if (!currentUserId) return;

        const fetchMyPolls = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/polls/user/${currentUserId}`);
                if (res.ok) {
                    const data = await res.json() as { data?: BackendPoll[] } | BackendPoll[];
                    const rawPolls = Array.isArray(data) ? data : (data.data ?? []);
                    
                    const parsedMyPolls = rawPolls.map((poll) => ({
                        ...poll,
                        dateCreated: new Date(poll.dateCreated)
                    }));

                    setPolls((current) => {
                        const pollMap = new Map(current.map(p => [p.id, p]));
                        parsedMyPolls.forEach((p: Poll) => pollMap.set(p.id, p));
                        return Array.from(pollMap.values()).sort(
                            (a, b) => b.dateCreated.getTime() - a.dateCreated.getTime()
                        );
                    });
                }
            } catch (error) {
                console.error("Failed to fetch user polls:", error);
            }
        };

        fetchMyPolls();
    }, [currentUserId, setPolls]);
    // ------------------------------------

    const userPolls = useMemo(() => {
        return polls.filter(poll => poll.ownerId === currentUserId);
    }, [polls, currentUserId]);

    const interactionData = useMemo(() => {
        const bins = [0, 0, 0, 0, 0];

        userPolls.forEach(poll => {
            const count = poll.interactionCount;
            if (count <= 10) bins[0]++;
            else if (count <= 50) bins[1]++;
            else if (count <= 100) bins[2]++;
            else if (count <= 500) bins[3]++;
            else bins[4]++;
        });

        return [
            { label: "0 - 10", value: bins[0], color: CHART_COLORS[0] },
            { label: "11 - 50", value: bins[1], color: CHART_COLORS[1] },
            { label: "51 - 100", value: bins[2], color: CHART_COLORS[2] },
            { label: "101 - 500", value: bins[3], color: CHART_COLORS[3] },
            { label: "500+", value: bins[4], color: CHART_COLORS[4] },
        ];
    }, [userPolls]);

    const dominanceData = useMemo(() => {
        const bins = [0, 0, 0, 0, 0];

        userPolls.forEach(poll => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

            if (totalVotes === 0) {
                bins[0]++;
                return;
            }

            const maxVotes = Math.max(...poll.options.map(opt => opt.votes));
            const percentage = (maxVotes / totalVotes) * 100;

            if (percentage <= 30) bins[0]++;
            else if (percentage <= 50) bins[1]++;
            else if (percentage <= 60) bins[2]++;
            else if (percentage <= 80) bins[3]++;
            else bins[4]++;
        });

        return [
            { label: "0% - 30%", value: bins[0], color: CHART_COLORS[0] },
            { label: "31% - 50%", value: bins[1], color: CHART_COLORS[1] },
            { label: "51% - 60%", value: bins[2], color: CHART_COLORS[2] },
            { label: "61% - 80%", value: bins[3], color: CHART_COLORS[3] },
            { label: "80%+", value: bins[4], color: CHART_COLORS[4] },
        ];
    }, [userPolls]);

    const handleStartGenerator = async () => {
        setIsGeneratorRunning(true);
        await fetch(`${API_BASE_URL}/api/generator/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId }),
        });
    };

    const handleStopGenerator = async () => {
        setIsGeneratorRunning(false);
        await fetch(`${API_BASE_URL}/api/generator/stop`, {
            method: "POST",
        });
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: isMobile ? "20px 16px 24px" : "40px 32px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? "20px" : "32px",
            }}
        >
            <div style={{ textAlign: "center" }}>
                <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : "2.5rem" }}>Creator Dashboard</h1>
                <p style={{ color: "white", margin: "8px 0 0 0", fontSize: isMobile ? "0.95rem" : "1.1rem" }}>
                    Track the performance and engagement of your polls.
                </p>
                
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "18px" }}>
                    <button
                        onClick={handleStartGenerator}
                        disabled={isGeneratorRunning}
                        style={{
                            borderRadius: "999px",
                            border: "none",
                            background: isGeneratorRunning ? "rgba(255,255,255,0.2)" : "#47C7AA",
                            color: isGeneratorRunning ? "rgba(255,255,255,0.5)" : "#173533",
                            padding: "10px 20px",
                            fontWeight: 700,
                            cursor: isGeneratorRunning ? "not-allowed" : "pointer",
                            transition: "0.2s"
                        }}
                    >
                        Start Server Generator
                    </button>
                    <button
                        onClick={handleStopGenerator}
                        disabled={!isGeneratorRunning}
                        style={{
                            borderRadius: "999px",
                            border: "1px solid rgba(255, 105, 105, 0.45)",
                            background: "rgba(255, 105, 105, 0.12)",
                            color: !isGeneratorRunning ? "rgba(255,255,255,0.3)" : "#ffd0d0",
                            padding: "10px 20px",
                            fontWeight: 700,
                            cursor: !isGeneratorRunning ? "not-allowed" : "pointer",
                            transition: "0.2s"
                        }}
                    >
                        Stop Generator
                    </button>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 2fr 1fr",
                    gap: isMobile ? "16px" : "24px",
                    alignItems: "start",
                    maxWidth: "1600px",
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                <div style={{ position: isTablet ? "static" : "sticky", top: "40px", order: isTablet ? 1 : 0 }}>
                    <PieChartCard
                        title="Poll Interactions"
                        description="Total votes per poll"
                        data={interactionData}
                    />
                </div>

                <div
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(10px)",
                        borderRadius: "20px",
                        padding: isMobile ? "16px" : "24px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        order: 0,
                    }}
                >
                    <h2 style={{ color: "white", marginTop: 0, marginBottom: "24px" }}>
                        Recent Polls
                    </h2>
                    <UserPollsTable
                        polls={userPolls}
                        currentUserId={currentUserId}
                        userVotes={userVotes}
                    />
                </div>

                <div style={{ position: isTablet ? "static" : "sticky", top: "40px", order: isTablet ? 2 : 0 }}>
                    <PieChartCard
                        title="Frontrunner Dominance"
                        description="Vote % held by the leading option"
                        data={dominanceData}
                    />
                </div>
            </div>
        </div>
    );
}
