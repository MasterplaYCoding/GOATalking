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
export type MarginalityCategoryValue = string | number;
export type MarginalityCategoryValues = Record<string, MarginalityCategoryValue>;
export type DerivedCategoryStrategy = "ageGroupFromAge";

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

export interface MarginalityQuestion {
  id: string;
  text: string;
}

export interface MarginalityCategoryDefinition {
  key: string;
  label: string;
  inputType: ProfileFieldInputType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  isDerived?: boolean;
  derivedFromKey?: string;
  derivedStrategy?: DerivedCategoryStrategy;
  includeInQuestionStats?: boolean;
  includeInReport?: boolean;
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
  categoryDefinitions: MarginalityCategoryDefinition[];
  questions: MarginalityQuestion[];
  createdAt: Date;
}

export interface MarginalityTestResponse {
  id: string;
  testId: string;
  userId: string;
  categoryValues: MarginalityCategoryValues;
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
