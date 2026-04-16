import { useEffect, useMemo } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { SidebarLayout } from "./components/SidebarLayout";
import { FeedPage } from "./pages/FeedPage";
import { PresentationPage } from "./pages/PresentationPage";
import { LogInPage } from "./pages/authentication/LogInPage";
import { SignUpPage } from "./pages/authentication/SignUpPage";
import { PollEditPage } from "./pages/polls/PollEditPage";
import { PollCreatePage } from "./pages/polls/PollCreatePage";
import { setPreference, trackUserActivity } from "./services/browserMonitoringService";
import { getSeededMarginalityResponses,getSeededMarginalityTests,getSeededPolls,getSeededUser } from "./store/seedData";
import { UserStatsPage } from "./pages/UserStatsPage";
import { MarginalityTestPage } from "./pages/MarginalityTestPage";
import { TakeMarginalityTest } from "./pages/marginality/TakeMarginalityTest";
import { MarginalityTestPage as MarginalityQuestionPage } from "./pages/marginality/MarginalityTestPage";
import { MarginalityReport } from "./pages/marginality/MarginalityReport";
import { useGlobalStore } from "./store/useGlobalStore";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const setPolls = useGlobalStore((state) => state.setPolls);
  const setUsers = useGlobalStore((state) => state.setUsers);
  const setCurrentUserId = useGlobalStore((state) => state.setCurrentUserId);
  const setMarginalityTests = useGlobalStore((state) => state.setMarginalityTests);
  const setMarginalityResponses = useGlobalStore((state) => state.setMarginalityResponses);

  const polls = useGlobalStore((state) => state.polls);
  const users = useGlobalStore((state) => state.users);
  const userVotes = useGlobalStore((state) => state.userVotes);
  const marginalityTests = useGlobalStore((state) => state.marginalityTests);
  const marginalityResponses = useGlobalStore((state) => state.marginalityResponses);
  const currentUserId = useGlobalStore((state) => state.currentUserId);

  const handleSubmitMarginalityResponse = useGlobalStore((state) => state.handleSubmitMarginalityResponse);

  const seededUser = useMemo(() => users[0] ?? getSeededUser(), [users]);
  const initialPolls = useMemo(() => polls.length > 0 ? polls : getSeededPolls(), [polls]);
  const initialMarginalityTests = useMemo(
    () => (marginalityTests.length > 0 ? marginalityTests : getSeededMarginalityTests()),
    [marginalityTests]
  );
  const initialMarginalityResponses = useMemo(
    () =>
      marginalityResponses.length > 0
        ? marginalityResponses
        : getSeededMarginalityResponses(initialMarginalityTests),
    [initialMarginalityTests, marginalityResponses]
  );

  useEffect(() => {
    if (users.length === 0) setUsers([seededUser]);
    if (!currentUserId) setCurrentUserId(seededUser.id);

    if (polls.length === 0) setPolls(initialPolls);

    if (marginalityTests.length === 0) {
      setMarginalityTests(initialMarginalityTests);
    }

    if (marginalityResponses.length === 0) {
      setMarginalityResponses(initialMarginalityResponses);
    }
  }, [
    currentUserId,
    initialMarginalityResponses,
    initialMarginalityTests,
    initialPolls,
    marginalityResponses.length,
    marginalityTests.length,
    polls.length,
    seededUser,
    setCurrentUserId,
    setMarginalityResponses,
    setMarginalityTests,
    setPolls,
    setUsers,
    users.length,
  ]);

  useEffect(() => {
    trackUserActivity("route", location.pathname);
    setPreference("lastVisitedRoute", location.pathname);
  }, [location.pathname]);

  return (
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
                currentUserId={currentUserId ?? seededUser.id}
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
                currentUserId={currentUserId ?? seededUser.id}
                userVotes={userVotes}
              />
            </div>
          }
        />
        <Route
          path="/marginality-test"
          element={
            <div style={{ minHeight: "100vh" }}>
              <MarginalityTestPage
                tests={marginalityTests.length > 0 ? marginalityTests : initialMarginalityTests}
                responses={marginalityResponses.length > 0 ? marginalityResponses : initialMarginalityResponses}
              />
            </div>
          }
        />
        <Route
          path="/marginality-test/:testId/take"
          element={
            <div style={{ minHeight: "100vh" }}>
              <TakeMarginalityTest
                tests={marginalityTests.length > 0 ? marginalityTests : initialMarginalityTests}
              />
            </div>
          }
        />
        <Route
          path="/marginality-test/:testId/questions/:questionIndex"
          element={
            <div style={{ minHeight: "100vh" }}>
              <MarginalityQuestionPage
                tests={marginalityTests.length > 0 ? marginalityTests : initialMarginalityTests}
                responses={marginalityResponses.length > 0 ? marginalityResponses : initialMarginalityResponses}
              />
            </div>
          }
        />
        <Route
          path="/marginality-test/:testId/report"
          element={
            <div style={{ minHeight: "100vh" }}>
              <MarginalityReport
                tests={marginalityTests.length > 0 ? marginalityTests : initialMarginalityTests}
                responses={marginalityResponses.length > 0 ? marginalityResponses : initialMarginalityResponses}
                currentUserId={currentUserId ?? seededUser.id}
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
  );
}

export default App;
