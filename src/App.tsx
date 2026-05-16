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
import { GlobalChatPage } from "./pages/GlobalChatPage";
import { MarginalityTestPage } from "./pages/MarginalityTestPage";
import { TakeMarginalityTest } from "./pages/marginality/TakeMarginalityTest";
import { MarginalityTestPage as MarginalityQuestionPage } from "./pages/marginality/MarginalityTestPage";
import { MarginalityReport } from "./pages/marginality/MarginalityReport";
import { useGlobalStore } from "./store/useGlobalStore";
import { syncOfflineQueue } from "./services/offlineQueueService";
import { normalizeMarginalityResponse } from "./services/marginalityTestService";
import { useWebSocket } from "./hooks/useWebSocket";
import { useBackendStatus } from "./hooks/useBackendStatus";
import { useResponsive } from "./hooks/useResponsive";
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import type { Poll } from "./domain/Poll";
import type { User } from "./domain/User";
import type { MarginalityTest, MarginalityTestResponse } from "./domain/MarginalityTest";
import { GRAPHQL_URL, API_BASE_URL } from "./config";
import { ObservationListPage } from "./pages/ObservationListPage";

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
  const { isMobile } = useResponsive();

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
  const users = useGlobalStore((state) => state.users);

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

  const isPublicRoute = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup";

  return (
    <ApolloProvider client={client}>
    {isBackendOffline ? <OfflineBanner /> : null}
    {!isPublicRoute ? <UserRoleBadge currentUserId={currentUserId} users={users} isMobile={isMobile} /> : null}
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
          path="/global-chat"
          element={
            <div style={{ minHeight: "100vh" }}>
              <GlobalChatPage />
            </div>
          }
        />
        <Route
          path="/observations"
          element={
            <div style={{ minHeight: "100vh" }}>
              <ObservationListPage />
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

function UserRoleBadge({
  currentUserId,
  isMobile,
  users,
}: {
  currentUserId?: string;
  isMobile: boolean;
  users: User[];
}) {
  const currentUser = users.find((user) => user.id === currentUserId);

  if (!currentUser) {
    return null;
  }

  const roleLabel = resolveUserRoleLabel(currentUser);
  const isAdmin = roleLabel.toLowerCase() === "admin";

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: isMobile ? 92 : 16,
        zIndex: 1000,
        borderRadius: 999,
        padding: "8px 14px",
        background: isAdmin ? "rgba(215, 178, 62, 0.18)" : "rgba(71, 199, 170, 0.16)",
        color: isAdmin ? "#ffe9a6" : "#c7fff2",
        border: isAdmin ? "1px solid rgba(255, 221, 122, 0.45)" : "1px solid rgba(71, 199, 170, 0.45)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
        backdropFilter: "blur(10px)",
      }}
    >
      {isAdmin ? "Admin" : "User"} mode
    </div>
  );
}

function resolveUserRoleLabel(user: User): string {
  const explicitRoleName =
    user.roleName ??
    (typeof user.role === "string" ? user.role : user.role?.name);

  if (explicitRoleName) {
    return explicitRoleName;
  }

  const permissionNames = (user.permissions ?? []).map((permission) =>
    typeof permission === "string" ? permission : permission.name ?? ""
  );

  if (permissionNames.some((permission) => permission.toUpperCase() === "FULL_ACCESS")) {
    return "Admin";
  }

  if (user.username === "demo-user") {
    return "Admin";
  }

  return "User";
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
