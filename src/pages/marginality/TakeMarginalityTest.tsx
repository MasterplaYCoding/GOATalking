import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  MarginalityProfile,
  MarginalityProfileFieldDefinition,
  MarginalityTest,
} from "../../domain/MarginalityTest";
import { theme } from "../../theme/theme";
import type { MarginalityDraftState } from "./flowTypes";

type TakeMarginalityTestProps = {
  tests: MarginalityTest[];
};

export function TakeMarginalityTest({ tests }: TakeMarginalityTestProps) {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const test = useMemo(() => tests.find((currentTest) => currentTest.id === testId), [testId, tests]);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});

  if (!test) {
    return <CenteredMessage message="Marginality test not found." />;
  }

  const handleStart = () => {
    const missingRequiredField = test.profileFields.some(
      (field) => field.required && !profileValues[field.key]?.trim()
    );

    if (missingRequiredField) {
      return;
    }

    const profile: MarginalityProfile = {
      ageGroup: (profileValues.ageGroup || "GenZ") as MarginalityProfile["ageGroup"],
      country: profileValues.country?.trim() || "",
      footballWatchingLevel: (profileValues.footballWatchingLevel || "Casual") as MarginalityProfile["footballWatchingLevel"],
      favoriteClub: profileValues.favoriteClub?.trim() || undefined,
    };

    const draftState: MarginalityDraftState = {
      profile,
      answers: {},
    };

    navigate(`/marginality-test/${test.id}/questions/0`, { state: draftState });
  };

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", boxSizing: "border-box", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "700px", background: "#F0DDB3", borderRadius: "24px", padding: "32px", border: "1px solid black" }}>
        <h1 style={{ color: "black", marginTop: 0 }}>{test.title}</h1>
        <p style={{ color: "black", lineHeight: 1.5 }}>{test.description}</p>
        <p style={{ color: "black", marginBottom: "28px" }}>
          Before the questions, tell us a bit about the categories this test compares against.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {test.profileFields.map((field) => (
            <Field key={field.key} label={field.label}>
              <DynamicProfileInput
                field={field}
                value={profileValues[field.key] ?? ""}
                onChange={(value) =>
                  setProfileValues((currentValues) => ({
                    ...currentValues,
                    [field.key]: value,
                  }))
                }
              />
            </Field>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
          <button onClick={() => navigate("/marginality-test")} style={secondaryButtonStyle}>
            Back to Tests
          </button>
          <button onClick={handleStart} style={primaryButtonStyle}>
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
}

function DynamicProfileInput({
  field,
  value,
  onChange,
}: {
  field: MarginalityProfileFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.inputType === "select") {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      style={inputStyle}
    />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ color: "black", fontSize: "0.95rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>{label}</label>
      {children}
    </div>
  );
}

function CenteredMessage({ message }: { message: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ color: "white", margin: 0 }}>{message}</h1>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(0,0,0,0.2)",
  backgroundColor: "rgba(255, 255, 255, 0.55)",
  color: "black",
  fontSize: "1rem",
  boxSizing: "border-box",
  outline: "none",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#1F3D3A",
  border: "none",
  padding: "12px 0",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  background: theme.colors?.secondary || "#47C7AA",
  color: theme.colors?.primary || "#1F3D3A",
  border: "none",
  padding: "12px 24px",
  borderRadius: "12px",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
};
