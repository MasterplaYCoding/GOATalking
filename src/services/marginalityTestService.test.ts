import { describe, expect, it } from "vitest";
import {
  createMarginalityResponse,
  createMarginalityTest,
  getAgeGroupFromAge,
  getDistanceFromOtherGroups,
  getQuestionAverageByGroup,
  getQuestionOverallAverage,
  getResponsesForTest,
} from "./marginalityTestService";

describe("marginalityTestService", () => {
  it("creates tests and computes grouped averages", () => {
    const test = createMarginalityTest(
      "Football",
      "Sports",
      "Legacy opinions",
      ["Question 1", "Question 2"],
      [
        { key: "age", label: "Age", inputType: "number", required: true, min: 13, max: 100 },
        { key: "country", label: "Country", inputType: "text", required: true },
      ]
    );

    const [firstQuestion, secondQuestion] = test.questions;
    const firstResponse = createMarginalityResponse(
      test.id,
      "user-1",
      {
        age: 24,
        ageGroup: getAgeGroupFromAge(24),
        country: "Romania",
        footballWatchingLevel: "Weekly",
      },
      [
        { questionId: firstQuestion.id, agreement: 70 },
        { questionId: secondQuestion.id, agreement: 40 },
      ]
    );
    const secondResponse = createMarginalityResponse(
      test.id,
      "user-2",
      {
        age: 36,
        ageGroup: getAgeGroupFromAge(36),
        country: "Spain",
        footballWatchingLevel: "Obsessed",
      },
      [
        { questionId: firstQuestion.id, agreement: 50 },
        { questionId: secondQuestion.id, agreement: 80 },
      ]
    );

    const responses = [firstResponse, secondResponse];
    const averages = getQuestionAverageByGroup(responses, firstQuestion.id, "ageGroup");
    const distanceReport = getDistanceFromOtherGroups(firstResponse, responses, "country");

    expect(getResponsesForTest(responses, test.id)).toHaveLength(2);
    expect(getQuestionOverallAverage(responses, firstQuestion.id)).toBe(60);
    expect(averages.map((item) => item.label)).toContain("GenZ");
    expect(distanceReport.distancesByGroup).toHaveLength(1);
    expect(distanceReport.overallAverageDistance).toBeGreaterThanOrEqual(0);
  });

  it("handles empty and boundary marginality cases", () => {
    expect(getAgeGroupFromAge(200)).toBe("Boomers");
    expect(getAgeGroupFromAge(28.4)).toBe("GenZ");
    expect(getQuestionAverageByGroup([], "missing-question", "country")).toEqual([]);
    expect(getQuestionOverallAverage([], "missing-question")).toBe(0);

    const soloTest = createMarginalityTest(
      "Solo test",
      "General",
      "One response only",
      ["Question 1"],
      []
    );
    const soloResponse = createMarginalityResponse(
      soloTest.id,
      "solo-user",
      {
        age: 66,
        ageGroup: "Boomers",
        country: "Germany",
        footballWatchingLevel: "Casual",
      },
      [{ questionId: soloTest.questions[0].id, agreement: 150 }]
    );

    const soloDistance = getDistanceFromOtherGroups(soloResponse, [soloResponse], "country");

    expect(soloResponse.votes[0].agreement).toBe(100);
    expect(soloDistance.overallAverageDistance).toBe(0);
    expect(soloDistance.distancesByGroup).toEqual([]);
  });
});
