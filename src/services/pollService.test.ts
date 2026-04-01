import { describe, expect, it } from "vitest";
import { addOption, createPoll, deletePoll, getCurrentStandings, updatePoll, vote } from "./pollService";

describe("pollService", () => {
  it("creates, updates, and deletes a poll", () => {
    const poll = createPoll("Best player", "Sports", "Legacy debate", "/messi.png");
    const updatedPoll = updatePoll(poll, { title: "Best football player ever" });
    const remainingPolls = deletePoll([updatedPoll], updatedPoll.id);

    expect(poll.id).toBeTruthy();
    expect(updatedPoll.title).toBe("Best football player ever");
    expect(remainingPolls).toHaveLength(0);
  });

  it("adds options and registers votes once per user", () => {
    let poll = createPoll("Best player", "Sports", "Legacy debate", "/messi.png");
    poll = addOption(poll, "Messi");
    poll = addOption(poll, "Ronaldo");

    const firstVote = vote(poll, poll.options[0].id, "user-1", {});
    const changedVote = vote(firstVote.poll, poll.options[1].id, "user-1", firstVote.userVotes);

    expect(firstVote.poll.interactionCount).toBe(1);
    expect(firstVote.poll.options[0].votes).toBe(1);
    expect(changedVote.poll.interactionCount).toBe(1);
    expect(changedVote.poll.options[0].votes).toBe(0);
    expect(changedVote.poll.options[1].votes).toBe(1);
  });

  it("returns zero percentages when there are no votes yet", () => {
    let poll = createPoll("Best player", "Sports", "Legacy debate", "/messi.png");
    poll = addOption(poll, "Messi");
    poll = addOption(poll, "Ronaldo");

    const standings = getCurrentStandings(poll);

    expect(standings[0][1]).toBe(0);
    expect(standings[1][1]).toBe(0);
  });

  it("prevents duplicate votes and owner votes", () => {
    let poll = createPoll("Best player", "Sports", "Legacy debate", "/messi.png");
    poll = addOption(poll, "Messi");
    poll = addOption(poll, "Ronaldo");
    poll = { ...poll, ownerId: "owner-1" };

    const firstVote = vote(poll, poll.options[0].id, "user-1", {});
    const duplicateVote = vote(firstVote.poll, poll.options[0].id, "user-1", firstVote.userVotes);
    const ownerVote = vote(firstVote.poll, poll.options[1].id, "owner-1", firstVote.userVotes);

    expect(duplicateVote.poll).toEqual(firstVote.poll);
    expect(duplicateVote.userVotes).toEqual(firstVote.userVotes);
    expect(ownerVote.poll).toEqual(firstVote.poll);
    expect(ownerVote.userVotes).toEqual(firstVote.userVotes);
  });
});
