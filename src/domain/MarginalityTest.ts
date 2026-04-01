export interface AgeGroup {
  GenZ: "GenZ";
  Millenials: "Millenials";
  GenX: "GenX";
  Boomers: "Boomers";
}

export const AGE_GROUPS: AgeGroup = {
  GenZ: "GenZ",
  Millenials: "Millenials",
  GenX: "GenX",
  Boomers: "Boomers",
};

export type AgeGroupKey = keyof AgeGroup;

export type FootballWatchingLevel = "Rarely" | "Casual" | "Weekly" | "Obsessed";

export interface MarginalityQuestion {
  id: string;
  text: string;
}

export interface MarginalityProfile {
  ageGroup: AgeGroupKey;
  country: string;
  footballWatchingLevel: FootballWatchingLevel;
  favoriteClub?: string;
}

export type MarginalityProfileFieldKey = keyof MarginalityProfile;

export interface MarginalityProfileFieldDefinition {
  key: MarginalityProfileFieldKey;
  label: string;
  inputType: "text" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface QuestionAgreementVote {
  questionId: string;
  agreement: number;
}

export interface MarginalityTest {
  id: string;
  title: string;
  topic: string;
  description: string;
  profileFields: MarginalityProfileFieldDefinition[];
  questions: MarginalityQuestion[];
  createdAt: Date;
}

export interface MarginalityTestResponse {
  id: string;
  testId: string;
  userId: string;
  profile: MarginalityProfile;
  votes: QuestionAgreementVote[];
  submittedAt: Date;
}

export interface GroupAverageResult {
  label: string;
  averageAgreement: number;
  responsesCount: number;
}

export interface MarginalityDistanceReportItem {
  label: string;
  averageDistance: number;
}

export interface MarginalityDistanceReport {
  overallAverageDistance: number;
  distancesByGroup: MarginalityDistanceReportItem[];
}
