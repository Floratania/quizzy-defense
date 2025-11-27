import React, { useState } from "react";
import { Paper, Group, Title, Text, Button, ActionIcon, Box } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useQuizContext } from "../../../../context/QuizContext.jsx";
import { useNavigate } from "react-router";

export const QuizHeader = () => {
    const { formData, isEdit, submitQuiz } = useQuizContext();
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
                            {isEdit ? "Edit Quiz" : "Create New Quiz"}
                        </Title>

                        <Text c="dimmed" size="sm">
                            {formData.questionsData.length} questions added
                        </Text>
                    </Box>
                </Group>

                <Group>
                    <Button
                        variant="light"
                        color="gray"
                        onClick={handleBack}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="gradient"
                        gradient={{ from: "blue.4", to: "purple.4" }}
                        onClick={handleSubmit}
                        disabled={formData.questionsData.length === 0 || saving}
                    >
                        {isEdit ? "Update Quiz" : "Create Quiz"}
                    </Button>
                </Group>
            </Group>
        </Paper>
    );
};
