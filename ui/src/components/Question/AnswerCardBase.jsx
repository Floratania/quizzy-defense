import { Paper } from "@mantine/core";
import { ANSWER_STYLES } from "../../constants/answerStyles.js";

export function AnswerCardBase({
                                   answer,
                                   index,
                                   selected,
                                   disabled,
                                   onSelect,
                                   children
                               }) {
    const style = ANSWER_STYLES[index % ANSWER_STYLES.length];
    const clickable = !!onSelect && !disabled;

    return (
        <Paper
            shadow="md"
            radius="xl"
            p="xl"
            onClick={() => clickable && onSelect(answer.id)}
            style={{
                cursor: clickable ? "pointer" : "default",
                background: `linear-gradient(135deg,
                    var(--mantine-color-${style.color}-4),
                    var(--mantine-color-${style.color}-6)
                )`,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transform: selected ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s",
                border: selected ? "4px solid white" : "none",
                opacity: disabled && !selected ? 0.5 : 1
            }}
        >
            {children}
        </Paper>
    );
}
