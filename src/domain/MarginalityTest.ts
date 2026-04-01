import boomerImage from "../assets/boomer.png";
import genXImage from "../assets/genX.png";
import genZImage from "../assets/genZ.png";
import millenialsImage from "../assets/millenials.png";

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
export type ProfileFieldInputType = "text" | "select" | "number";

export interface AgeGroupDefinition {
  key: AgeGroupKey;
  label: string;
  minAge: number;
  maxAge: number;
  imageSrc: string;
}

export const AGE_GROUP_DETAILS: Record<AgeGroupKey, AgeGroupDefinition> = {
  GenZ: {
    key: "GenZ",
    label: "Gen Z",
    minAge: 13,
    maxAge: 28,
    imageSrc: genZImage,
  },
  Millenials: {
    key: "Millenials",
    label: "Millennials",
    minAge: 29,
    maxAge: 44,
    imageSrc: millenialsImage,
  },
  GenX: {
    key: "GenX",
    label: "Gen X",
    minAge: 45,
    maxAge: 60,
    imageSrc: genXImage,
  },
  Boomers: {
    key: "Boomers",
    label: "Boomers",
    minAge: 61,
    maxAge: 120,
    imageSrc: boomerImage,
  },
};

export type FootballWatchingLevel = "Rarely" | "Casual" | "Weekly" | "Obsessed";

export interface MarginalityQuestion {
  id: string;
  text: string;
}

export interface MarginalityProfile {
  age: number;
  ageGroup: AgeGroupKey;
  country: string;
  footballWatchingLevel: FootballWatchingLevel;
  favoriteClub?: string;
}

export type MarginalityProfileFieldKey = keyof MarginalityProfile;

export interface MarginalityProfileFieldDefinition {
  key: MarginalityProfileFieldKey;
  label: string;
  inputType: ProfileFieldInputType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
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
