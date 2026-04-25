import { useState, type ReactNode } from "react";
import { trackUserActivity } from "../services/browserMonitoringService";
import { useResponsive } from "../hooks/useResponsive";
import { hasValidationErrors, validatePollInput } from "../services/validationService";
import { theme } from "../theme/theme";
// 1. Fixed the Apollo imports to come from the main package
import { gql } from '@apollo/client'; 
import { useMutation } from '@apollo/client/react'; 


// 2. Updated the mutation to match your state (added imageUrl)
const CREATE_POLL = gql`
  mutation CreateNewPoll(
    $title: String!
    $category: String!
    $description: String
    $imageUrl: String
    $options: [OptionInput!]! 
  ) {
    createPoll(
      title: $title
      category: $category
      description: $description
      imageUrl: $imageUrl
      options: $options
    ) {
      id
      title
    }
  }
`;

export type NewPollData = {
    title: string;
    description: string;
    imageUrl: string;
    options: string[];
};

interface CreatePollResponse {
    createPoll: {
        id: string;
        title: string;
    };
}

type PollCardCreateProps = {
    onCreatePoll?: (pollData: NewPollData) => void;
};

export function PollCardCreate({ onCreatePoll }: PollCardCreateProps) {
    const { isMobile } = useResponsive();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [errors, setErrors] = useState<Partial<Record<"title" | "description" | "imageUrl" | "options", string>>>({});
    
    const [options, setOptions] = useState<string[]>(["", ""]);

    const [createPoll, { loading, error: apolloError }] = useMutation<CreatePollResponse>(CREATE_POLL);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (indexToRemove: number) => {
        setOptions(options.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = async () => {
        const filledOptions = options.filter(opt => opt.trim() !== "");
        const nextErrors = validatePollInput({
            title,
            description,
            imageUrl,
            options,
        });
        setErrors(nextErrors);

        if (hasValidationErrors(nextErrors)) {
            return;
        }

        trackUserActivity("poll", "create-poll-submit");

        const nextPollData: NewPollData = {
            title: title.trim(),
            description: description.trim(),
            imageUrl: imageUrl.trim(),
            options: filledOptions.map((option) => option.trim()),
        };

        if (onCreatePoll) {
            onCreatePoll(nextPollData);
            return;
        }
        
        try {
            await createPoll({
                variables: {
                    title: nextPollData.title,
                    category: "General", // Hardcoded since it's required by the schema but missing in the UI
                    description: nextPollData.description,
                    imageUrl: nextPollData.imageUrl,
                    options: nextPollData.options.map(opt => ({ text: opt })) 
                }
            });
        } catch (err) {
            console.error("Mutation failed:", err);
        }
    };

    return (
        <div
            style={{
                width: "100%",           
                maxWidth: "600px",       
                backgroundColor: "#C4DBD5",
                borderRadius: "20px",
                padding: isMobile ? "20px" : "32px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}>
            <h2 style={{ margin: 0, color: "#1F3D3A" }}>Create New Poll</h2>

            <FieldRow label="Title">
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="E.g., What is your go-to morning drink?"
                    style={{ ...inputStyle, border: errors.title ? "2px solid #ef4444" : inputStyle.border }}
                />
                {errors.title ? <FieldError message={errors.title} /> : null}
            </FieldRow>

            <FieldRow label="Description">
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add some context to your poll..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", border: errors.description ? "2px solid #ef4444" : inputStyle.border }}
                />
                {errors.description ? <FieldError message={errors.description} /> : null}
            </FieldRow>

            <FieldRow label="Photo URL">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 180px",
                        gap: "16px",
                        alignItems: "stretch",
                    }}
                >
                    <input
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                        placeholder="https://..."
                        style={{ ...inputStyle, border: errors.imageUrl ? "2px solid #ef4444" : inputStyle.border }}
                    />
                    <div
                        style={{
                            aspectRatio: "16 / 9",
                            borderRadius: "12px",
                            border: "2px solid #6F9D96",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.18)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        ) : (
                            <p style={{ margin: 0, color: "#315B58", textAlign: "center", padding: "8px", fontSize: "0.85rem" }}>Preview</p>
                        )}
                    </div>
                </div>
                {errors.imageUrl ? <FieldError message={errors.imageUrl} /> : null}
            </FieldRow>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
                <h3 style={{ margin: 0, color: "#1F3D3A" }}>Poll Options</h3>
                
                {options.map((opt, index) => (
                    <div key={index} style={{ display: "flex", gap: "12px", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row" }}>
                        <input
                            value={opt}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        {/* Only allow removing if there are more than 2 options */}
                        {options.length > 2 && (
                            <button
                                onClick={() => handleRemoveOption(index)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#ef4444", 
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "8px"
                                }}
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        )}
                    </div>
                ))}
                {errors.options ? <FieldError message={errors.options} /> : null}

                <button 
                    onClick={handleAddOption} 
                    style={{
                        background: "transparent",
                        border: "2px dashed #6F9D96",
                        color: "#1F3D3A",
                        padding: "12px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(111, 157, 150, 0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                    <span className="material-symbols-outlined">add</span>
                    Add Another Option
                </button>
            </div>

            {/* 5. Added Apollo Error Display */}
            {!onCreatePoll && apolloError && (
                <div style={{ backgroundColor: "#fee2e2", border: "1px solid #ef4444", padding: "12px", borderRadius: "8px", color: "#b91c1c" }}>
                    <strong>Server Error:</strong> {apolloError.message}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end", marginTop: "16px" }}>
                {/* 6. Bound the loading state to the button */}
                <button 
                    onClick={handleSave} 
                    disabled={!onCreatePoll && loading}
                    style={{ 
                        ...primaryButtonStyle, 
                        width: isMobile ? "100%" : undefined,
                        opacity: !onCreatePoll && loading ? 0.7 : 1,
                        cursor: !onCreatePoll && loading ? "not-allowed" : "pointer"
                    }}
                >
                    {!onCreatePoll && loading ? "Creating..." : "Create Poll"}
                </button>
            </div>
        </div>
    );
}

function FieldError({ message }: { message: string }) {
    return <p style={{ color: "#b91c1c", fontSize: 12, margin: "6px 0 0 0" }}>{message}</p>;
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
    const { isMobile } = useResponsive();
    return (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "100px 1fr", alignItems: "start", gap: "14px" }}>
            <label style={{ color: "#1F3D3A", fontWeight: 700, paddingTop: isMobile ? 0 : "12px" }}>{label}</label>
            <div>{children}</div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: theme.spacing.md,
    borderRadius: 16,
    border: "2px solid #6F9D96",
    background: "transparent",
    color: "#1F3D3A",
    outline: "none",
    fontSize: 14,
};

const primaryButtonStyle = {
    height: 48,
    padding: "0 32px",
    borderRadius: 14,
    border: "none",
    background: "#47C7AA",
    color: "white",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: theme.shadow.sm,
};
