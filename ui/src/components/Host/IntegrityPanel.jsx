import { Badge, Group, Paper, Stack, Text } from '@mantine/core';

export default function IntegrityPanel({ players, enabled }) {
    const total = players.reduce((sum, player) => sum + (player.integrityEvents || 0), 0);
    return <Paper withBorder radius="md" p="md" my="md">
        <Group justify="space-between"><Text fw={600}>Виходи з вкладки</Text><Badge color={total ? 'orange' : 'gray'}>Усього: {total}</Badge></Group>
        <Badge variant="light" color={enabled ? 'teal' : 'gray'} my="xs">{enabled ? 'Облік увімкнено' : 'Облік вимкнено'}</Badge>
        <Text size="xs" c="dimmed" mb="sm">{enabled ? 'Фіксуються під час гри, коли вкладка учня стає прихованою. Це сигнал для перевірки, а не доказ списування.' : 'Для підрахунку ввімкніть «Фіксувати виходи з вкладки» в налаштуваннях тесту та запустіть нову сесію. Зміни тесту не змінюють налаштування вже відкритої сесії.'}</Text>
        {players.length === 0 && <Text size="sm" c="dimmed">Після приєднання учнів тут з’являться їхні лічильники.</Text>}
        <Stack gap="xs">{players.map((player) => <Group key={player.id} justify="space-between"><Text size="sm">{player.nickname}</Text><Badge color={player.integrityEvents ? 'orange' : 'gray'}>{player.integrityEvents || 0}</Badge></Group>)}</Stack>
    </Paper>;
}
