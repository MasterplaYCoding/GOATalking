import { nanoid } from "nanoid";
import type {
  AgeGroupKey,
  GroupAverageResult,
  MarginalityCategoryDefinition,
  MarginalityCategoryValue,
  MarginalityCategoryValues,
  MarginalityDistanceReport,
  MarginalityQuestion,
  MarginalityTest,
  MarginalityTestResponse,
  QuestionAgreementVote,
} from "../domain/MarginalityTest";
import { AGE_GROUP_DETAILS } from "../domain/MarginalityTest";

type GroupableKey = string;

export function createMarginalityTest(
  title: string,
  topic: string,
  description: string,
  questionTexts: string[],
  categoryDefinitions: MarginalityCategoryDefinition[]
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
    categoryDefinitions,
    questions,
    createdAt: new Date(),
  };
}

export function createMarginalityResponse(
  test: MarginalityTest,
  userId: string,
  categoryValues: MarginalityCategoryValues,
  votes: QuestionAgreementVote[]
): MarginalityTestResponse {
  return {
    id: nanoid(),
    testId: test.id,
    userId,
    categoryValues: applyDerivedCategoryValues(test.categoryDefinitions, categoryValues),
    votes: votes.map((vote) => ({
      ...vote,
      agreement: clampAgreement(vote.agreement),
    })),
    submittedAt: new Date(),
  };
}

export function normalizeMarginalityResponse(
  test: MarginalityTest,
  response: Omit<MarginalityTestResponse, "submittedAt" | "categoryValues" | "votes"> & {
    submittedAt: string | Date;
    categoryValues?: Record<string, unknown>;
    votes?: Array<{ questionId: string; agreement: number | string }>;
    profile?: Record<string, unknown>;
  }
): MarginalityTestResponse {
  const rawCategoryValues = response.categoryValues ?? response.profile ?? {};
  const normalizedCategoryValues = normalizeCategoryValues(test.categoryDefinitions, rawCategoryValues);

  return {
    id: response.id,
    testId: response.testId,
    userId: response.userId,
    categoryValues: applyDerivedCategoryValues(test.categoryDefinitions, normalizedCategoryValues),
    votes: (response.votes ?? []).map((vote) => ({
      questionId: vote.questionId,
      agreement: clampAgreement(Number(vote.agreement)),
    })),
    submittedAt: new Date(response.submittedAt),
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
    const label = normalizeCategoryLabel(response.categoryValues[groupKey]);

    if (!vote || !label) {
      return;
    }

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
    const label = normalizeCategoryLabel(response.categoryValues[groupKey]);

    if (!label) {
      return;
    }

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

export function getVisibleInputCategoryDefinitions(
  test: MarginalityTest
): MarginalityCategoryDefinition[] {
  return test.categoryDefinitions.filter((definition) => !definition.isDerived);
}

export function getQuestionStatsCategoryDefinitions(
  test: MarginalityTest
): MarginalityCategoryDefinition[] {
  return test.categoryDefinitions.filter((definition) => definition.includeInQuestionStats);
}

export function getReportCategoryDefinitions(
  test: MarginalityTest
): MarginalityCategoryDefinition[] {
  return test.categoryDefinitions.filter((definition) => definition.includeInReport);
}

export function getCategoryDefinitionByKey(
  test: MarginalityTest,
  key: string
): MarginalityCategoryDefinition | undefined {
  return test.categoryDefinitions.find((definition) => definition.key === key);
}

function applyDerivedCategoryValues(
  categoryDefinitions: MarginalityCategoryDefinition[],
  rawCategoryValues: MarginalityCategoryValues
): MarginalityCategoryValues {
  const normalizedValues: MarginalityCategoryValues = { ...rawCategoryValues };

  categoryDefinitions.forEach((definition) => {
    if (!definition.isDerived || !definition.derivedFromKey) {
      return;
    }

    const sourceValue = normalizedValues[definition.derivedFromKey];

    if (definition.derivedStrategy === "ageGroupFromAge" && typeof sourceValue === "number") {
      normalizedValues[definition.key] = getAgeGroupFromAge(sourceValue);
    }
  });

  return normalizedValues;
}

function normalizeCategoryValues(
  categoryDefinitions: MarginalityCategoryDefinition[],
  rawCategoryValues: Record<string, unknown>
): MarginalityCategoryValues {
  const normalizedValues: MarginalityCategoryValues = {};

  Object.entries(rawCategoryValues).forEach(([key, value]) => {
    const definition = categoryDefinitions.find((item) => item.key === key);

    if (definition?.inputType === "number") {
      const numericValue = Number(value);

      if (!Number.isNaN(numericValue)) {
        normalizedValues[key] = numericValue;
      }

      return;
    }

    if (typeof value === "string" || typeof value === "number") {
      normalizedValues[key] = value;
    }
  });

  return normalizedValues;
}

function normalizeCategoryLabel(value: MarginalityCategoryValue | undefined): string | undefined {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();
    return normalizedValue || undefined;
  }

  return undefined;
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
