import React from "react";
import RichText from '../../../Question/RichText.jsx';
import {
    Card,
    Box,
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
    IconX,
    IconLibraryPlus,
    IconPencil,
    IconArrowUp,
    IconArrowDown
} from "@tabler/icons-react";
import { notifications } from '@mantine/notifications';
import { useQuizContext } from "../../../../context/QuizContext.jsx";

// Уніфікований мапінг типів
const questionTypes = {
    quiz: "Вибір з варіантів",
    "multiple_choice": "Вибір з варіантів",
    "multiple_response": "Кілька правильних відповідей",
    "true-false": "Правда/Неправда",
    "true_false": "Правда/Неправда",
    boolean: "Правда/Неправда",
    "text-input": "Текстова відповідь",
    "open_text": "Відкрите запитання",
    "fill_blank": "Вставити пропущене слово",
    matching: "Встановлення відповідності",
    ordering: "Правильна послідовність"
};

export const QuestionsList = () => {
    const { formData, removeQuestion, moveQuestion, saveQuestionInBank, editQuestion } = useQuizContext();

    const questions = formData.questionsData || [];

    const saveToBank = async (question) => {
        try {
            await saveQuestionInBank(question);
            notifications.show({ color: 'green', message: 'Питання збережено до банку' });
        } catch {
            notifications.show({ color: 'red', message: 'Не вдалося зберегти питання' });
        }
    };

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
                                <Badge size="sm" variant="light" color={q.difficulty === 'hard' ? 'red' : q.difficulty === 'easy' ? 'teal' : 'yellow'}>{{ easy: 'Легка', medium: 'Середня', hard: 'Складна' }[q.difficulty || 'medium']}</Badge>

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

                            <Group gap="xs">
                                <ActionIcon title="Перемістити вгору" aria-label={`Перемістити питання ${idx + 1} вгору`} disabled={idx === 0} variant="light" onClick={() => moveQuestion(q.id, -1)}>
                                    <IconArrowUp size={18} />
                                </ActionIcon>
                                <ActionIcon title="Перемістити вниз" aria-label={`Перемістити питання ${idx + 1} вниз`} disabled={idx === questions.length - 1} variant="light" onClick={() => moveQuestion(q.id, 1)}>
                                    <IconArrowDown size={18} />
                                </ActionIcon>
                                <ActionIcon title="Редагувати питання" aria-label="Редагувати питання" color="blue" variant="light" onClick={() => editQuestion(q.id)}>
                                    <IconPencil size={18} />
                                </ActionIcon>
                                <ActionIcon title="Зберегти до банку" color="teal" variant="light" onClick={() => saveToBank(q)}>
                                    <IconLibraryPlus size={18} />
                                </ActionIcon>
                                <ActionIcon color="red" variant="light" onClick={() => removeQuestion(q.id)}>
                                    <IconTrash size={18} />
                                </ActionIcon>
                            </Group>
                        </Group>

                        {/* TEXT */}
                        <Box mb="md">
                            <RichText>{q.text}</RichText>
                        </Box>

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
                        {q.type === 'open_text' && (
                            <Box mb="md">
                                <Text size="sm" fw={500}>Прийнятні варіанти відповіді:</Text>
                                {q.answers.map((answer, index) => <Text key={index} size="sm" c="teal.8">✓ {answer}</Text>)}
                            </Box>
                        )}
                        {!['text-input', 'open_text', 'fill_blank', 'matching', 'ordering'].includes(q.type) && (
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
                        {q.type === 'matching' && q.matchingPairs.map((pair, pairIndex) => (
                            <Text key={pair.leftId} size="sm">{pairIndex + 1}. {pair.left} → {pair.right}</Text>
                        ))}
                        {q.type === 'ordering' && q.orderingItems.map((item, itemIndex) => (
                            <Text key={item.id} size="sm">{itemIndex + 1}. {item.text}</Text>
                        ))}
                        {q.type === 'fill_blank' && q.fillBlankItems.map((item, itemIndex) => (
                            <Text key={item.id} size="sm">Пропуск {itemIndex + 1}: <strong>{item.text}</strong></Text>
                        ))}
                    </Paper>
                ))}
            </Stack>
        </Card>
    );
};
