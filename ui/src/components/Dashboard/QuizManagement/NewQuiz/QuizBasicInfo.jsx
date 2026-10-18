import React from "react";
import { Card, Title, Stack, TextInput, Textarea, Text, Select, Checkbox, NumberInput } from "@mantine/core";
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

                <TextInput
                    label="Тема"
                    description="За темою вікторини групуються у вашому списку"
                    placeholder="Наприклад: Математика, Історія, Англійська"
                    value={formData.topic || ''}
                    onChange={(e) => updateFormData({ topic: e.currentTarget.value.slice(0, 100) })}
                    maxLength={100}
                />

                <TextInput label="Папка для банку питань" value={formData.bankFolder || 'Загальна'} onChange={(e) => updateFormData({ bankFolder: e.currentTarget.value })} />
                <TextInput label="Теги для банку" description="Через кому" placeholder="формули, 7 клас, контрольна" value={formData.bankTags || ''} onChange={(e) => updateFormData({ bankTags: e.currentTarget.value })} />
                <Select label="Складність питань, що зберігаються до банку" value={formData.bankDifficulty || 'medium'} onChange={(bankDifficulty) => updateFormData({ bankDifficulty })} data={[{value:'easy',label:'Легка'},{value:'medium',label:'Середня'},{value:'hard',label:'Складна'}]} />

                <Select
                    label="Коли показувати результат учаснику"
                    description="Визначає, коли учень побачить правильність і зароблені бали"
                    value={formData.feedbackMode || 'IMMEDIATE'}
                    onChange={(feedbackMode) => updateFormData({ feedbackMode })}
                    data={[
                        { value: 'IMMEDIATE', label: 'Одразу після кожної відповіді' },
                        { value: 'END_WITH_ANSWERS', label: 'Наприкінці — бали та правильні відповіді' },
                        { value: 'END_SCORE_ONLY', label: 'Наприкінці — лише підсумкові бали' },
                    ]}
                />

                <Checkbox
                    label="Перемішувати питання окремо для кожного учасника"
                    checked={Boolean(formData.shuffleQuestions)}
                    onChange={(event) => updateFormData({ shuffleQuestions: event.currentTarget.checked })}
                />
                <Checkbox
                    label="Перемішувати варіанти відповідей окремо для кожного учасника"
                    checked={Boolean(formData.shuffleAnswers)}
                    onChange={(event) => updateFormData({ shuffleAnswers: event.currentTarget.checked })}
                />
                <NumberInput label="Поріг успішності, %" min={0} max={100} value={formData.passThreshold ?? 60} onChange={(passThreshold) => updateFormData({ passThreshold })} />
                <NumberInput label="Максимальна кількість спроб" description="0 — без обмежень" min={0} value={formData.maxAttempts || 0} onChange={(maxAttempts) => updateFormData({ maxAttempts })} />
                <TextInput type="datetime-local" label="Доступна від" value={formData.availableFrom || ''} onChange={(e) => updateFormData({ availableFrom: e.currentTarget.value })} />
                <TextInput type="datetime-local" label="Доступна до" value={formData.availableUntil || ''} onChange={(e) => updateFormData({ availableUntil: e.currentTarget.value })} />
                <Checkbox label="Вимагати повноекранний режим" checked={Boolean(formData.requireFullscreen)} onChange={(e) => updateFormData({ requireFullscreen: e.currentTarget.checked })} />
                <Checkbox label="Фіксувати виходи з вкладки" checked={Boolean(formData.trackTabSwitches)} onChange={(e) => updateFormData({ trackTabSwitches: e.currentTarget.checked })} />
            </Stack>
        </Card>
    );
};
