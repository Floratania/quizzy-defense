import React, { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Card, Group, Image, Paper, Select, Stack, Text, TextInput, Title, Tooltip } from '@mantine/core';
import RichText from '../../../Question/RichText.jsx';
import { notifications } from '@mantine/notifications';
import { IconHistory, IconLibrary, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useQuizContext } from '../../../../context/QuizContext.jsx';
import { addQuestionBankExamples, deleteQuestionFromBank, getQuestionBank, getQuestionUsage, pickQuestionsFromBank } from '../../../../services/questionBank.service.js';

const typeLabels = {
    multiple_choice: 'Одна відповідь', multiple_response: 'Кілька відповідей', true_false: 'Так / Ні',
    open_text: 'Відкрита', matching: 'Відповідність', ordering: 'Послідовність', fill_blank: 'Пропуски',
};

export const QuestionBank = () => {
    const [opened, setOpened] = useState(false);
    return (
        <Card shadow="md" padding="xl" radius="lg" withBorder>
            <Group justify="space-between">
                <Group><IconLibrary /><Title order={3}>Банк запитань</Title></Group>
                <Button variant="light" onClick={() => setOpened((value) => !value)} aria-expanded={opened}>
                    {opened ? 'Сховати банк питань' : 'Відкрити банк питань'}
                </Button>
            </Group>
            {opened ? <QuestionBankContents /> : <Text size="sm" c="dimmed" mt="sm">За потреби відкрийте банк, щоб знайти й додати готові питання до тесту.</Text>}
        </Card>
    );
};

