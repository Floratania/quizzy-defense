import React, { useState } from "react";
import { Paper, Group, Title, Text, Button, ActionIcon, Box } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useQuizContext } from "../../../../context/QuizContext.jsx";
import { useNavigate } from "react-router";

export const QuizHeader = () => {
    const { formData, isEdit, submitQuiz, editingQuestionId, draftStatus, draftRestored, discardDraft } = useQuizContext();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

    const handleBack = () => {
        navigate("/admin/quizzes");
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            await submitQuiz();
            navigate("/admin/quizzes");
        } catch (err) {
            console.error("Failed to submit quiz:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper shadow="sm" p="lg" radius="lg" style={{ background: "white" }}>
            <Group justify="space-between">
                <Group>
                    <ActionIcon
                        size="lg"
                        variant="light"
                        color="blue"
                        onClick={handleBack}
                    >
                        <IconArrowLeft size={20} />
                    </ActionIcon>

                    <Box>
                        <Title order={2} style={{ color: "#1f2937" }}>
                            {isEdit ? "Редагування Вікторини" : "Створення Вікторини"}
                        </Title>

                        <Text c="dimmed" size="sm">
                            додано {formData.questionsData.length} запитан(ь/я)
                        </Text>
                        <Text size="xs" c="dimmed">{draftRestored ? 'Відновлено локальну чернетку. ' : ''}{draftStatus}</Text>
                    </Box>
                </Group>

                <Group>
                    <Button variant="subtle" color="gray" size="xs" onClick={discardDraft} disabled={saving}>Видалити чернетку</Button>
                    <Button
                        variant="light"
                        color="gray"
                        onClick={handleBack}
                        disabled={saving}
                    >
                        Скасувати
                    </Button>

                    <Button
                        variant="gradient"
                        gradient={{ from: "teal.6", to: "green.7" }}
                        onClick={handleSubmit}
                        disabled={formData.questionsData.length === 0 || saving || editingQuestionId !== null}
                    >
                        {isEdit ? "Зберегти зміни" : "Створити вікторину"}
                    </Button>
                </Group>
            </Group>
        </Paper>
    );
};
