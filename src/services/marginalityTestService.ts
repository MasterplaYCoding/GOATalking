import { nanoid } from "nanoid";
import type {
  AgeGroupKey,
  GroupAverageResult,
  MarginalityDistanceReport,
  MarginalityProfileFieldDefinition,
  MarginalityProfile,
  MarginalityQuestion,
  MarginalityTest,
  MarginalityTestResponse,
  QuestionAgreementVote,
} from "../domain/MarginalityTest";
import { AGE_GROUP_DETAILS } from "../domain/MarginalityTest";

type GroupableKey = keyof MarginalityProfile;

export function createMarginalityTest(
  title: string,
  topic: string,
  description: string,
  questionTexts: string[],
  profileFields: MarginalityProfileFieldDefinition[]
): MarginalityTest {
  const questions: MarginalityQuestion[] = questionTexts.map((text) => ({
    id: nanoid(),
    text,
  }));

  return {
    id: nanoid(),
    title,
    topic,
    description,
    profileFields,
    questions,
    createdAt: new Date(),
  };
}

export function createMarginalityResponse(
  testId: string,
  userId: string,
  profile: MarginalityProfile,
  votes: QuestionAgreementVote[]
): MarginalityTestResponse {
  return {
    id: nanoid(),
    testId,
    userId,
    profile,
    votes: votes.map((vote) => ({
      ...vote,
      agreement: clampAgreement(vote.agreement),
    })),
    submittedAt: new Date(),
  };
}

export function getResponsesForTest(
  responses: MarginalityTestResponse[],
  testId: string
): MarginalityTestResponse[] {
  return responses.filter((response) => response.testId === testId);
}

export function getAgeGroupFromAge(age: number): AgeGroupKey {
  const normalizedAge = Math.max(0, Math.round(age));
  const matchedGroup = Object.values(AGE_GROUP_DETAILS).find(
    (group) => normalizedAge >= group.minAge && normalizedAge <= group.maxAge
  );

  return matchedGroup?.key ?? "Boomers";
}

export function getQuestionAverageByGroup(
  responses: MarginalityTestResponse[],
  questionId: string,
  groupKey: GroupableKey
): GroupAverageResult[] {
  const grouped = new Map<string, number[]>();

  responses.forEach((response) => {
    const vote = response.votes.find((currentVote) => currentVote.questionId === questionId);

    if (!vote) {
      return;
    }

    const label = String(response.profile[groupKey]);
    const bucket = grouped.get(label) ?? [];
    bucket.push(vote.agreement);
    grouped.set(label, bucket);
  });

  return Array.from(grouped.entries()).map(([label, values]) => ({
    label,
    averageAgreement: average(values),
    responsesCount: values.length,
  }));
}

export function getQuestionOverallAverage(
  responses: MarginalityTestResponse[],
  questionId: string
): number {
  const values = responses
    .map((response) => response.votes.find((currentVote) => currentVote.questionId === questionId)?.agreement)
    .filter((agreement): agreement is number => typeof agreement === "number");

  return average(values);
}

export function getOverallAverageByGroup(
  responses: MarginalityTestResponse[],
  groupKey: GroupableKey
): GroupAverageResult[] {
  const grouped = new Map<string, number[]>();

  responses.forEach((response) => {
    const label = String(response.profile[groupKey]);
    const bucket = grouped.get(label) ?? [];
    bucket.push(...response.votes.map((vote) => vote.agreement));
    grouped.set(label, bucket);
  });

  return Array.from(grouped.entries()).map(([label, values]) => ({
    label,
    averageAgreement: average(values),
    responsesCount: values.length,
  }));
}

export function getDistanceFromOtherGroups(
  currentResponse: MarginalityTestResponse,
  responses: MarginalityTestResponse[],
  groupKey: GroupableKey
): MarginalityDistanceReport {
  const peers = responses.filter((response) => response.id !== currentResponse.id);
  const averagesByGroup = getOverallAverageByGroup(peers, groupKey);
  const currentAverage = average(currentResponse.votes.map((vote) => vote.agreement));

  const distancesByGroup = averagesByGroup.map((groupAverage) => ({
    label: groupAverage.label,
    averageDistance: Math.abs(currentAverage - groupAverage.averageAgreement),
  }));

  return {
    overallAverageDistance: average(distancesByGroup.map((item) => item.averageDistance)),
    distancesByGroup,
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampAgreement(value: number): number {
  return Math.max(0, Math.min(100, value));
}
