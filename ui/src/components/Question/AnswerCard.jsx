import { Paper, Group, Text, Box, Stack } from "@mantine/core";
import { ANSWER_STYLES } from "../../constants/answerStyles.js";

export function AnswerCard({
                               answer,
                               index,
                               selected,     // true/false
                               disabled,     // disables clicking
                               onSelect,     // optional
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
                height: 120,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                transform: selected ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s",
                border: selected ? "4px solid white" : "none",
                opacity: disabled && !selected ? 0.5 : 1
            }}
        >
            {/* If answer has image */}
            {answer.imageUrl ? (
                <Stack gap="sm" style={{ width: "100%" }}>
                    <Box
                        style={{
                            width: "100%",
                            height: 120,
                            borderRadius: 8,
                            overflow: "hidden",
                            background: "white"
                        }}
                    >
                        <img
                            src={answer.imageUrl}
                            alt={answer.text}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                            }}
                        />
                    </Box>
                    <Text size="lg" fw={700} style={{ color: "white", textAlign: "center" }}>
                        {answer.text}
                    </Text>
                </Stack>
            ) : (
                <Group gap="md" style={{ width: "100%" }} noWrap>
                    {/* icon */}
                    <Box
                        style={{
                            width: 48,
                            height: 48,
                            fontSize: 32,
                            fontWeight: 700,
                            color: "white",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        {style.icon}
                    </Box>

                    {/* text */}
                    <Text
                        size="xl"
                        fw={700}
                        style={{
                            color: "white",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            flex: 1,
                        }}
                    >
                        {answer.text}
                    </Text>

                    {/* checkmark if selected */}
                    {selected && <Text size={32}>✓</Text>}
                </Group>
            )}
        </Paper>
    );
}
