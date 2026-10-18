import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Grid, Group, Image, Paper, Stack, Text, TextInput } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import { usePlayerGameContext } from '../../context/PlayerGameContext.jsx';
import { PlayerAnswerGrid } from '../../pages/PlayerAnswerGrid.jsx';
import { TimerBadge } from '../Question/TimerBadge.jsx';
import RichText from '../Question/RichText.jsx';

export const QuestionScreen = ({ question }) => {
    const { submitAnswer } = usePlayerGameContext();
    const [submitted, setSubmitted] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [text, setText] = useState('');
    const [matches, setMatches] = useState({});
    const [draggedRightId, setDraggedRightId] = useState(null);
    const [order, setOrder] = useState(question.configuration?.items || []);
    const [draggedOrderId, setDraggedOrderId] = useState(null);
    const [draggedBlankId, setDraggedBlankId] = useState(null);
    const [blankPlacements, setBlankPlacements] = useState({});
    const rightById = useMemo(
        () => Object.fromEntries((question.configuration?.rightItems || []).map((item) => [item.id, item])),
        [question],
    );

    const send = (payload) => {
        if (submitted) return;
        setSubmitted(true);
        submitAnswer(payload);
    };

    useEffect(() => {
        if (question.practice) return;
        const timeout = window.setTimeout(() => {
            setSubmitted((alreadySubmitted) => {
                if (!alreadySubmitted) submitAnswer({ response: { timedOut: true } });
                return true;
            });
        }, question.endsAt ? Math.max(0, question.endsAt - Date.now()) : Math.max(1, Number(question.timeLimit) || 30) * 1000);
        return () => window.clearTimeout(timeout);
    }, [question.id, question.timeLimit, question.endsAt, question.practice, submitAnswer]);

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
        return (
            <InteractiveShell
                title={question.text}
                imageUrl={question.mediaUrl}
                hint={question.type === 'true_false' ? 'Оберіть правильне твердження' : 'Оберіть одну правильну відповідь'}
                endsAt={question.endsAt} timeLimit={question.practice ? null : question.timeLimit}
            >
                <Box maw={820} w="100%" mx="auto">
                    <PlayerAnswerGrid
                        compact
                        answers={question.answers}
                        selectedAnswer={selectedAnswer}
                        onSelect={(answerId) => { setSelectedAnswer(answerId); send({ answerId }); }}
                    />
                </Box>
            </InteractiveShell>
        );
    }

    if (question.type === 'multiple_response') {
        const toggleAnswer = (answerId) => setSelectedAnswers((current) =>
            current.includes(answerId) ? current.filter((id) => id !== answerId) : [...current, answerId]
        );
        return (
            <InteractiveShell title={question.text} imageUrl={question.mediaUrl} hint="Оберіть усі правильні варіанти" endsAt={question.endsAt} timeLimit={question.practice ? null : question.timeLimit}>
                <Grid>
                    {question.answers.map((answer) => {
                        const selected = selectedAnswers.includes(answer.id);
                        return (
                            <Grid.Col key={answer.id} span={12}>
                                <Paper
                                    withBorder p="sm" radius="md"
                                    onClick={() => !submitted && toggleAnswer(answer.id)}
                                    style={{ cursor: 'pointer', borderColor: selected ? '#343a40' : undefined, background: selected ? '#e9ecef' : undefined }}
                                >
                                    {answer.imageUrl && <Image src={answer.imageUrl} alt={answer.text} radius="sm" h={120} fit="contain" mb="sm" />}
                                    <Group><Badge color={'gray'}>{selected ? '✓' : '○'}</Badge><Text fw={600}>{answer.text}</Text></Group>
                                </Paper>
                            </Grid.Col>
                        );
                    })}
                </Grid>
                <Button size="md" disabled={selectedAnswers.length === 0 || submitted} onClick={() => send({ response: { answerIds: selectedAnswers } })}>
                    Підтвердити вибір
                </Button>
            </InteractiveShell>
        );
    }

    if (question.type === 'fill_blank') {
        const textParts = question.text.split('___');
        const words = question.configuration?.items || [];
        const wordById = Object.fromEntries(words.map((word) => [word.id, word]));
        const usedWordIds = new Set(Object.values(blankPlacements));
        const placeWord = (blankIndex, wordId) => {
            if (!wordId || submitted) return;
            setBlankPlacements((current) => {
                const withoutDuplicate = Object.fromEntries(Object.entries(current).filter(([, placedId]) => placedId !== wordId));
                return { ...withoutDuplicate, [blankIndex]: wordId };
            });
        };
        const placeInFirstEmpty = (wordId) => {
            const blankCount = textParts.length - 1;
            const firstEmpty = Array.from({ length: blankCount }, (_, index) => index)
                .find((index) => !blankPlacements[index]);
            if (firstEmpty !== undefined) placeWord(firstEmpty, wordId);
        };
        return (
            <InteractiveShell title="Вставте пропущене слово" imageUrl={question.mediaUrl} hint="Перетягніть варіант у пропуск" endsAt={question.endsAt} timeLimit={question.practice ? null : question.timeLimit}>
                <Paper withBorder radius="lg" p="xl">
                    <Group justify="center" gap="sm" wrap="wrap">
                        {textParts.map((part, index) => {
                            const selectedWord = wordById[blankPlacements[index]];
                            return (
                                <React.Fragment key={index}>
                                    <Text size="xl" fw={600}>{part}</Text>
                                    {index < textParts.length - 1 && (
                                        <Paper
                                            withBorder p="sm" miw={140} ta="center"
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={() => placeWord(index, draggedBlankId)}
                                            onClick={() => selectedWord && !submitted && setBlankPlacements((current) => {
                                                const next = { ...current }; delete next[index]; return next;
                                            })}
                                            style={{ cursor: selectedWord ? 'pointer' : 'default', borderStyle: 'dashed', borderColor: selectedWord ? '#40c057' : '#7950f2', background: selectedWord ? '#ebfbee' : '#f3f0ff' }}
                                        >
                                            <Text fw={700} c={selectedWord ? 'green' : 'dimmed'}>{selectedWord?.text || `Пропуск ${index + 1}`}</Text>
                                        </Paper>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </Group>
                </Paper>
                <Group justify="center">
                    {words.map((answer) => (
                        <Paper
                            key={answer.id}
                            draggable={!submitted}
                            onDragStart={() => setDraggedBlankId(answer.id)}
                            onClick={() => placeInFirstEmpty(answer.id)}
                            withBorder
                            radius="md"
                            p="md"
                            style={{ cursor: 'grab', opacity: usedWordIds.has(answer.id) ? 0.4 : 1 }}
                        >
                            <Group gap="xs"><IconGripVertical size={18}/><Text fw={600}>{answer.text}</Text></Group>
                        </Paper>
                    ))}
                </Group>
                <Button
                    size="lg"
                    disabled={Object.keys(blankPlacements).length !== textParts.length - 1 || submitted}
                    onClick={() => send({ response: { order: Array.from({ length: textParts.length - 1 }, (_, index) => blankPlacements[index]) } })}
                >
                    Підтвердити відповідь
                </Button>
            </InteractiveShell>
        );
    }

    if (question.type === 'open_text') {
        return (
            <InteractiveShell title={question.text} imageUrl={question.mediaUrl} endsAt={question.endsAt} timeLimit={question.practice ? null : question.timeLimit}>
                <TextInput size="xl" label="Ваша відповідь" value={text} onChange={(event) => setText(event.target.value)} disabled={submitted} />
                <Button size="md" disabled={!text.trim() || submitted} onClick={() => send({ response: { text } })}>Надіслати відповідь</Button>
            </InteractiveShell>
        );
    }

    if (question.type === 'matching') {
        const leftItems = question.configuration?.leftItems || [];
        const used = new Set(Object.values(matches));
        return (
            <InteractiveShell title={question.text} imageUrl={question.mediaUrl} hint="Перетягніть праву картку до відповідної лівої" endsAt={question.endsAt} timeLimit={question.practice ? null : question.timeLimit}>
                <Group align="flex-start" grow>
                    <Stack>
                        {leftItems.map((left) => (
                            <Paper key={left.id} withBorder p="md" onDragOver={(event) => event.preventDefault()}
                                   onDrop={() => draggedRightId && setMatches((current) => {
                                       const unique = Object.fromEntries(Object.entries(current).filter(([, rightId]) => rightId !== draggedRightId));
                                       return { ...unique, [left.id]: draggedRightId };
                                   })}
                                   style={{ borderColor: matches[left.id] ? '#40c057' : '#ced4da' }}>
                                <Text fw={600}>{left.text}</Text>
                                <Text c={matches[left.id] ? 'green' : 'dimmed'} mt="xs">
                                    {matches[left.id] ? rightById[matches[left.id]]?.text : 'Перетягніть сюди відповідь'}
                                </Text>
                            </Paper>
                        ))}
                    </Stack>
                    <Stack>
                        {(question.configuration?.rightItems || []).map((right) => (
                            <Paper key={right.id} draggable={!submitted} onDragStart={() => setDraggedRightId(right.id)} p="md" withBorder
                                   style={{ cursor: 'grab', opacity: used.has(right.id) ? 0.45 : 1 }}>
                                <Group><IconGripVertical size={18} /><Text>{right.text}</Text></Group>
                            </Paper>
                        ))}
                    </Stack>
                </Group>
                <Button size="md" disabled={Object.keys(matches).length !== leftItems.length || submitted}
                        onClick={() => send({ response: { matches: Object.entries(matches).map(([leftId, rightId]) => ({ leftId, rightId })) } })}>
                    Перевірити пари
                </Button>
            </InteractiveShell>
        );
    }

    if (question.type === 'ordering') {
        const moveBefore = (targetId) => {
            if (!draggedOrderId || draggedOrderId === targetId) return;
            setOrder((current) => {
                const dragged = current.find((item) => item.id === draggedOrderId);
                if (!dragged) return current;
                const without = current.filter((item) => item.id !== draggedOrderId);
                const targetIndex = without.findIndex((item) => item.id === targetId);
                without.splice(targetIndex, 0, dragged);
                return without;
            });
        };
        return (
            <InteractiveShell title={question.text} imageUrl={question.mediaUrl} hint="Перетягніть елементи у правильний порядок" endsAt={question.endsAt} timeLimit={question.practice ? null : question.timeLimit}>
                <Stack>
                    {order.map((item, index) => (
                        <Paper key={item.id} draggable={!submitted} onDragStart={() => setDraggedOrderId(item.id)}
                               onDragOver={(event) => event.preventDefault()} onDrop={() => moveBefore(item.id)} p="md" withBorder style={{ cursor: 'grab' }}>
                            <Group><Badge>{index + 1}</Badge><IconGripVertical size={18} /><Text>{item.text}</Text></Group>
                        </Paper>
                    ))}
                </Stack>
                <Button size="md" disabled={submitted} onClick={() => send({ response: { order: order.map((item) => item.id) } })}>Перевірити порядок</Button>
            </InteractiveShell>
        );
    }

    return null;
};

function InteractiveShell({ title, imageUrl, hint, timeLimit, endsAt, children }) {
    return (
        <Box p={timeLimit === null ? 0 : { base: "sm", sm: "lg" }} style={{ minHeight: timeLimit === null ? undefined : '100vh', background: timeLimit === null ? 'transparent' : '#f8f9fa' }}>
            <Paper maw={900} w="100%" mx="auto" p="md" radius="md" withBorder>
                <Stack gap="sm">
                    <Group justify="space-between"><div style={{flex:1,minWidth:0}}><RichText>{title}</RichText></div>{timeLimit === null ? <Text size="xs" c="dimmed">Без таймера</Text> : <TimerBadge timeLimit={timeLimit} endsAt={endsAt} />}</Group>
                    {imageUrl && <Image src={imageUrl} alt={title} radius="md" mah={300} fit="contain" fallbackSrc="https://placehold.co/800x300?text=Фото+недоступне" />}
                    {hint && <Text c="dimmed">{hint}</Text>}{children}
                </Stack>
            </Paper>
        </Box>
    );
}
