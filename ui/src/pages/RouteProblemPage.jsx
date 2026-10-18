import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

function Problem({ notFound = false }) {
    return <Container size="sm" py="xl"><Paper withBorder p="xl" radius="md"><Stack>
        <Title order={2}>{notFound ? 'Сторінку не знайдено' : 'Не вдалося відкрити сторінку'}</Title>
        <Text>{notFound ? 'Перевір посилання або перейди на головну. Для участі в тесті можна ввести код кімнати.' : 'Спробуй оновити сторінку. Якщо помилка повторюється, повернися на головну.'}</Text>
        <Group><Button component={Link} to="/">На головну</Button><Button component={Link} to="/join" variant="light">Приєднатися до тесту</Button>{!notFound && <Button variant="subtle" onClick={() => window.location.reload()}>Оновити</Button>}</Group>
    </Stack></Paper></Container>;
}
export function NotFoundPage() { return <Problem notFound />; }
export function RouteErrorPage() {
    const error = useRouteError();
    return <Problem notFound={isRouteErrorResponse(error) && error.status === 404} />;
}
