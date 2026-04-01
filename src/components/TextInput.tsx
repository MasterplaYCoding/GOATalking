import { theme } from "../theme/theme";

type TextInputProps = {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    type?: "text" | "password";
};

export function TextInput({ value, onChange, label, type = "text"}: TextInputProps) {
    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", margin: "0 auto", boxSizing: "border-box" }}>
            {label && (
                <div style={{ width: "100%", display: "flex", alignItems: "center", boxSizing: "border-box" }}>
                <p style={{ color: "white", fontSize: 14, margin: 0, paddingLeft: 0}}>
                    {label}
                </p>
                {type === "password" && (
                    <p style={{ color: '#47C7AA', fontSize: 12, cursor: "pointer", margin: "0 0 0 auto", paddingRight: 0, textAlign: "right" }}>
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
                    border: `2px solid white`,
                    background: "transparent",
                    color: "white",
                    outline: "none",
                    fontSize: 14,
                    margin: 0
                }}
            />
        </div>
    );
}
