import type { MarginalityCategoryValues } from "../../domain/MarginalityTest";

export type MarginalityDraftState = {
  categoryValues: MarginalityCategoryValues;
  answers: Record<string, number>;
  startedAt?: Date | string;
};
