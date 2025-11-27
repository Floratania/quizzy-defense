import React from 'react';
import {
    Card, Title, Stack, Select, TextInput, Box, Text, FileInput,
    Paper, Group, CloseButton, Image, Grid, NumberInput, Checkbox, Button
} from '@mantine/core';
import { IconPhoto, IconClock, IconStar, IconPlus } from '@tabler/icons-react';
import { useQuizContext } from "../../../../context/QuizContext.jsx";

const questionTypes = [
    { label: 'Multiple Choice', value: 'multiple_choice' },
    { label: 'True/False', value: 'true_false' },
    { label: 'Text Input', value: 'open_text' }
];

const answerColors = ['blue', 'teal', 'yellow', 'red', 'violet', 'pink'];

export const AddQuestionForm = () => {
    const { currentQuestion, updateCurrentQuestion, setCurrentQuestion, addQuestion } = useQuizContext();

    // ----------------------------
    // TYPE CHANGE HANDLER
    // ----------------------------
    const handleQuestionTypeChange = (type) => {

        if (type === 'true_false') {
            setCurrentQuestion({
                ...currentQuestion,
                type,
                answers: ['True', 'False'],
                answerImages: [null, null],
                answerImagePreviews: [null, null],
                answerImageUrls: [null, null],
                numberOfAnswers: 2,
                correctAnswers: [0],
            });
            return;
        }

        if (type === 'open_text') {
            setCurrentQuestion({
                ...currentQuestion,
                type,
                answers: [''],
                answerImages: [null],
                answerImagePreviews: [null],
                answerImageUrls: [null],
                numberOfAnswers: 1,
                correctAnswers: [0],
            });
            return;
        }

        // MULTIPLE CHOICE
        setCurrentQuestion({
            ...currentQuestion,
            type,
            answers: ['', '', '', ''],
            answerImages: [null, null, null, null],
            answerImagePreviews: [null, null, null, null],
            answerImageUrls: [null, null, null, null],
            numberOfAnswers: 4,
            correctAnswers: [0],
        });
    };

    // -----------------------------------
    // NUMBER OF ANSWERS CHANGE (MCQ only)
    // -----------------------------------
    const handleNumberOfAnswersChange = (value) => {
        const newAnswers = Array(value).fill('');
        const newImages = Array(value).fill(null);
        const newPreviews = Array(value).fill(null);
        const newUrls = Array(value).fill(null);

        for (let i = 0; i < Math.min(value, currentQuestion.answers.length); i++) {
            newAnswers[i] = currentQuestion.answers[i];
            newImages[i] = currentQuestion.answerImages[i];
            newPreviews[i] = currentQuestion.answerImagePreviews[i];
            newUrls[i] = currentQuestion.answerImageUrls?.[i] || null;
        }

        updateCurrentQuestion({
            numberOfAnswers: value,
            answers: newAnswers,
            answerImages: newImages,
            answerImagePreviews: newPreviews,
            answerImageUrls: newUrls,
            correctAnswers: [0],
        });
    };

    // ----------------------------
    // QUESTION IMAGE UPLOAD
    // ----------------------------
    const handleQuestionImageUpload = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            updateCurrentQuestion({
                image: file,
                imagePreview: reader.result,
                imageUrl: null, // reset URL when new file chosen
            });
        };
        reader.readAsDataURL(file);
    };

    // ----------------------------
    // ANSWER IMAGE UPLOAD
    // ----------------------------
    const handleAnswerImageUpload = (file, idx) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const newImages = [...currentQuestion.answerImages];
            const newPreviews = [...currentQuestion.answerImagePreviews];
            const newUrls = [...currentQuestion.answerImageUrls];

            newImages[idx] = file;
            newPreviews[idx] = reader.result;
            newUrls[idx] = null; // reset url (Cloudinary will set new one)

            updateCurrentQuestion({
                answerImages: newImages,
                answerImagePreviews: newPreviews,
                answerImageUrls: newUrls,
            });
        };
        reader.readAsDataURL(file);
    };

    // ----------------------------
    // CORRECT ANSWER CHECKBOX
    // ----------------------------
    const handleCorrectAnswerToggle = (idx) => {
        if (currentQuestion.type === 'true_false') {
            updateCurrentQuestion({ correctAnswers: [idx] });
            return;
        }

        let newCorrect = currentQuestion.correctAnswers.includes(idx)
            ? currentQuestion.correctAnswers.filter(i => i !== idx)
            : [...currentQuestion.correctAnswers, idx];

        if (newCorrect.length === 0) return;

        updateCurrentQuestion({ correctAnswers: newCorrect });
    };

    return (
        <Card shadow="md" padding="xl" radius="lg" style={{ background: 'white', border: '1px solid #e0e7ff' }}>
            <Title order={3} mb="lg">Add New Question</Title>

            <Stack gap="lg">

                {/* TYPE SELECT */}
                <Select
                    label="Question Type"
                    data={questionTypes}
                    value={currentQuestion.type}
                    onChange={handleQuestionTypeChange}
                    size="md"
                />

                {/* QUESTION TEXT */}
                <TextInput
                    label="Question"
                    placeholder="Enter your question (max 100 characters)"
                    value={currentQuestion.text}
                    onChange={(e) => updateCurrentQuestion({ text: e.target.value.slice(0, 100) })}
                    maxLength={100}
                    required
                    size="md"
                    rightSection={
                        <Text size="xs" c="dimmed">{currentQuestion.text.length}/100</Text>
                    }
                />

                {/* QUESTION IMAGE */}
                <Box>
                    <Text size="sm" fw={500} mb="xs">Question Image (Optional)</Text>
                    {currentQuestion.imagePreview ? (
                        <Paper p="md" withBorder radius="md">
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" c="dimmed">Preview</Text>
                                <CloseButton
                                    onClick={() =>
                                        updateCurrentQuestion({
                                            image: null,
                                            imagePreview: null,
                                            imageUrl: null,
                                        })
                                    }
                                />
                            </Group>
                            <Image src={currentQuestion.imagePreview} radius="md" h={200} fit="contain" />
                        </Paper>
                    ) : (
                        <FileInput
                            placeholder="Upload image"
                            leftSection={<IconPhoto size={16} />}
                            accept="image/*"
                            onChange={handleQuestionImageUpload}
                        />
                    )}
                </Box>

                {/* TIME + POINTS */}
                <Grid>
                    <Grid.Col span={6}>
                        <NumberInput
                            label="Time Limit (seconds)"
                            value={currentQuestion.timeLimit}
                            onChange={(v) => updateCurrentQuestion({ timeLimit: v })}
                            min={5}
                            max={300}
                            leftSection={<IconClock size={16} />}
                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <NumberInput
                            label="Points"
                            value={currentQuestion.points}
                            onChange={(v) => updateCurrentQuestion({ points: v })}
                            min={100}
                            max={10000}
                            step={100}
                            leftSection={<IconStar size={16} />}
                        />
                    </Grid.Col>
                </Grid>

                {/* TEXT INPUT QUESTION */}
                {currentQuestion.type === 'open_text' && (
                    <TextInput
                        label="Correct Answer"
                        value={currentQuestion.answers[0]}
                        onChange={(e) =>
                            updateCurrentQuestion({
                                answers: [e.target.value.slice(0, 100)],
                            })
                        }
                    />
                )}

                {/* MULTIPLE CHOICE / TRUE FALSE */}
                {currentQuestion.type !== 'open_text' && (
                    <>
                        {/* NUMBER OF ANSWERS (ONLY MCQ) */}
                        {currentQuestion.type === 'multiple_choice' && (
                            <NumberInput
                                label="Number of Answers"
                                value={currentQuestion.numberOfAnswers}
                                onChange={handleNumberOfAnswersChange}
                                min={2}
                                max={6}
                                size="md"
                            />
                        )}

                        {/* ANSWER LIST */}
                        <Stack gap="md">
                            {currentQuestion.answers
                                .slice(0, currentQuestion.numberOfAnswers)
                                .map((answer, idx) => (
                                    <Paper key={idx} p="md" withBorder radius="md">
                                        <Stack gap="sm">
                                            <Group>
                                                <Checkbox
                                                    checked={currentQuestion.correctAnswers.includes(idx)}
                                                    onChange={() => handleCorrectAnswerToggle(idx)}
                                                    color={answerColors[idx % answerColors.length]}
                                                />

                                                <TextInput
                                                    placeholder={`Answer ${idx + 1}`}
                                                    value={answer}
                                                    onChange={(e) => {
                                                        const updated = [...currentQuestion.answers];
                                                        updated[idx] = e.target.value.slice(0, 100);
                                                        updateCurrentQuestion({ answers: updated });
                                                    }}
                                                    disabled={currentQuestion.type === 'true_false'}
                                                    style={{ flex: 1 }}
                                                />
                                            </Group>

                                            {/* ANSWER IMAGE */}
                                            {currentQuestion.answerImagePreviews[idx] ? (
                                                <Box>
                                                    <Group justify="space-between" mb="xs">
                                                        <Text size="xs" c="dimmed">Image</Text>
                                                        <CloseButton
                                                            size="xs"
                                                            onClick={() => {
                                                                const imgs = [...currentQuestion.answerImages];
                                                                const prevs = [...currentQuestion.answerImagePreviews];
                                                                const urls = [...currentQuestion.answerImageUrls];
                                                                imgs[idx] = null;
                                                                prevs[idx] = null;
                                                                urls[idx] = null;
                                                                updateCurrentQuestion({
                                                                    answerImages: imgs,
                                                                    answerImagePreviews: prevs,
                                                                    answerImageUrls: urls,
                                                                });
                                                            }}
                                                        />
                                                    </Group>
                                                    <Image
                                                        src={currentQuestion.answerImagePreviews[idx]}
                                                        radius="sm"
                                                        h={100}
                                                        fit="cover"
                                                    />
                                                </Box>
                                            ) : (
                                                <FileInput
                                                    placeholder="Add image"
                                                    accept="image/*"
                                                    leftSection={<IconPhoto size={14} />}
                                                    onChange={(file) =>
                                                        handleAnswerImageUpload(file, idx)
                                                    }
                                                    size="xs"
                                                />
                                            )}
                                        </Stack>
                                    </Paper>
                                ))}
                        </Stack>
                    </>
                )}

                {/* SUBMIT QUESTION */}
                <Button
                    leftSection={<IconPlus size={18} />}
                    onClick={addQuestion}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'purple' }}
                    size="lg"
                    fullWidth
                >
                    Add Question to Quiz
                </Button>
            </Stack>
        </Card>
    );
};
