import { Badge, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCrown, IconSwords, IconTrophy } from '@tabler/icons-react';

const stageNames = {
    QUALIFICATION: 'Відбірковий раунд',
    SEMIFINAL: 'Півфінал',
    FINAL: 'Фінал',
};

export default function TournamentBoard({ state, compact = false }) {
    if (!state) return null;
    return (
        <Paper shadow="md" radius="xl" p={compact ? 'md' : 'xl'} withBorder>
            <Group justify="space-between" mb="md">
                <Group>
                    <ThemeIcon color={state.champion ? 'yellow' : 'violet'} variant="light" size="lg">
                        {state.champion ? <IconCrown size={22} /> : <IconTrophy size={22} />}
                    </ThemeIcon>
                    <div>
                        <Title order={compact ? 4 : 2}>{state.champion ? 'Турнір завершено' : stageNames[state.stage]}</Title>
                        {!state.champion && <Text size="sm" c="dimmed">Питання етапу {state.stageQuestionIndex} із {state.stageQuestionCount} · Загалом {state.questionIndex} із {state.totalQuestions}</Text>}
                    </div>
                </Group>
                <Badge color="violet" size="lg">{state.activeTeamIds?.length || 0} команд</Badge>
            </Group>

            {state.champion ? (
                <Paper p="lg" radius="lg" bg="yellow.0" ta="center">
                    <IconCrown size={42} color="#e6a700" />
                    <Title order={2}>{state.champion.name}</Title>
                    <Text fw={700}>{state.champion.totalScore} балів</Text>
                </Paper>
            ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {state.matches?.map((match) => (
                        <Paper key={match.id} withBorder radius="md" p="md">
                            <Group justify="center" mb="xs"><IconSwords size={18} /><Text fw={700}>Матч</Text></Group>
                            <Stack gap="xs">
                                {[match.home, match.away].map((team) => (
                                    <Group key={team.id} justify="space-between">
                                        <Text fw={600}>{team.name}</Text><Badge variant="light">{team.totalScore}</Badge>
                                    </Group>
                                ))}
                            </Stack>
                        </Paper>
                    ))}
                </SimpleGrid>
            )}
        </Paper>
    );
}
