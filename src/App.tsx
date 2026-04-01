// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { SidebarLayout } from "./components/SidebarLayout";
import { FeedPage } from "./pages/FeedPage";
import { PresentationPage } from "./pages/PresentationPage";
import { LogInPage } from "./pages/authentication/LogInPage";
import { SignUpPage } from "./pages/authentication/SignUpPage";
import { PollEditPage } from "./pages/polls/PollEditPage";
import { PollCreatePage } from "./pages/polls/PollCreatePage";
import { setPreference, trackUserActivity } from "./services/browserMonitoringService";
import { createMessage } from "./services/messageService";
import { addOption, createPoll, updatePoll, vote } from "./services/pollService";
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
import type { NewPollData } from "./components/PollCardCreate";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [isCrudDemoRunning, setIsCrudDemoRunning] = useState(false);
  const crudDemoTimeoutsRef = useRef<number[]>([]);

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

  useEffect(() => {
    trackUserActivity("route", location.pathname);
    setPreference("lastVisitedRoute", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      crudDemoTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const handleUpdatePoll = (pollId: string, updates: Partial<typeof initialPolls[0]>) => {
    setPolls((currentPolls) =>
      currentPolls.map((poll) => (poll.id === pollId ? updatePoll(poll, updates) : poll))
    );
    trackUserActivity("poll", `update-poll:${pollId}`);
  };

  const handleDeletePoll = (pollId: string) => {
    // Filters out the deleted poll and updates the global state
    setPolls((currentPolls) => currentPolls.filter((poll) => poll.id !== pollId));
    trackUserActivity("poll", `delete-poll:${pollId}`);
  };

  const handleCreatePoll = (pollData: NewPollData) => {
    const ownerId = currentUserId ?? seededUser.id;
    let nextPoll = createPoll(
      pollData.title.trim(),
      "General",
      pollData.description.trim(),
      pollData.imageUrl.trim() || "/logo.png"
    );

    pollData.options.forEach((optionText) => {
      nextPoll = addOption(nextPoll, optionText.trim(), ownerId);
    });

    nextPoll = {
      ...nextPoll,
      ownerId,
    };

    setPolls((currentPolls) => [nextPoll, ...currentPolls]);
    trackUserActivity("poll", `create-poll:${nextPoll.id}`);
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
    trackUserActivity("poll", `vote:${pollId}:${optionId}`);
  };

  const handleSubmitMarginalityResponse = (response: MarginalityTestResponse) => {
    setMarginalityResponses((currentResponses) => {
      const withoutCurrentUsersResponse = currentResponses.filter(
        (currentResponse) =>
          !(currentResponse.testId === response.testId && currentResponse.userId === response.userId)
      );

      return [...withoutCurrentUsersResponse, response];
    });
    trackUserActivity("marginality", `submit-report:${response.testId}`);
  };

  const handleRunCrudDemo = () => {
    if (isCrudDemoRunning) {
      return;
    }

    setIsCrudDemoRunning(true);
    trackUserActivity("demo", "start-crud-thread");
    crudDemoTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    crudDemoTimeoutsRef.current = [];

    const ownerId = currentUserId ?? seededUser.id;
    const demoPollIds: string[] = [];

    const schedule = (delay: number, callback: () => void) => {
      const timeoutId = window.setTimeout(callback, delay);
      crudDemoTimeoutsRef.current.push(timeoutId);
    };

    schedule(0, () => {
      let demoPoll = createPoll(
        "Live CRUD Demo Poll",
        "General",
        "This poll was created by the dashboard demo thread.",
        "/logo.png"
      );
      demoPoll = addOption(addOption(demoPoll, "Create works", ownerId), "Delete works", ownerId);
      demoPoll = { ...demoPoll, ownerId };
      demoPollIds.push(demoPoll.id);
      setPolls((currentPolls) => [demoPoll, ...currentPolls]);
      trackUserActivity("demo", `create:${demoPoll.id}`);
    });

    schedule(1400, () => {
      let secondDemoPoll = createPoll(
        "Second Demo Poll",
        "General",
        "The demo thread added another entity to the list.",
        "/logo.png"
      );
      secondDemoPoll = addOption(addOption(secondDemoPoll, "Visible add", ownerId), "Visible delete", ownerId);
      secondDemoPoll = { ...secondDemoPoll, ownerId };
      demoPollIds.push(secondDemoPoll.id);
      setPolls((currentPolls) => [secondDemoPoll, ...currentPolls]);
      trackUserActivity("demo", `create:${secondDemoPoll.id}`);
    });

    schedule(2800, () => {
      const firstDemoPollId = demoPollIds[0];

      if (firstDemoPollId) {
        setPolls((currentPolls) => currentPolls.filter((poll) => poll.id !== firstDemoPollId));
        trackUserActivity("demo", `delete:${firstDemoPollId}`);
      }
    });

    schedule(4200, () => {
      const secondDemoPollId = demoPollIds[1];

      if (secondDemoPollId) {
        setPolls((currentPolls) => currentPolls.filter((poll) => poll.id !== secondDemoPollId));
        trackUserActivity("demo", `delete:${secondDemoPollId}`);
      }

      setIsCrudDemoRunning(false);
      crudDemoTimeoutsRef.current = [];
      trackUserActivity("demo", "finish-crud-thread");
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
                onAdd={() => navigate("/create-poll")}
                onUpdate={(id: string) => {
                  setActiveEditPollId(id);
                  navigate("/edit");
                }}
                onDelete={handleDeletePoll}
                // Added the 3 missing props!
                currentUserId={currentUserId ?? seededUser.id}
                userVotes={userVotes}
                onVote={handleVote}
                onRunCrudDemo={handleRunCrudDemo}
                isCrudDemoRunning={isCrudDemoRunning}
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
              <PollCreatePage onCreatePoll={handleCreatePoll} />
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
