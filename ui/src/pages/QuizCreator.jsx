import React, { useState } from 'react';
import { MantineProvider, Container, Paper, Title, TextInput, NumberInput, Button, Group, Stack, Radio, Checkbox, ActionIcon, Card, Badge, Text, Divider, Center } from '@mantine/core';
import { IconPlus, IconTrash, IconGripVertical } from '@tabler/icons-react';

function QuizCreator() {
    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState([
        {
            id: 1,
            question: '',
            answers: [
                { id: 1, text: '', isCorrect: false },
                { id: 2, text: '', isCorrect: false },
                { id: 3, text: '', isCorrect: false },
                { id: 4, text: '', isCorrect: false }
            ],
            points: 1000,
            timeLimit: 20
        }
    ]);

    const addQuestion = () => {
        const newQuestion = {
            id: questions.length + 1,
            question: '',
            answers: [
                { id: 1, text: '', isCorrect: false },
                { id: 2, text: '', isCorrect: false },
                { id: 3, text: '', isCorrect: false },
                { id: 4, text: '', isCorrect: false }
            ],
            points: 1000,
            timeLimit: 20
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (questionId) => {
        setQuestions(questions.filter(q => q.id !== questionId));
    };

    const updateQuestion = (questionId, field, value) => {
        setQuestions(questions.map(q =>
            q.id === questionId ? { ...q, [field]: value } : q
        ));
    };

    const updateAnswer = (questionId, answerId, field, value) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    answers: q.answers.map(a =>
                        a.id === answerId ? { ...a, [field]: value } : a
                    )
                };
            }
            return q;
        }));
    };

    const addAnswer = (questionId) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const newAnswer = {
                    id: q.answers.length + 1,
                    text: '',
                    isCorrect: false
                };
                return { ...q, answers: [...q.answers, newAnswer] };
            }
            return q;
        }));
    };

    const removeAnswer = (questionId, answerId) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.answers.length > 2) {
                return {
                    ...q,
                    answers: q.answers.filter(a => a.id !== answerId)
                };
            }
            return q;
        }));
    };

    const getAnswerColors = () => ['#e03131', '#1971c2', '#f59f00', '#2f9e44'];

    return (
        <MantineProvider>
            <Container size="lg" py="xl" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Paper shadow="xl" p="xl" radius="lg" style={{ background: 'white' }}>
                    <Title order={1} mb="xl" style={{ color: '#667eea', fontWeight: 800 }}>
                        Create Your Quiz
                    </Title>

                    <TextInput
                        label="Quiz Title"
                        placeholder="Enter an awesome quiz title..."
                        size="lg"
                        mb="xl"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        styles={{
                            input: { borderWidth: 2, fontSize: '1.2rem' }
                        }}
                    />

                    <Divider my="xl" />

                    <Stack spacing="xl">
                        {questions.map((question, qIndex) => (
                            <Card key={question.id} shadow="md" p="xl" radius="md" style={{ border: '2px solid #e9ecef' }}>
                                <Group position="apart" mb="md">
                                    <Group>
                                        <ActionIcon size="lg" variant="subtle" style={{ cursor: 'grab' }}>
                                            <IconGripVertical size={20} />
                                        </ActionIcon>
                                        <Badge size="lg" variant="filled" color="violet">
                                            Question {qIndex + 1}
                                        </Badge>
                                    </Group>
                                    {questions.length > 1 && (
                                        <ActionIcon
                                            color="red"
                                            variant="light"
                                            onClick={() => removeQuestion(question.id)}
                                        >
                                            <IconTrash size={18} />
                                        </ActionIcon>
                                    )}
                                </Group>

                                <TextInput
                                    label="Question"
                                    placeholder="Type your question here..."
                                    size="md"
                                    mb="md"
                                    value={question.question}
                                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                                    styles={{
                                        input: { fontSize: '1.1rem', fontWeight: 500 }
                                    }}
                                />

                                <Group grow mb="md">
                                    <NumberInput
                                        label="Points"
                                        value={question.points}
                                        onChange={(val) => updateQuestion(question.id, 'points', val)}
                                        min={0}
                                        step={100}
                                    />
                                    <NumberInput
                                        label="Time Limit (seconds)"
                                        value={question.timeLimit}
                                        onChange={(val) => updateQuestion(question.id, 'timeLimit', val)}
                                        min={5}
                                        max={300}
                                    />
                                </Group>

                                <Text weight={600} size="sm" mb="sm" color="dimmed">
                                    Answers (check correct answers)
                                </Text>

                                <Stack spacing="sm">
                                    {question.answers.map((answer, aIndex) => (
                                        <Group key={answer.id} spacing="xs" noWrap>
                                            <div
                                                style={{
                                                    width: 8,
                                                    height: 40,
                                                    backgroundColor: getAnswerColors()[aIndex % 4],
                                                    borderRadius: 4
                                                }}
                                            />
                                            <Checkbox
                                                checked={answer.isCorrect}
                                                onChange={(e) => updateAnswer(question.id, answer.id, 'isCorrect', e.target.checked)}
                                                styles={{ input: { cursor: 'pointer' } }}
                                            />
                                            <TextInput
                                                placeholder={`Answer ${aIndex + 1}`}
                                                value={answer.text}
                                                onChange={(e) => updateAnswer(question.id, answer.id, 'text', e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            {question.answers.length > 2 && (
                                                <ActionIcon
                                                    color="red"
                                                    variant="subtle"
                                                    onClick={() => removeAnswer(question.id, answer.id)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            )}
                                        </Group>
                                    ))}
                                </Stack>

                                {question.answers.length < 6 && (
                                    <Button
                                        variant="light"
                                        leftIcon={<IconPlus size={16} />}
                                        onClick={() => addAnswer(question.id)}
                                        mt="sm"
                                        size="xs"
                                    >
                                        Add Answer
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </Stack>

                    <Center mt="xl">
                        <Button
                            size="lg"
                            leftIcon={<IconPlus size={20} />}
                            onClick={addQuestion}
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape' }}
                        >
                            Add Question
                        </Button>
                    </Center>

                    <Divider my="xl" />

                    <Group position="right">
                        <Button variant="default" size="lg">
                            Save Draft
                        </Button>
                        <Button
                            size="lg"
                            variant="gradient"
                            gradient={{ from: 'teal', to: 'lime' }}
                        >
                            Publish Quiz
                        </Button>
                    </Group>
                </Paper>
            </Container>
        </MantineProvider>
    );
}

export default QuizCreator;