import React from "react";
import { Card, Title, Stack, TextInput, Textarea, Text } from "@mantine/core";
import { useQuizContext } from "../../../../context/QuizContext.jsx";

export const QuizBasicInfo = () => {
    const { formData, updateFormData } = useQuizContext();

    const title = formData.title || "";
    const description = formData.description || "";

    return (
        <Card
            shadow="md"
            padding="xl"
            radius="lg"
            style={{ background: "white", border: "1px solid #e0e7ff" }}
        >
            <Title order={3} mb="lg" style={{ color: "#1f2937" }}>
                Інформація про Вікторину
            </Title>

            <Stack gap="md">
                <TextInput
                    label="Назва Вікторини"
                    placeholder="Введіть назву вікторини (до 100 символів)"
                    value={title}
                    onChange={(e) =>
                        updateFormData({ title: e.target.value.slice(0, 100) })
                    }
                    maxLength={100}
                    required
                    size="md"
                    rightSection={
                        <Text size="xs" c="dimmed">
                            {title.length}/100
                        </Text>
                    }
                />

                <Textarea
                    label="Опис"
                    placeholder="Введіть опис вікторини (до 100 символів)"
                    rows={3}
                    value={description}
                    onChange={(e) =>
                        updateFormData({
                            description: e.target.value.slice(0, 100),
                        })
                    }
                    maxLength={100}
                    size="md"
                    rightSection={
                        <Text size="xs" c="dimmed">
                            {description.length}/100
                        </Text>
                    }
                />
            </Stack>
        </Card>
    );
};
