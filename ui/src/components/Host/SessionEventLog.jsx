import { useMemo, useState } from 'react';
import { Accordion, Group, Select, Table, Text } from '@mantine/core';

const labels = { JOINED: 'Приєднався', DISCONNECTED: 'Зв’язок втрачено', RECONNECTED: 'Повернувся', TAB_HIDDEN: 'Згортання / вихід із вкладки', FOCUS_LOST: 'Втрата фокуса сторінки' };
export default function SessionEventLog({ events = [] }) {
    const [playerId, setPlayerId] = useState(null);
    const players = useMemo(() => [...new Map(events.map((event) => [event.playerId, { value: event.playerId, label: event.nickname }])).values()], [events]);
    const visible = playerId ? events.filter((event) => event.playerId === playerId) : events;
    return <Accordion variant="separated" my="md"><Accordion.Item value="events"><Accordion.Control>Журнал подій сесії ({events.length})</Accordion.Control><Accordion.Panel>
        <Group mb="md"><Select label="Учень" placeholder="Усі учні" clearable searchable data={players} value={playerId} onChange={setPlayerId} /><Text size="xs" c="dimmed">Останні 200 подій, нові зверху. Час вашого браузера.</Text></Group>
        <Table.ScrollContainer minWidth={450}><Table><Table.Thead><Table.Tr><Table.Th>Час</Table.Th><Table.Th>Учень</Table.Th><Table.Th>Подія</Table.Th></Table.Tr></Table.Thead><Table.Tbody>
            {visible.map((event) => <Table.Tr key={event.id}><Table.Td>{new Date(event.createdAt).toLocaleString('uk-UA')}</Table.Td><Table.Td>{event.nickname}</Table.Td><Table.Td>{labels[event.type] || event.type}</Table.Td></Table.Tr>)}
        </Table.Tbody></Table></Table.ScrollContainer>
        {!visible.length && <Text c="dimmed" size="sm">Подій ще немає.</Text>}
    </Accordion.Panel></Accordion.Item></Accordion>;
}
