import { theme } from "../theme/theme";
import { useResponsive } from "../hooks/useResponsive";

type TextInputProps = {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    type?: "text" | "password";
    error?: string;
};

export function TextInput({ value, onChange, label, type = "text", error }: TextInputProps) {
    const { isMobile } = useResponsive();

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", margin: "0 auto", boxSizing: "border-box" }}>
            {label && (
                <div style={{ width: "100%", display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile && type === "password" ? "column" : "row", gap: isMobile && type === "password" ? "4px" : 0, boxSizing: "border-box" }}>
                <p style={{ color: "white", fontSize: 14, margin: 0, paddingLeft: 0}}>
                    {label}
                </p>
                {type === "password" && (
                    <p style={{ color: '#47C7AA', fontSize: 12, cursor: "pointer", margin: isMobile ? 0 : "0 0 0 auto", paddingRight: 0, textAlign: isMobile ? "left" : "right", alignSelf: isMobile ? "flex-start" : "auto" }}>
                        Forgot password?
                    </p>
                )}
                </div>
            )}

            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    display: "block",
                    padding: theme.spacing.md,
                    borderRadius: 20,
                    border: error ? "2px solid #ef4444" : `2px solid white`,
                    background: "transparent",
                    color: "white",
                    outline: "none",
                    fontSize: 14,
                    margin: 0
                }}
            />
            {error ? (
                <p style={{ color: "#fecaca", fontSize: 12, margin: 0 }}>
                    {error}
                </p>
            ) : null}
        </div>
    );
}
