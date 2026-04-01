import type { MarginalityProfile } from "../../domain/MarginalityTest";

export type MarginalityDraftState = {
  profile: MarginalityProfile;
  answers: Record<string, number>;
};
