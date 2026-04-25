import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { SidebarLayout } from "./components/SidebarLayout";
import { FeedPage } from "./pages/FeedPage";
import { PresentationPage } from "./pages/PresentationPage";
import { LogInPage } from "./pages/authentication/LogInPage";
import { SignUpPage } from "./pages/authentication/SignUpPage";
import { PollEditPage } from "./pages/polls/PollEditPage";
import { PollCreatePage } from "./pages/polls/PollCreatePage";
import { setPreference, trackUserActivity } from "./services/browserMonitoringService";
import { UserStatsPage } from "./pages/UserStatsPage";
import { PollListsPage } from "./pages/PollListsPage";
import { MarginalityTestPage } from "./pages/MarginalityTestPage";
import { TakeMarginalityTest } from "./pages/marginality/TakeMarginalityTest";
import { MarginalityTestPage as MarginalityQuestionPage } from "./pages/marginality/MarginalityTestPage";
import { MarginalityReport } from "./pages/marginality/MarginalityReport";
import { useGlobalStore } from "./store/useGlobalStore";
import { syncOfflineQueue } from "./services/offlineQueueService";
import { normalizeMarginalityResponse } from "./services/marginalityTestService";
import { useWebSocket } from "./hooks/useWebSocket";
import { useBackendStatus } from "./hooks/useBackendStatus";
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import type { Poll } from "./domain/Poll";
import type { User } from "./domain/User";
import type { MarginalityTest, MarginalityTestResponse } from "./domain/MarginalityTest";
import { GRAPHQL_URL, API_BASE_URL } from "./config";

const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL }),
  cache: new InMemoryCache(),
});

type BackendPoll = Omit<Poll, "dateCreated"> & { dateCreated: string };
type BackendUser = User;
type BackendMarginalityTest = Omit<MarginalityTest, "createdAt"> & { createdAt: string };
type BackendMarginalityResponse = Omit<MarginalityTestResponse, "submittedAt"> & {
  submittedAt: string;
  categoryValues?: Record<string, unknown>;
  votes?: Array<{ questionId: string; agreement: number | string }>;
  profile?: Record<string, unknown>;
};

