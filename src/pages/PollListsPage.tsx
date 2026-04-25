import { useMemo, useState } from "react";
import { useResponsive } from "../hooks/useResponsive";
import { useGlobalStore } from "../store/useGlobalStore";
import { useQuery } from '@apollo/client/react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import type { Poll } from "../domain/Poll";
import type { PollList } from "../domain/PollList";


const OTHERS_LIST_ID = "__others__";

const GET_LIST_DATA = gql`
  query GetListData($userId: String!) {
    getPollLists {
      id
      name
      description
      createdAt
      ownerId
    }
    getPollsByUser(userId: $userId) {
      id
      title
      category
      description
      interactionCount
      listId
    }
  }
`;

const CREATE_LIST = gql`
  mutation CreateList($name: String!, $description: String!, $ownerId: String!) {
    createPollList(name: $name, description: $description, ownerId: $ownerId) { id }
  }
`;

const UPDATE_LIST = gql`
  mutation UpdateList($id: ID!, $name: String, $description: String) {
    updatePollList(id: $id, name: $name, description: $description) { id }
  }
`;

const DELETE_LIST = gql`
  mutation DeleteList($id: ID!) {
    deletePollList(id: $id)
  }
`;

const ASSIGN_POLL = gql`
  mutation AssignPoll($pollId: ID!, $listId: String) {
    assignPollToList(pollId: $pollId, listId: $listId) { id listId }
  }
`;

const cardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "20px",
  backdropFilter: "blur(10px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
};

interface GetListDataResponse {
  getPollLists: GraphQLPollList[];
  getPollsByUser: ListPagePoll[];
}

type GraphQLPollList = Omit<PollList, "createdAt"> & {
  createdAt: string;
};

type ListPagePoll = Pick<Poll, "id" | "title" | "category" | "description" | "interactionCount" | "listId">;

