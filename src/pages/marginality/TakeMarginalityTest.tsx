import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  MarginalityProfile,
  MarginalityProfileFieldDefinition,
  MarginalityTest,
} from "../../domain/MarginalityTest";
import { trackUserActivity } from "../../services/browserMonitoringService";
import { useResponsive } from "../../hooks/useResponsive";
import { getAgeGroupFromAge } from "../../services/marginalityTestService";
import { hasValidationErrors, validateDynamicProfileValues } from "../../services/validationService";
import { theme } from "../../theme/theme";
import type { MarginalityDraftState } from "./flowTypes";

type TakeMarginalityTestProps = {
  tests: MarginalityTest[];
};

export function TakeMarginalityTest({ tests }: TakeMarginalityTestProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { testId } = useParams<{ testId: string }>();
  const test = useMemo(() => tests.find((currentTest) => currentTest.id === testId), [testId, tests]);
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!test) {
    return <CenteredMessage message="Marginality test not found." />;
  }

  const handleStart = () => {
    const nextErrors = validateDynamicProfileValues(test.profileFields, profileValues);
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    const age = Number(profileValues.age ?? 0);

    const profile: MarginalityProfile = {
      age,
      ageGroup: getAgeGroupFromAge(age),
      country: profileValues.country?.trim() || "",
      footballWatchingLevel: (profileValues.footballWatchingLevel || "Casual") as MarginalityProfile["footballWatchingLevel"],
      favoriteClub: profileValues.favoriteClub?.trim() || undefined,
    };

    const draftState: MarginalityDraftState = {
      profile,
      answers: {},
    };

    trackUserActivity("marginality", `start-test:${test.id}`);
    navigate(`/marginality-test/${test.id}/questions/0`, { state: draftState });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isMobile ? "20px 16px 96px" : "40px 24px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          background: "#F0DDB3",
          borderRadius: "24px",
          padding: isMobile ? "22px 18px" : "32px",
          border: "1px solid black",
        }}
      >
        <h1 style={{ color: "black", marginTop: 0, fontSize: isMobile ? "1.8rem" : "2.2rem", lineHeight: 1.15 }}>{test.title}</h1>
        <p style={{ color: "black", lineHeight: 1.5, fontSize: isMobile ? "0.95rem" : "1rem" }}>{test.description}</p>
        <p style={{ color: "black", marginBottom: "28px", fontSize: isMobile ? "0.95rem" : "1rem", lineHeight: 1.45 }}>
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
                error={errors[field.key]}
              />
            </Field>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", flexDirection: isMobile ? "column-reverse" : "row", gap: "12px", marginTop: "32px" }}>
          <button onClick={() => navigate("/marginality-test")} style={{ ...secondaryButtonStyle, width: isMobile ? "100%" : "auto" }}>
            Back to Tests
          </button>
          <button onClick={handleStart} style={{ ...primaryButtonStyle, width: isMobile ? "100%" : "auto" }}>
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
  error,
}: {
  field: MarginalityProfileFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  if (field.inputType === "select") {
    return (
      <>
        <select value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle, border: error ? "1px solid #ef4444" : inputStyle.border }}>
          <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error ? <FieldError message={error} /> : null}
      </>
    );
  }

  if (field.inputType === "number") {
    return (
      <>
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          style={{ ...inputStyle, border: error ? "1px solid #ef4444" : inputStyle.border }}
        />
        {error ? <FieldError message={error} /> : null}
      </>
    );
  }

  return (
    <>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        style={{ ...inputStyle, border: error ? "1px solid #ef4444" : inputStyle.border }}
      />
      {error ? <FieldError message={error} /> : null}
    </>
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

function FieldError({ message }: { message: string }) {
  return <p style={{ color: "#b91c1c", fontSize: "0.78rem", margin: "6px 0 0 0" }}>{message}</p>;
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