function App() {

  useWebSocket(client);
  const isBackendOffline = useBackendStatus();

  const navigate = useNavigate();
  const location = useLocation();

  const setPolls = useGlobalStore((state) => state.setPolls);
  const setUsers = useGlobalStore((state) => state.setUsers);
  const setCurrentUserId = useGlobalStore((state) => state.setCurrentUserId);
  const setMarginalityTests = useGlobalStore((state) => state.setMarginalityTests);
  const setMarginalityResponses = useGlobalStore((state) => state.setMarginalityResponses);

  const polls = useGlobalStore((state) => state.polls);
  const userVotes = useGlobalStore((state) => state.userVotes);
  const marginalityTests = useGlobalStore((state) => state.marginalityTests);
  const marginalityResponses = useGlobalStore((state) => state.marginalityResponses);
  const currentUserId = useGlobalStore((state) => state.currentUserId);

  const handleSubmitMarginalityResponse = useGlobalStore((state) => state.handleSubmitMarginalityResponse);

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        let parsedTests: MarginalityTest[] = [];

        const pollsRes = await fetch(`${API_BASE_URL}/api/polls?limit=4`);
        if (pollsRes.ok) {
          const pollsData = await pollsRes.json() as { data?: BackendPoll[] } | BackendPoll[];
          const rawPolls = Array.isArray(pollsData) ? pollsData : (pollsData.data ?? []);
          const parsedPolls = rawPolls.map((poll) => ({
            ...poll,
            dateCreated: new Date(poll.dateCreated)
          }));
          setPolls((currentPolls) => {
            const pollMap = new Map(currentPolls.map((poll) => [poll.id, poll]));

            parsedPolls.forEach((poll) => {
              pollMap.set(poll.id, poll);
            });

            return Array.from(pollMap.values()).sort(
              (a, b) => b.dateCreated.getTime() - a.dateCreated.getTime()
            );
          });
        }

        const usersRes = await fetch(`${API_BASE_URL}/api/users?limit=50`);
        if (usersRes.ok) {
          const usersData = await usersRes.json() as { data?: BackendUser[] } | BackendUser[];
          const fetchedUsers = Array.isArray(usersData) ? usersData : (usersData.data ?? []);
          setUsers(fetchedUsers);
          if (fetchedUsers.length > 0 && !currentUserId) {
            setCurrentUserId(fetchedUsers[0].id);
          }
        }

        const marginalityRes = await fetch(`${API_BASE_URL}/api/marginality?limit=50`);
        if (marginalityRes.ok) {
          const marginalityData = await marginalityRes.json() as { data?: BackendMarginalityTest[] } | BackendMarginalityTest[];
          const rawTests = Array.isArray(marginalityData) ? marginalityData : (marginalityData.data ?? []);
          parsedTests = rawTests.map((test) => ({
            ...test,
            createdAt: new Date(test.createdAt)
          }));
          setMarginalityTests(parsedTests);
        }

        const responsesRes = await fetch(`${API_BASE_URL}/api/marginality/responses`);
        if (responsesRes.ok) {
          const responsesData = await responsesRes.json() as { data?: BackendMarginalityResponse[] } | BackendMarginalityResponse[];
          const rawResponses = Array.isArray(responsesData) ? responsesData : (responsesData.data ?? []);
          
          const parsedResponses = rawResponses
            .map((response) => {
              const baseResponse = { ...response, submittedAt: new Date(response.submittedAt) };
              const matchingTest = parsedTests.find((test) => test.id === baseResponse.testId);
              if (!matchingTest) return null;
              return normalizeMarginalityResponse(matchingTest, baseResponse);
            })
            .filter((response): response is MarginalityTestResponse => response !== null);
            
          setMarginalityResponses(parsedResponses);
        }

        console.log("Successfully connected to Node.js Backend!");
      } catch (error) {
        console.error(error);
      }
    };

    fetchBackendData();

    window.addEventListener("online", syncOfflineQueue);
    return () => window.removeEventListener("online", syncOfflineQueue);
  }, [setPolls, setUsers, setMarginalityTests, setMarginalityResponses, setCurrentUserId, currentUserId]);

  useEffect(() => {
    trackUserActivity("route", location.pathname);
    setPreference("lastVisitedRoute", location.pathname);
  }, [location.pathname]);

  return (
    <ApolloProvider client={client}>
    {isBackendOffline ? <OfflineBanner /> : null}
    <Routes>
      <Route
        path="/"
        element={
          <div style={{ minHeight: "100vh" }}>
            <PresentationPage
              onLogIn={() => navigate("/login")}
              onSignUp={() => navigate("/signup")}
            />
          </div>
        }
      />
      <Route
        path="/login"
        element={
          <div style={{ minHeight: "100vh" }}>
            <LogInPage
              onSubmit={() => navigate("/feed")}
              onSwitchToSignUp={() => navigate("/signup")}
            />
          </div>
        }
      />
      <Route
        path="/signup"
        element={
          <div style={{ minHeight: "100vh" }}>
            <SignUpPage
              onSubmit={() => navigate("/feed")}
              onSwitchToLogIn={() => navigate("/login")}
            />
          </div>
        }
      />
      <Route element={<SidebarLayout />}>
        <Route
          path="/feed"
          element={
            <div style={{ minHeight: "100vh" }}>
              <FeedPage
                polls={polls}
                currentUserId={currentUserId ?? "demo-user"}
                userVotes={userVotes}
              />
            </div>
          }
        />
        <Route
          path="/your-polls"
          element={
            <div style={{ minHeight: "100vh" }}>
              <UserStatsPage
                polls={polls}
                setPolls={setPolls}
                currentUserId={currentUserId ?? "demo-user"}
                userVotes={userVotes}
              />
            </div>
          }
        />
        <Route
          path="/lists"
          element={
            <div style={{ minHeight: "100vh" }}>
              <PollListsPage />
            </div>
          }
        />
        <Route
          path="/marginality-test"
          element={
            <div style={{ minHeight: "100vh" }}>
              <MarginalityTestPage
                tests={marginalityTests}
                responses={marginalityResponses}
              />
            </div>
          }
        />
        <Route
          path="/marginality-test/:testId/take"
          element={
            <div style={{ minHeight: "100vh" }}>
              <TakeMarginalityTest
                tests={marginalityTests}
              />
            </div>
          }
        />
        <Route
          path="/marginality-test/:testId/questions/:questionIndex"
          element={
            <div style={{ minHeight: "100vh" }}>
              <MarginalityQuestionPage
                tests={marginalityTests}
                responses={marginalityResponses}
              />
            </div>
          }
        />
        <Route
          path="/marginality-test/:testId/report"
          element={
            <div style={{ minHeight: "100vh" }}>
              <MarginalityReport
                tests={marginalityTests}
                responses={marginalityResponses}
                currentUserId={currentUserId ?? "demo-user"}
                onSubmitResponse={handleSubmitMarginalityResponse}
              />
            </div>
          }
        />
        <Route
          path="/create-poll"
          element={
            <div style={{ minHeight: "100vh" }}>
              <PollCreatePage />
            </div>
          }
        />
        <Route
          path="/edit/:pollId" 
          element={
            <div style={{ minHeight: "100vh" }}>
              <PollEditPage /> 
            </div>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ApolloProvider>
  );
}

function OfflineBanner() {
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        borderRadius: 999,
        padding: "8px 16px",
        background: "rgba(20, 20, 20, 0.82)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.01em",
        backdropFilter: "blur(10px)",
      }}
    >
      Offline mode: backend server is unavailable
    </div>
  );
}

export default App;
