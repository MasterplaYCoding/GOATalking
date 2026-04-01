// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { SidebarLayout } from "./components/SidebarLayout";
import { FeedPage } from "./pages/FeedPage";
import { PresentationPage } from "./pages/PresentationPage";
import { LogInPage } from "./pages/authentication/LogInPage";
import { SignUpPage } from "./pages/authentication/SignUpPage";
import { PollEditPage } from "./pages/polls/PollEditPage";
import { createMessage } from "./services/messageService";
import { updatePoll, vote } from "./services/pollService";
import { useAppState } from "./store/useAppState";
import {
  getSeededMarginalityResponses,
  getSeededMarginalityTests,
  getSeededPolls,
  getSeededUser,
} from "./store/seedData";
import type { MarginalityTestResponse } from "./domain/MarginalityTest";
import { UserStatsPage } from "./pages/UserStatsPage";
import { MarginalityTestPage } from "./pages/MarginalityTestPage";
import { TakeMarginalityTest } from "./pages/marginality/TakeMarginalityTest";
import { MarginalityTestPage as MarginalityQuestionPage } from "./pages/marginality/MarginalityTestPage";
import { MarginalityReport } from "./pages/marginality/MarginalityReport";

function App() {
  const navigate = useNavigate();
  const {
    polls,
    setPolls,
    messages,
    setMessages,
    users,
    setUsers,
    userVotes,
    setUserVotes,
    currentUserId,
    setCurrentUserId,
    marginalityTests,
    setMarginalityTests,
    marginalityResponses,
    setMarginalityResponses,
  } = useAppState();

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

  // Track which poll we are currently editing
  const [activeEditPollId, setActiveEditPollId] = useState<string>(initialPolls[0].id);

  useEffect(() => {
    if (users.length === 0) setUsers([seededUser]);
    if (!currentUserId) setCurrentUserId(seededUser.id);

    if (polls.length === 0) setPolls(initialPolls);

    if (messages.length === 0) {
      setMessages([
        createMessage(initialPolls[0].id, seededUser.id, "Messi changed how playmaking and goalscoring can coexist."),
        createMessage(initialPolls[0].id, seededUser.id, "Ronaldo has one of the strongest longevity cases ever."),
      ]);
    }

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
    messages.length,
    polls.length,
    seededUser,
    setCurrentUserId,
    setMarginalityResponses,
    setMarginalityTests,
    setMessages,
    setPolls,
    setUsers,
    users.length,
  ]);

  const handleUpdatePoll = (pollId: string, updates: Partial<typeof initialPolls[0]>) => {
    setPolls((currentPolls) =>
      currentPolls.map((poll) => (poll.id === pollId ? updatePoll(poll, updates) : poll))
    );
  };

  const handleDeletePoll = (pollId: string) => {
    // Filters out the deleted poll and updates the global state
    setPolls((currentPolls) => currentPolls.filter((poll) => poll.id !== pollId));
  };

  const handleVote = (pollId: string, optionId: string, userId: string) => {
    // 1. Find the poll using the ID
    const poll = polls.find((currentPoll) => currentPoll.id === pollId);

    if (!poll) {
      return;
    }

    // 2. We use the userVotes directly from App.tsx's state!
    const result = vote(poll, optionId, userId, userVotes);

    setPolls((currentPolls) =>
      currentPolls.map((currentPoll) => (currentPoll.id === pollId ? result.poll : currentPoll))
    );
    setUserVotes(result.userVotes);
  };

  const handleSubmitMarginalityResponse = (response: MarginalityTestResponse) => {
    setMarginalityResponses((currentResponses) => {
      const withoutCurrentUsersResponse = currentResponses.filter(
        (currentResponse) =>
          !(currentResponse.testId === response.testId && currentResponse.userId === response.userId)
      );

      return [...withoutCurrentUsersResponse, response];
    });
  };
  

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
                onVote={handleVote}
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
                onAdd={() => navigate("/edit")}
                onUpdate={(id: string) => {
                  setActiveEditPollId(id);
                  navigate("/edit");
                }}
                onDelete={handleDeletePoll}
                // Added the 3 missing props!
                currentUserId={currentUserId ?? seededUser.id}
                userVotes={userVotes}
                onVote={handleVote}
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
          path="/edit"
          element={
            <div style={{ minHeight: "100vh" }}>
              <PollEditPage
                pollId={activeEditPollId}
                polls={polls.length > 0 ? polls : initialPolls}
                onUpdatePoll={handleUpdatePoll}
              />
            </div>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