export function PollListsPage() {
  const { isMobile, isTablet } = useResponsive();
  
  const currentUserId = useGlobalStore((state) => state.currentUserId);

  const { data, loading } = useQuery<GetListDataResponse>(GET_LIST_DATA, {
    variables: { userId: currentUserId || "system-user" },
  });

  const [createList] = useMutation(CREATE_LIST, { refetchQueries: ["GetListData"] });
  const [updateList] = useMutation(UPDATE_LIST, { refetchQueries: ["GetListData"] });
  const [deleteList] = useMutation(DELETE_LIST, { refetchQueries: ["GetListData"] });
  const [assignPoll] = useMutation(ASSIGN_POLL, { refetchQueries: ["GetListData"] });

  const lists = useMemo(() => data?.getPollLists ?? [], [data?.getPollLists]);
  const currentUserPolls = useMemo(() => data?.getPollsByUser ?? [], [data?.getPollsByUser]);

  const [selectedListId, setSelectedListId] = useState<string>(OTHERS_LIST_ID);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [moveTargetListId, setMoveTargetListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [draftsByListId, setDraftsByListId] = useState<Record<string, { name: string; description: string }>>({});
  const [visiblePollCountByListId, setVisiblePollCountByListId] = useState<Record<string, number>>({});

  const visibleLists = useMemo(
    () =>
      [...lists].sort((a, b) => a.name.localeCompare(b.name)).concat([
        {
          id: OTHERS_LIST_ID,
          name: "Others",
          description: "Polls that are not part of any custom list yet.",
          createdAt: new Date().toISOString(),
          ownerId: currentUserId,
        },
      ]),
    [currentUserId, lists]
  );

  const effectiveSelectedListId = visibleLists.some((list) => list.id === selectedListId)
    ? selectedListId
    : OTHERS_LIST_ID;

  const selectedList = visibleLists.find((list) => list.id === effectiveSelectedListId) ?? visibleLists[visibleLists.length - 1];

  const filteredPolls = useMemo(() => {
    if (effectiveSelectedListId === OTHERS_LIST_ID) {
      return currentUserPolls.filter((poll) => !poll.listId);
    }
    return currentUserPolls.filter((poll) => poll.listId === effectiveSelectedListId);
  }, [currentUserPolls, effectiveSelectedListId]);

  const visiblePollCount = visiblePollCountByListId[effectiveSelectedListId] ?? 4;
  const paginatedPolls = filteredPolls.slice(0, visiblePollCount);
  const hasMorePolls = visiblePollCount < filteredPolls.length;

  const selectedListDraft = draftsByListId[selectedList.id] ?? {
    name: selectedList.name,
    description: selectedList.description,
  };

  const selectedPoll = filteredPolls.find((poll) => poll.id === selectedPollId) ?? null;

  const selectedListStats = useMemo(() => ({
    pollCount: filteredPolls.length,
    totalInteractions: filteredPolls.reduce((sum, poll) => sum + poll.interactionCount, 0),
  }), [filteredPolls]);

  const handleCreate = async () => {
    if (!newListName.trim()) return;
    await createList({
      variables: {
        name: newListName,
        description: newListDescription,
        ownerId: currentUserId || "system-user",
      }
    });
    setNewListName("");
    setNewListDescription("");
  };

  const handleSaveListDetails = async () => {
    if (selectedList.id === OTHERS_LIST_ID) return;
    await updateList({
      variables: {
        id: selectedList.id,
        name: selectedListDraft.name,
        description: selectedListDraft.description,
      }
    });
    setDraftsByListId((current) => {
      const next = { ...current };
      delete next[selectedList.id];
      return next;
    });
  };

  const movePoll = async (targetListId: string | null) => {
    if (!selectedPoll) return;
    await assignPoll({
      variables: {
        pollId: selectedPoll.id,
        listId: targetListId
      }
    });
    setSelectedPollId(null);
    setMoveTargetListId("");
  };

  if (loading) {
    return <div style={{ color: "white", padding: "40px", textAlign: "center" }}>Loading your lists...</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isMobile ? "20px 16px 32px" : "32px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : "2.6rem" }}>Poll Lists</h1>
          <p style={{ color: "rgba(255,255,255,0.82)", margin: "8px 0 0 0", maxWidth: "760px" }}>
            Group polls into custom lists, keep unassigned polls in <strong>Others</strong>, and move polls between lists whenever you want.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile || isTablet ? "1fr" : "340px minmax(0, 1fr)",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section style={{ ...cardStyle, padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <h2 style={{ color: "white", margin: 0, fontSize: "1.2rem" }}>Lists</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", margin: "8px 0 0 0", fontSize: "0.95rem" }}>
                One list can hold many polls. Unassigned polls stay in Others.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {visibleLists.map((list) => {
                const pollCount = list.id === OTHERS_LIST_ID
                  ? currentUserPolls.filter((poll) => !poll.listId).length
                  : currentUserPolls.filter((poll) => poll.listId === list.id).length;

                const isSelected = list.id === selectedListId;

                return (
                  <button
                    key={list.id}
                    onClick={() => {
                      setSelectedListId(list.id);
                      setSelectedPollId(null);
                      setMoveTargetListId("");
                      setVisiblePollCountByListId((current) => ({
                        ...current,
                        [list.id]: current[list.id] ?? 4,
                      }));
                    }}
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: "16px",
                      border: isSelected ? "1px solid rgba(71, 199, 170, 0.65)" : "1px solid rgba(255,255,255,0.1)",
                      background: isSelected ? "rgba(71, 199, 170, 0.18)" : "rgba(255,255,255,0.04)",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                      <strong>{list.name}</strong>
                      <span style={{ opacity: 0.75 }}>{pollCount}</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.78, marginTop: "6px" }}>{list.description}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <h3 style={{ color: "white", margin: 0, fontSize: "1rem" }}>Create a List</h3>
              <input
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="List name"
                style={inputStyle}
              />
              <textarea
                value={newListDescription}
                onChange={(event) => setNewListDescription(event.target.value)}
                placeholder="Short description"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
              <button onClick={handleCreate} style={primaryButtonStyle}>
                Create List
              </button>
            </div>
          </section>

          <section style={{ ...cardStyle, padding: isMobile ? "18px" : "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto auto", gap: "16px", alignItems: "start" }}>
              <div>
                <h2 style={{ color: "white", margin: 0 }}>{selectedList.name}</h2>
                <p style={{ color: "rgba(255,255,255,0.76)", margin: "8px 0 0 0" }}>{selectedList.description}</p>
              </div>
              <StatPill label="Polls" value={String(selectedListStats.pollCount)} />
              <StatPill label="Interactions" value={String(selectedListStats.totalInteractions)} />
            </div>

            {selectedList.id !== OTHERS_LIST_ID ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr) auto auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={fieldLabelStyle}>List Name</label>
                  <input
                    value={selectedListDraft.name}
                    onChange={(event) =>
                      setDraftsByListId((current) => ({
                        ...current,
                        [selectedList.id]: {
                          ...selectedListDraft,
                          name: event.target.value,
                        },
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>Description</label>
                  <input
                    value={selectedListDraft.description}
                    onChange={(event) =>
                      setDraftsByListId((current) => ({
                        ...current,
                        [selectedList.id]: {
                          ...selectedListDraft,
                          description: event.target.value,
                        },
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <button onClick={handleSaveListDetails} style={primaryButtonStyle}>Save</button>
                <button
                  onClick={async () => {
                    await deleteList({ variables: { id: selectedList.id } });
                    setSelectedListId(OTHERS_LIST_ID);
                  }}
                  style={dangerButtonStyle}
                >
                  Delete
                </button>
              </div>
            ) : null}

            {selectedPoll ? (
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ color: "white" }}>
                  Selected poll: <strong>{selectedPoll.title}</strong>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto auto", gap: "12px", alignItems: "end" }}>
                  <div>
                    <label style={fieldLabelStyle}>Move to</label>
                    <select
                      value={moveTargetListId}
                      onChange={(event) => setMoveTargetListId(event.target.value)}
                      style={{ ...inputStyle, color: "#173533", background: "white" }}
                    >
                      <option value="">Select a list</option>
                      {lists
                        .filter((list) => list.id !== selectedList.id)
                        .map((list) => (
                          <option key={list.id} value={list.id} style={{ color: "#173533", background: "white" }}>
                            {list.name}
                          </option>
                        ))}
                      {selectedList.id !== OTHERS_LIST_ID ? <option value={OTHERS_LIST_ID} style={{ color: "#173533", background: "white" }}>Others</option> : null}
                    </select>
                  </div>

                  <button
                    onClick={() => movePoll(moveTargetListId === OTHERS_LIST_ID ? null : moveTargetListId || null)}
                    disabled={!moveTargetListId}
                    style={{ ...primaryButtonStyle, opacity: moveTargetListId ? 1 : 0.5, cursor: moveTargetListId ? "pointer" : "not-allowed" }}
                  >
                    Move Poll
                  </button>

                  {selectedList.id !== OTHERS_LIST_ID ? (
                    <button onClick={() => movePoll(null)} style={secondaryButtonStyle}>
                      Send to Others
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
              {paginatedPolls.map((poll) => {
                const isSelected = selectedPollId === poll.id;

                return (
                  <button
                    key={poll.id}
                    onClick={() => setSelectedPollId((current) => (current === poll.id ? null : poll.id))}
                    style={{
                      textAlign: "left",
                      borderRadius: "18px",
                      border: isSelected ? "1px solid rgba(71, 199, 170, 0.65)" : "1px solid rgba(255,255,255,0.1)",
                      background: isSelected ? "rgba(71, 199, 170, 0.16)" : "rgba(255,255,255,0.04)",
                      padding: "16px",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "start" }}>
                      <div>
                        <strong style={{ display: "block", marginBottom: "6px" }}>{poll.title}</strong>
                        <span style={{ fontSize: "0.86rem", opacity: 0.76 }}>{poll.category}</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", opacity: 0.72 }}>{poll.interactionCount} votes</span>
                    </div>
                    <p style={{ margin: "12px 0 0 0", opacity: 0.82, lineHeight: 1.45 }}>{poll.description}</p>
                  </button>
                );
              })}
            </div>

            {hasMorePolls ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  onClick={() =>
                    setVisiblePollCountByListId((current) => ({
                      ...current,
                      [effectiveSelectedListId]: (current[effectiveSelectedListId] ?? 4) + 4,
                    }))
                  }
                  style={secondaryButtonStyle}
                >
                  Load 4 More Polls
                </button>
              </div>
            ) : null}

            {filteredPolls.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.72)", textAlign: "center", padding: "28px 12px" }}>
                No polls are in this list yet.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        minWidth: "120px",
        padding: "12px 14px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "white",
      }}
    >
      <div style={{ fontSize: "0.78rem", opacity: 0.75 }}>{label}</div>
      <div style={{ marginTop: "4px", fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "rgba(255,255,255,0.8)",
  fontSize: "0.85rem",
};

const primaryButtonStyle: React.CSSProperties = {
  height: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  border: "none",
  background: "#47C7AA",
  color: "#173533",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  height: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  height: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  border: "1px solid rgba(255, 105, 105, 0.45)",
  background: "rgba(255, 105, 105, 0.12)",
  color: "#ffd0d0",
  fontWeight: 700,
  cursor: "pointer",
};
