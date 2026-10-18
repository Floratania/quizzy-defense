import React from 'react';
import {
    Card, Title, Stack, Select, TextInput, Box, Text, FileInput,
    Paper, Group, CloseButton, Image, Grid, NumberInput, Checkbox, Button, Badge, Textarea, Anchor, SimpleGrid
} from '@mantine/core';
import { IconPhoto, IconClock, IconStar, IconPlus } from '@tabler/icons-react';
import { useQuizContext } from "../../../../context/QuizContext.jsx";
import RichText from '../../../Question/RichText.jsx';

const questionTypes = [
    { label: 'Вибір з варіантів', value: 'multiple_choice' },
    { label: 'Кілька правильних відповідей', value: 'multiple_response' },
    { label: 'Правда/Неправда', value: 'true_false' },
    { label: 'Текстове запитання', value: 'open_text' },
    { label: 'Вставити пропущене слово', value: 'fill_blank' },
    { label: 'Встановлення відповідності', value: 'matching' },
    { label: 'Правильна послідовність', value: 'ordering' }
];

const answerColors = ['blue', 'teal', 'yellow', 'red', 'violet', 'pink'];

export const AddQuestionForm = () => {
    const { currentQuestion, updateCurrentQuestion, setCurrentQuestion, addQuestion, editingQuestionId, cancelQuestionEdit } = useQuizContext();
    const [adding, setAdding] = React.useState(false);
    const formRef = React.useRef(null);
    React.useEffect(() => {
        if (editingQuestionId !== null) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [editingQuestionId]);

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

        if (type === 'fill_blank') {
            setCurrentQuestion({
                ...currentQuestion,
                type,
                answers: [],
                answerImages: [],
                answerImagePreviews: [],
                answerImageUrls: [],
                numberOfAnswers: 0,
                correctAnswers: [],
                fillBlankItems: currentQuestion.fillBlankItems?.length >= 2
                    ? currentQuestion.fillBlankItems
                    : [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }],
            });
            return;
        }

        if (type === 'matching' || type === 'ordering') {
            setCurrentQuestion({
                ...currentQuestion,
                type,
                answers: [],
                answerImages: [],
                answerImagePreviews: [],
                answerImageUrls: [],
                numberOfAnswers: 0,
                correctAnswers: [],
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
        if (currentQuestion.type === 'true_false' || currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'fill_blank') {
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
        <Card ref={formRef} shadow="md" padding="sm" radius="md" style={{ background: 'white', border: '1px solid #e0e7ff' }}>
            <Title order={4} mb="xs">{editingQuestionId !== null ? 'Редагування питання' : 'Нове питання'}</Title>
            {editingQuestionId !== null && <Text size="xs" c="dimmed" mb="xs">Зміни лише в цій вікторині; оригінал у банку зберігається.</Text>}

            <Stack gap="xs">

                <Grid gutter="xs" align="end">
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Select label="Тип питання" data={questionTypes} value={currentQuestion.type} onChange={handleQuestionTypeChange} size="sm" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 4, sm: 2 }}>
                        <NumberInput label="Час, с" value={currentQuestion.timeLimit} onChange={(timeLimit) => updateCurrentQuestion({ timeLimit })} min={5} max={300} size="sm" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 4, sm: 2 }}>
                        <NumberInput label="Бали" value={currentQuestion.points} onChange={(points) => updateCurrentQuestion({ points })} min={100} max={10000} step={100} size="sm" />
                    </Grid.Col>
                    {['multiple_choice', 'multiple_response'].includes(currentQuestion.type) && <Grid.Col span={{ base: 4, sm: 2 }}>
                        <NumberInput label="Варіантів" value={currentQuestion.numberOfAnswers} onChange={handleNumberOfAnswersChange} min={2} max={6} size="sm" />
                    </Grid.Col>}
                    <Grid.Col span={{ base: 6, sm: 2 }}>
                        <Select label="Складність" size="sm" data={[{ value: 'easy', label: 'Легка' }, { value: 'medium', label: 'Середня' }, { value: 'hard', label: 'Складна' }]} value={currentQuestion.difficulty || 'medium'} onChange={(difficulty) => updateCurrentQuestion({ difficulty })} allowDeselect={false} />
                    </Grid.Col>
                </Grid>

                {/* QUESTION TEXT */}
                {currentQuestion.type === 'fill_blank' ? (
                    <Textarea
                        label="Текст із пропусками"
                        description="Поставте ___ у кожному місці, куди потрібно вставити слово (від 2 до 8 пропусків)"
                        placeholder="Навесні ___ світить яскравіше, а ___ стають довшими."
                        value={currentQuestion.text}
                        onChange={(event) => updateCurrentQuestion({ text: event.target.value.slice(0, 1500) })}
                        minRows={3}
                        autosize
                        maxLength={1500}
                        required
                    />
                ) : (
                    <Textarea
                        label="Питання"
                        placeholder="Введіть текст, формули або код"
                        value={currentQuestion.text}
                        onChange={(e) => updateCurrentQuestion({ text: e.target.value.slice(0, 10000) })}
                        maxLength={10000}
                        minRows={2}
                        autosize
                        required
                        size="sm"
                    />
                )}

                <Box component="details">
                <Text component="summary" size="sm" c="blue" style={{ cursor: 'pointer' }}>Довідка та попередній перегляд</Text>
                <Anchor href="/admin/help/formatting" target="_blank" rel="noopener noreferrer" size="sm">
                    Як писати формули, код і форматований текст? Відкрити довідку ↗
                </Anchor>
                {currentQuestion.text && <Paper withBorder p="sm" mt="xs"><RichText>{currentQuestion.text}</RichText></Paper>}
                </Box>

                {/* QUESTION IMAGE */}
                <Box component="details" key={`extras-${editingQuestionId}`} open={Boolean(currentQuestion.explanation || currentQuestion.imagePreview) || undefined}>
                <Text component="summary" size="sm" c="blue" style={{ cursor: 'pointer' }}>Пояснення та зображення (необов’язково)</Text>
                <Stack gap="sm" mt="xs">
                <Textarea label="Пояснення відповіді" description="Розв’язання, коментар або посилання у форматі [Матеріал](https://...)." value={currentQuestion.explanation || ''} onChange={(event) => updateCurrentQuestion({ explanation: event.currentTarget.value })} minRows={2} autosize maxLength={10000} />
                <Box>
                    <Text size="sm" fw={500} mb="xs">Зображення (Необов'язково)</Text>
                    {currentQuestion.imagePreview ? (
                        <Paper p="md" withBorder radius="md">
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" c="dimmed">Попередній Перегляд</Text>
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
                            placeholder="Додати фото"
                            leftSection={<IconPhoto size={16} />}
                            accept="image/*"
                            onChange={handleQuestionImageUpload}
                        />
                    )}
                </Box>
                </Stack>
                </Box>

                {/* TEXT INPUT QUESTION */}
                {currentQuestion.type === 'open_text' && (
                    <Stack gap="sm">
                        <Text fw={500}>Правильні варіанти відповіді</Text>
                        <Text size="sm" c="dimmed">Достатньо будь-якого з цих варіантів. Регістр літер і пробіли на початку та в кінці не враховуються.</Text>
                        {currentQuestion.answers.map((answer, idx) => (
                            <Group key={idx} align="end" wrap="nowrap">
                                <TextInput
                                    label={`Варіант ${idx + 1}`}
                                    value={answer}
                                    maxLength={100}
                                    required
                                    style={{ flex: 1 }}
                                    onChange={(event) => updateCurrentQuestion({
                                        answers: currentQuestion.answers.map((item, index) => index === idx ? event.target.value.slice(0, 100) : item),
                                    })}
                                />
                                <CloseButton
                                    aria-label={`Видалити варіант ${idx + 1}`}
                                    disabled={currentQuestion.answers.length <= 1}
                                    onClick={() => {
                                        const answers = currentQuestion.answers.filter((_, index) => index !== idx);
                                        updateCurrentQuestion({ answers, numberOfAnswers: answers.length, correctAnswers: answers.map((_, index) => index) });
                                    }}
                                />
                            </Group>
                        ))}
                        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => {
                            const answers = [...currentQuestion.answers, ''];
                            updateCurrentQuestion({ answers, numberOfAnswers: answers.length, correctAnswers: answers.map((_, index) => index) });
                        }}>Додати варіант відповіді</Button>
                    </Stack>
                )}

                {currentQuestion.type === 'matching' && (
                    <Stack gap="sm">
                        <Text fw={500}>Пари для встановлення відповідності</Text>
                        {currentQuestion.matchingPairs.map((pair, idx) => (
                            <Group key={pair.leftId} align="end" wrap="nowrap">
                                <TextInput
                                    label={`Ліва частина ${idx + 1}`}
                                    value={pair.left}
                                    onChange={(event) => {
                                        const matchingPairs = currentQuestion.matchingPairs.map((item, index) =>
                                            index === idx ? { ...item, left: event.target.value } : item,
                                        );
                                        updateCurrentQuestion({ matchingPairs });
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <TextInput
                                    label="Відповідність"
                                    value={pair.right}
                                    onChange={(event) => {
                                        const matchingPairs = currentQuestion.matchingPairs.map((item, index) =>
                                            index === idx ? { ...item, right: event.target.value } : item,
                                        );
                                        updateCurrentQuestion({ matchingPairs });
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <CloseButton
                                    disabled={currentQuestion.matchingPairs.length <= 2}
                                    onClick={() => updateCurrentQuestion({
                                        matchingPairs: currentQuestion.matchingPairs.filter((_, index) => index !== idx),
                                    })}
                                />
                            </Group>
                        ))}
                        <Button
                            variant="light"
                            disabled={currentQuestion.matchingPairs.length >= 8}
                            onClick={() => updateCurrentQuestion({
                                matchingPairs: [...currentQuestion.matchingPairs, {
                                    leftId: crypto.randomUUID(), left: '', rightId: crypto.randomUUID(), right: '',
                                }],
                            })}
                        >
                            Додати пару
                        </Button>
                    </Stack>
                )}

                {currentQuestion.type === 'ordering' && (
                    <Stack gap="sm">
                        <Text fw={500}>Елементи у правильному порядку</Text>
                        {currentQuestion.orderingItems.map((item, idx) => (
                            <Group key={item.id} wrap="nowrap">
                                <Badge>{idx + 1}</Badge>
                                <TextInput
                                    value={item.text}
                                    placeholder={`Елемент ${idx + 1}`}
                                    onChange={(event) => {
                                        const orderingItems = currentQuestion.orderingItems.map((current, index) =>
                                            index === idx ? { ...current, text: event.target.value } : current,
                                        );
                                        updateCurrentQuestion({ orderingItems });
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <CloseButton
                                    disabled={currentQuestion.orderingItems.length <= 2}
                                    onClick={() => updateCurrentQuestion({
                                        orderingItems: currentQuestion.orderingItems.filter((_, index) => index !== idx),
                                    })}
                                />
                            </Group>
                        ))}
                        <Button
                            variant="light"
                            disabled={currentQuestion.orderingItems.length >= 8}
                            onClick={() => updateCurrentQuestion({
                                orderingItems: [...currentQuestion.orderingItems, { id: crypto.randomUUID(), text: '' }],
                            })}
                        >
                            Додати елемент
                        </Button>
                    </Stack>
                )}

                {currentQuestion.type === 'fill_blank' && (
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <div>
                                <Text fw={500}>Слова у правильному порядку пропусків</Text>
                                <Text size="xs" c="dimmed">Пропусків у тексті: {(currentQuestion.text.match(/___/g) || []).length}; слів: {currentQuestion.fillBlankItems.length}</Text>
                            </div>
                            <Button
                                size="xs"
                                variant="light"
                                disabled={currentQuestion.fillBlankItems.length >= 8}
                                onClick={() => updateCurrentQuestion({ fillBlankItems: [...currentQuestion.fillBlankItems, { id: crypto.randomUUID(), text: '' }] })}
                            >
                                Додати слово
                            </Button>
                        </Group>
                        {currentQuestion.fillBlankItems.map((item, index) => (
                            <Group key={item.id} wrap="nowrap">
                                <Badge>{index + 1}</Badge>
                                <TextInput
                                    placeholder={`Слово для пропуску ${index + 1}`}
                                    value={item.text}
                                    onChange={(event) => updateCurrentQuestion({
                                        fillBlankItems: currentQuestion.fillBlankItems.map((word, wordIndex) =>
                                            wordIndex === index ? { ...word, text: event.target.value.slice(0, 100) } : word
                                        ),
                                    })}
                                    style={{ flex: 1 }}
                                />
                                <CloseButton
                                    disabled={currentQuestion.fillBlankItems.length <= 2}
                                    onClick={() => updateCurrentQuestion({ fillBlankItems: currentQuestion.fillBlankItems.filter((_, wordIndex) => wordIndex !== index) })}
                                />
                            </Group>
                        ))}
                    </Stack>
                )}

                {/* MULTIPLE CHOICE / TRUE FALSE */}
                {!['open_text', 'fill_blank', 'matching', 'ordering'].includes(currentQuestion.type) && (
                    <>
                        {/* ANSWER LIST */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                            {currentQuestion.answers
                                .slice(0, currentQuestion.numberOfAnswers)
                                .map((answer, idx) => (
                                    <Paper key={idx} p="xs" withBorder radius="md">
                                        <Stack gap="sm">
                                            <Group>
                                                <Checkbox
                                                    checked={currentQuestion.correctAnswers.includes(idx)}
                                                    onChange={() => handleCorrectAnswerToggle(idx)}
                                                    color={answerColors[idx % answerColors.length]}
                                                />

                                                <TextInput
                                                    placeholder={`Відповідь ${idx + 1}`}
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

                                            <Box component="details" key={`answer-image-${editingQuestionId}-${idx}`} open={Boolean(currentQuestion.answerImagePreviews[idx]) || undefined}>
                                            <Text component="summary" size="xs" c="dimmed" style={{ cursor: 'pointer' }}>Зображення</Text>
                                            {currentQuestion.answerImagePreviews[idx] ? (
                                                <Box>
                                                    <Group justify="space-between" mb="xs">
                                                        <Text size="xs" c="dimmed">Зображення</Text>
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
                                                    placeholder="Додати Зображення"
                                                    accept="image/*"
                                                    leftSection={<IconPhoto size={14} />}
                                                    onChange={(file) =>
                                                        handleAnswerImageUpload(file, idx)
                                                    }
                                                    size="xs"
                                                />
                                            )}
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ))}
                        </SimpleGrid>
                    </>
                )}

                {/* SUBMIT QUESTION */}
                <Checkbox
                    size="xs"
                    label="Також зберегти в банк питань"
                    checked={Boolean(currentQuestion.saveToBank)}
                    onChange={(event) => updateCurrentQuestion({ saveToBank: event.currentTarget.checked })}
                />
                <Button
                    leftSection={<IconPlus size={18} />}
                    loading={adding}
                    onClick={async () => {
                        setAdding(true);
                        try { await addQuestion(); }
                        finally { setAdding(false); }
                    }}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'purple' }}
                    size="sm"
                    fullWidth
                >
                    {editingQuestionId !== null ? 'Зберегти зміни питання' : 'Додати запитання'}
                </Button>
                {editingQuestionId !== null && <Button variant="light" color="gray" disabled={adding} onClick={cancelQuestionEdit}>Скасувати редагування</Button>}
            </Stack>
        </Card>
    );
};