const QuestionBankContents = () => {
    const { addQuestionFromBank } = useQuizContext();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [addingExamples, setAddingExamples] = useState(false);
    const [questionsVisible, setQuestionsVisible] = useState(false);
    const [counts, setCounts] = useState({ easy: 0, medium: 0, hard: 0 });

    const load = async () => {
        setLoading(true);
        try { setItems(await getQuestionBank(search, topic || '')); }
        catch { notifications.show({ color: 'red', message: 'Не вдалося завантажити банк питань' }); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        load();
        const refresh = () => load();
        window.addEventListener('question-bank-updated', refresh);
        return () => window.removeEventListener('question-bank-updated', refresh);
    }, []);
    const topics = useMemo(() => [...new Set(items.map((item) => item.topic))].map((value) => ({ value, label: value })), [items]);

    const remove = async (id) => {
        await deleteQuestionFromBank(id);
        setItems((previous) => previous.filter((item) => item.id !== id));
    };
    const autoPick = async () => {
        const selected = await pickQuestionsFromBank(topic || '', counts);
        selected.forEach((item) => addQuestionFromBank(item.payload));
        notifications.show({ color: 'green', message: `Додано питань: ${selected.length}` });
    };
    const showUsage = async (id) => { const usage=await getQuestionUsage(id); alert(usage.length ? `Використано у:\n${usage.map((x)=>`• ${x.title}`).join('\n')}` : 'Питання ще не використовувалось у збережених вікторинах'); };

    return (
        <Stack gap="md" mt="md">
            <Group justify="flex-end">
                <Button variant="light" color="teal" loading={addingExamples} onClick={async () => {
                    setAddingExamples(true);
                    try {
                        const { added } = await addQuestionBankExamples();
                        await load();
                        notifications.show({ color: 'green', message: added ? `Додано прикладів: ${added}` : 'Усі приклади вже є у вашому банку' });
                    } catch {
                        notifications.show({ color: 'red', message: 'Не вдалося додати приклади' });
                    } finally { setAddingExamples(false); }
                }}>Додати 7 прикладів</Button>
            </Group>
            <Text size="sm" c="dimmed" mb="md">Знайдіть збережене питання та додайте його до цієї вікторини.</Text>
            <Group align="end" mb="md">
                <TextInput label="Пошук" placeholder="Текст питання" value={search} onChange={(e) => setSearch(e.currentTarget.value)} leftSection={<IconSearch size={16} />} style={{ flex: 1 }} />
                <Select label="Тема" placeholder="Усі теми" clearable data={topics} value={topic} onChange={setTopic} w={220} />
                <Button variant="light" loading={loading} onClick={load}>Знайти</Button>
            </Group>
            <Group align="end" mb="md">
                {['easy','medium','hard'].map((level) => <TextInput key={level} type="number" label={{easy:'Легких',medium:'Середніх',hard:'Складних'}[level]} value={counts[level]} onChange={(e) => setCounts((p) => ({...p,[level]:Number(e.currentTarget.value)||0}))} w={110} />)}
                <Button color="teal" onClick={autoPick}>Підібрати автоматично</Button>
            </Group>
            <Group justify="space-between">
                <Text size="sm" c="dimmed">Знайдено питань: {items.length}</Text>
                <Button variant="light" aria-expanded={questionsVisible} onClick={() => setQuestionsVisible((visible) => !visible)}>
                    {questionsVisible ? 'Сховати питання' : 'Показати питання'}
                </Button>
            </Group>
            {questionsVisible && (items.length === 0 ? <Text c="dimmed" ta="center" py="md">У банку ще немає відповідних питань</Text> : (
                <Stack gap="xs">
                    {items.map((item) => (
                        <Paper key={item.id} withBorder radius="md" p="sm">
                            <Group gap="xs" wrap="nowrap" align="flex-start" mb={6}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Group gap="xs" mb={4}><Badge variant="light">{item.topic}</Badge><Badge color="gray" variant="light">{typeLabels[item.payload?.type] || item.payload?.type}</Badge></Group>
                                <div style={{ fontWeight: 500 }}><RichText>{item.text}</RichText></div>
                            </div>
                                <Group gap={6} wrap="nowrap">
                                    <Tooltip label="Додати до квізу" withArrow>
                                        <ActionIcon aria-label="Додати до квізу" color="teal" variant="light" size="lg" onClick={() => {
                                            addQuestionFromBank(item.payload);
                                            notifications.show({ color: 'green', message: 'Питання додано до квізу. Його можна редагувати у списку запитань.' });
                                        }}><IconPlus size={18} /></ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Історія використання" withArrow>
                                        <ActionIcon aria-label="Історія використання" color="blue" variant="light" size="lg" onClick={() => showUsage(item.id)}><IconHistory size={18} /></ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Видалити з банку" withArrow>
                                        <ActionIcon aria-label="Видалити з банку" color="red" variant="light" size="lg" onClick={() => remove(item.id)}><IconTrash size={18} /></ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                                <Stack gap={6}>
                                    {item.payload?.imageUrl && <Image src={item.payload.imageUrl} alt="Зображення питання" h={160} fit="contain" />}
                                    <Group gap={6}>
                                        <Badge size="sm" variant="light" color="gray">{item.folder}</Badge>
                                        <Badge size="sm" variant="light" color={item.difficulty === 'hard' ? 'red' : item.difficulty === 'easy' ? 'teal' : 'yellow'}>{{ easy: 'Легка', medium: 'Середня', hard: 'Складна' }[item.difficulty] || item.difficulty}</Badge>
                                        <Text size="xs" c="dimmed">{item.payload?.timeLimit} с · {item.payload?.points} балів</Text>
                                    </Group>
                                    {(item.tags || []).length > 0 && <Text size="xs" c="dimmed">Теги: {item.tags.join(', ')}</Text>}
                                    <Text size="xs" fw={600}>Відповіді</Text>
                                    <Group gap={6} align="flex-start">
                                        {(item.payload?.answers || []).map((answer, index) => <Text key={index} size="sm" px="xs" py={2} bg={item.payload.correctAnswers?.includes(index) ? 'teal.0' : 'gray.0'} c={item.payload.correctAnswers?.includes(index) ? 'teal.8' : undefined} style={{ borderRadius: 6, overflowWrap: 'anywhere', maxWidth: '100%' }}>{item.payload.correctAnswers?.includes(index) ? '✓ ' : ''}{answer}</Text>)}
                                        {item.payload?.type === 'matching' && (item.payload.matchingPairs || []).map((pair) => <Text key={pair.leftId} size="sm" px="xs" py={2} bg="gray.0" style={{ borderRadius: 6, overflowWrap: 'anywhere', maxWidth: '100%' }}>{pair.left} → {pair.right}</Text>)}
                                        {['ordering', 'fill_blank'].includes(item.payload?.type) && (item.payload.type === 'ordering' ? item.payload.orderingItems || [] : item.payload.fillBlankItems || []).map((entry, index) => <Text key={entry.id} size="sm" px="xs" py={2} bg="gray.0" style={{ borderRadius: 6, overflowWrap: 'anywhere', maxWidth: '100%' }}>{index + 1}. {entry.text}</Text>)}
                                    </Group>
                                </Stack>
                        </Paper>
                    ))}
                </Stack>
            ))}
        </Stack>
    );
};
