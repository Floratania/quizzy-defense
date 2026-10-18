import { Paper, Box, Group, Text } from "@mantine/core";
import { ANSWER_STYLES } from "../../constants/answerStyles.js";
import RichText from '../Question/RichText.jsx';

export function HostAnswerCard({ answer, index }) {
    const style = ANSWER_STYLES[index % ANSWER_STYLES.length];

    const cardStyle = {
        background: `linear-gradient(135deg,
      var(--mantine-color-${style.color}-4),
      var(--mantine-color-${style.color}-6)
    )`,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: 0.5,
    };

    // --- IMAGE MODE ---
    if (answer.imageUrl) {
        return (
            <Paper shadow="md" radius="xl" p="xl" style={cardStyle}>
                <Group gap="md" style={{ width: "100%" }}>
                    <Box
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            overflow: "hidden",
                            background: "white",
                            flexShrink: 0,
                        }}
                    >
                        <img
                            src={answer.imageUrl}
                            alt={answer.text}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </Box>

                    <Text
                        size="xl"
                        fw={700}
                        c="white"
                        style={{
                            flex: 1,
                            lineHeight: 1.2,
                            wordBreak: "break-word",
                        }}
                    >
                        <RichText>{answer.text}</RichText>
                    </Text>
                </Group>
            </Paper>
        );
    }

    // --- TEXT MODE ---
    return (
        <Paper shadow="md" radius="xl" p="xl" style={cardStyle}>
            <Group gap="md" style={{ width: "100%" }} noWrap>
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
                        justifyContent: "center",
                    }}
                >
                    {style.icon}
                </Box>

                <Text
                    size="xl"
                    fw={700}
                    c="white"
                    style={{
                        flex: 1,
                        lineHeight: 1.1,
                        wordBreak: "break-word",
                    }}
                >
                    <RichText>{answer.text}</RichText>
                </Text>
            </Group>
        </Paper>
    );
}
