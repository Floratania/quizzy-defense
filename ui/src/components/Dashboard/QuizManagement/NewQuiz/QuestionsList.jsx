import React from "react";
import {
    Card,
    Title,
    Stack,
    Paper,
    Group,
    Badge,
    Text,
    Grid,
    Image,
    ActionIcon
} from "@mantine/core";
import {
    IconClock,
    IconStar,
    IconTrash,
    IconCheck,
    IconX
} from "@tabler/icons-react";
import { useQuizContext } from "../../../../context/QuizContext.jsx";

// Уніфікований мапінг типів
const questionTypes = {
    quiz: "Вибір з варіантів",
    "multiple_choice": "Вибір з варіантів",
    "true-false": "Правда/Неправда",
    "true_false": "Правда/Неправда",
    boolean: "Правда/Неправда",
    "text-input": "Текстова відповідь",
    "open_text": "Відкрите запитання"
};

export const QuestionsList = () => {
    const { formData, removeQuestion } = useQuizContext();

    const questions = formData.questionsData || [];

    if (questions.length === 0) return null;

    return (
        <Card
            shadow="md"
            padding="xl"
            radius="lg"
            style={{ background: "white", border: "1px solid #e0e7ff" }}
        >
            <Title order={3} mb="lg" style={{ color: "#1f2937" }}>
                Запитання ({questions.length})
            </Title>

            <Stack gap="md">
                {questions.map((q, idx) => (
                    <Paper
                        key={q.id}
                        p="lg"
                        withBorder
                        radius="md"
                        style={{ borderColor: "#e0e7ff" }}
                    >
                        {/* HEADER */}
                        <Group justify="space-between" align="flex-start" mb="md">
                            <Group>
                                <Badge
                                    size="lg"
                                    variant="gradient"
                                    gradient={{ from: "blue.3", to: "purple.3" }}
                                >
                                    З{idx + 1}
                                </Badge>

                                <Badge size="md" color="gray" variant="light">
                                    {questionTypes[q.type] || "Unknown"}
                                </Badge>

                                <Group gap="xs">
                                    <IconClock size={14} color="gray" />
                                    <Text size="sm" c="dimmed">
                                        {q.timeLimit}сек.
                                    </Text>
                                </Group>

                                <Group gap="xs">
                                    <IconStar size={14} color="gold" />
                                    <Text size="sm" c="dimmed">
                                        {q.points} балів
                                    </Text>
                                </Group>
                            </Group>

                            <ActionIcon
                                color="red"
                                variant="light"
                                onClick={() => removeQuestion(q.id)}
                            >
                                <IconTrash size={18} />
                            </ActionIcon>
                        </Group>

                        {/* TEXT */}
                        <Text fw={600} size="lg" mb="md">
                            {q.text}
                        </Text>

                        {/* QUESTION IMAGE */}
                        {(q.imagePreview || q.imageUrl) && (
                            <Image
                                src={q.imagePreview || q.imageUrl}
                                alt="Question"
                                radius="md"
                                h={200}
                                fit="contain"
                                mb="md"
                            />
                        )}

                        {/* ANSWERS */}
                        {q.type !== "text-input" && q.type !== "open_text" && (
                            <Grid>
                                {q.answers.slice(0, q.numberOfAnswers).map((answer, i) => (
                                    <Grid.Col key={i} span={6}>
                                        <Paper
                                            p="sm"
                                            withBorder
                                            radius="md"
                                            style={{
                                                borderColor: q.correctAnswers.includes(i)
                                                    ? "#10b981"
                                                    : "#e5e7eb",
                                                borderWidth: 2,
                                                background: q.correctAnswers.includes(i)
                                                    ? "#f0fdf4"
                                                    : "white"
                                            }}
                                        >
                                            {(q.answerImagePreviews?.[i] ||
                                                q.answerImageUrls?.[i]) && (
                                                <Image
                                                    src={
                                                        q.answerImagePreviews?.[i] ||
                                                        q.answerImageUrls?.[i]
                                                    }
                                                    alt={`Answer ${i + 1}`}
                                                    radius="sm"
                                                    h={80}
                                                    fit="cover"
                                                    mb="xs"
                                                />
                                            )}

                                            <Group gap="xs">
                                                {q.correctAnswers.includes(i) ? (
                                                    <IconCheck size={16} color="#10b981" />
                                                ) : (
                                                    <IconX size={16} color="gray" />
                                                )}

                                                <Text
                                                    size="sm"
                                                    fw={
                                                        q.correctAnswers.includes(i) ? 600 : 400
                                                    }
                                                    c={
                                                        q.correctAnswers.includes(i)
                                                            ? "teal"
                                                            : "dimmed"
                                                    }
                                                >
                                                    {answer}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    </Grid.Col>
                                ))}
                            </Grid>
                        )}
                    </Paper>
                ))}
            </Stack>
        </Card>
    );
};
