import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Group, Loader, Modal, Paper, Select, Stack, Tabs, Text, TextInput } from '@mantine/core';
import apiClient from '../../../api/apiClient.js';

const roles = [{ value: 'VIEWER', label: 'Перегляд і запуск' }, { value: 'EDITOR', label: 'Редагування і запуск' }];
const actions = { CREATED: 'Створено квіз', EDITED: 'Збережено зміни квізу', SHARED: 'Надано доступ', ROLE_CHANGED: 'Змінено роль', REVOKED: 'Відкликано доступ' };
const message = (error) => error.response?.data?.message || 'Не вдалося виконати дію. Спробуйте ще раз.';

export default function QuizSharingModal({ quiz, onClose }) {
    const [members, setMembers] = useState([]);
    const [history, setHistory] = useState([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('VIEWER');
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const owner = quiz?.accessRole === 'OWNER';

    useEffect(() => {
        if (!quiz) return;
        let active = true;
        setLoading(true); setError(''); setEmail(''); setRole('VIEWER'); setMembers([]); setHistory([]);
        Promise.all([
            apiClient.get(`/quizzes/${quiz.id}/history`),
            owner ? apiClient.get(`/quizzes/${quiz.id}/collaborators`) : Promise.resolve({ data: [] }),
        ]).then(([events, collaborators]) => {
            if (active) { setHistory(events.data); setMembers(collaborators.data); }
        }).catch((err) => { if (active) setError(message(err)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [quiz, owner]);

    const mutate = async (operation) => {
        setBusy(true); setError('');
        try {
            const result = await operation(); setMembers(result.data);
            setHistory((await apiClient.get(`/quizzes/${quiz.id}/history`)).data);
            return true;
        } catch (err) { setError(message(err)); return false; }
        finally { setBusy(false); }
    };

    return <Modal opened={Boolean(quiz)} onClose={onClose} title={`Спільна робота: ${quiz?.title || ''}`} size="lg">
        {error && <Alert color="red" mb="sm">{String(error)}</Alert>}
        {loading ? <Loader size="sm" /> : <Tabs defaultValue={owner ? 'access' : 'history'} key={quiz?.id}>
            <Tabs.List>
                {owner && <Tabs.Tab value="access">Доступ</Tabs.Tab>}
                <Tabs.Tab value="history">Історія змін</Tabs.Tab>
            </Tabs.List>
            {owner && <Tabs.Panel value="access" pt="md">
                <Stack gap="sm">
                    <Text size="sm">Викладач має бути зареєстрований у Quizzy з цією поштою. Квіз з’явиться в його кабінеті.</Text>
                    <Text size="xs" c="dimmed">Перегляд: питання, відповіді, історія змін і власні запуски для учнів. Редагування: додатково зміна квізу. Лише власник керує доступом і видаляє квіз. Викладач може окремо поділитися результатами завершеного сеансу з власником — кнопкою у звіті.</Text>
                    <form onSubmit={async (event) => {
                        event.preventDefault();
                        if (await mutate(() => apiClient.post(`/quizzes/${quiz.id}/collaborators`, { email: email.trim(), role }))) setEmail('');
                    }}>
                        <Stack gap="xs">
                            <TextInput label="Email викладача" type="email" required value={email} onChange={(event) => setEmail(event.currentTarget.value)} disabled={busy} />
                            <Group align="end">
                                <Select label="Права доступу" data={roles} value={role} onChange={setRole} allowDeselect={false} disabled={busy} style={{ flex: 1 }} />
                                <Button type="submit" loading={busy}>Надати доступ</Button>
                            </Group>
                        </Stack>
                    </form>
                    {!members.length && <Text size="sm" c="dimmed">Доступ поки має лише власник.</Text>}
                    {members.map((member) => <Paper key={member.userId} withBorder p="sm">
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>{member.name} · {member.email}</Text>
                            <Group>
                                <Select aria-label={`Роль ${member.email}`} data={roles} value={member.role} allowDeselect={false} disabled={busy}
                                    onChange={(value) => mutate(() => apiClient.post(`/quizzes/${quiz.id}/collaborators`, { email: member.email, role: value }))} style={{ flex: 1 }} />
                                <Button size="xs" variant="subtle" color="red" disabled={busy} onClick={() => mutate(() => apiClient.delete(`/quizzes/${quiz.id}/collaborators/${member.userId}`))}>Відкликати</Button>
                            </Group>
                        </Stack>
                    </Paper>)}
                </Stack>
            </Tabs.Panel>}
            <Tabs.Panel value="history" pt="md">
                <Stack gap="sm">
                    <Text size="xs" c="dimmed">Останні 100 подій. Історія записується з моменту додавання цієї функції.</Text>
                    {!history.length && <Text size="sm">Змін ще немає.</Text>}
                    {history.map((event) => <Paper key={event.id} withBorder p="sm">
                        <Group justify="space-between"><Badge variant="light">{actions[event.action] || event.action}</Badge><Text size="xs" c="dimmed">{new Date(event.createdAt).toLocaleString('uk-UA')}</Text></Group>
                        <Text size="sm" mt={4}>{event.actorName || 'Видалений користувач'}</Text>
                        {event.details.member && <Text size="sm">{event.details.member}{event.details.role ? ` — ${roles.find((item) => item.value === event.details.role)?.label}` : ''}</Text>}
                        {event.details.title && <Text size="sm">{event.details.title} · питань: {event.details.questionCount}</Text>}
                        {event.details.previousTitle && event.details.previousTitle !== event.details.title && <Text size="xs" c="dimmed">Попередня назва: {event.details.previousTitle}</Text>}
                    </Paper>)}
                </Stack>
            </Tabs.Panel>
        </Tabs>}
    </Modal>;
}
