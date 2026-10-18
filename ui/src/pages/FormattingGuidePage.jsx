import { useState, useEffect } from 'react';
import { Anchor, Badge, Button, Code, Container, CopyButton, Grid, Group, Paper, Stack, Text, Textarea, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import RichText from '../components/Question/RichText.jsx';

const examples = [
    { id: 'text', title: 'Текст і списки', hint: 'Символи розмітки ставте без пробілів біля тексту. Для нового абзацу залиште порожній рядок.', items: [
        ['Виділення', '**Важливе поняття** та *пояснення курсивом*.'],
        ['Заголовок', '### Умова задачі\n\nПрочитайте текст і виберіть відповідь.'],
        ['Список', '- Перший варіант\n- Другий варіант\n\n1. Прочитайте умову\n2. Обчисліть результат'],
    ] },
    { id: 'math', title: 'Математичні формули', hint: 'У рядку обгорніть формулу в $...$. Для окремого блока використовуйте $$ на окремих рядках. Усередині пишіть синтаксис LaTeX, який підтримує KaTeX.', items: [
        ['Формула в реченні', 'Обчисліть $x^2 + 2x + 1$, якщо $x = 3$.'],
        ['Індекси та степені', String.raw`Послідовність $a_1, a_2, a_n$ і вираз $x^{12} + y_{n+1}$.`],
        ['Дроби та корені', String.raw`$$
\frac{a+b}{c} + \sqrt{x} + \sqrt[3]{8}
$$`],
        ['Грецькі літери та знаки', String.raw`$\alpha + \beta = \pi$, $x \leq 5$, $y \neq 0$, $a \cdot b$, $6 \times 7$.`],
        ['Суми', String.raw`$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$`],
        ['Матриця', String.raw`$$
\begin{pmatrix}
1 & 2 \\
3 & 4
\end{pmatrix}
$$`],
    ] },
    { id: 'code', title: 'Програмний код', hint: 'Для короткого фрагмента використовуйте одну зворотну лапку. Блок починайте й закінчуйте трьома зворотними лапками, кожного разу з нового рядка. Після початкових лапок можна вказати мову.', items: [
        ['Код у реченні', 'Що поверне виклик `Math.max(2, 5)`?'],
        ['JavaScript', 'Що виведе програма?\n\n```javascript\nconst numbers = [1, 2, 3];\nconsole.log(numbers.map(n => n * 2));\n```'],
        ['Python', 'Знайдіть значення змінної.\n\n```python\nresult = sum(range(1, 5))\nprint(result)\n```'],
    ] },
    { id: 'blanks', title: 'Текст із пропусками', hint: 'Це окремий тип питання. Виберіть «Вставити пропущене слово». У тексті має бути від 2 до 8 позначок ___ і стільки ж слів у налаштуваннях. Слова задавайте в порядку пропусків.', items: [
        ['Умова', 'Навесні ___ світить яскравіше, а ___ стають довшими.'],
    ] },
];

function Example({ title, source }) {
    return <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" mb="md">
            <Text fw={600}>{title}</Text>
            <CopyButton value={source}>{({ copied, copy }) => <Button size="xs" variant="light" color={copied ? 'teal' : 'blue'} onClick={copy}>{copied ? 'Скопійовано' : 'Копіювати приклад'}</Button>}</CopyButton>
        </Group>
        <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 6 }}><Text size="sm" c="dimmed" mb="xs">Що вводити</Text><Code block style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{source}</Code></Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}><Text size="sm" c="dimmed" mb="xs">Як виглядатиме</Text><RichText>{source}</RichText></Grid.Col>
        </Grid>
    </Paper>;
}

export default function FormattingGuidePage() {
    const [draft, setDraft] = useState('### Спробуйте самі\n\nОбчисліть $\\frac{1}{2} + \\frac{1}{4}$.\n\n**Підказка:** знайдіть спільний знаменник.');
    const [savedDraft, setSavedDraft] = useState(() => {
        try { return localStorage.getItem('quizzy-formatting-draft') ?? draft; }
        catch { return draft; }
    });
    useEffect(() => {
        try { localStorage.setItem('quizzy-formatting-draft', savedDraft); } catch { /* Storage may be disabled. */ }
    }, [savedDraft]);
    return <Container size="lg" py="xl">
        <Stack gap="xl">
            <div><Badge variant="light" mb="sm">Довідка Quizzy</Badge><Title order={1}>Як оформлювати питання</Title><Text c="dimmed" mt="sm">Приклади Markdown, формул і програмного коду. Скопіюйте потрібний приклад у поле «Питання» та замініть текст.</Text></div>
            <Group gap="lg">{examples.map(({ id, title }) => <Anchor key={id} href={`#${id}`}>{title}</Anchor>)}<Anchor href="#practice">Спробувати</Anchor></Group>
            {examples.map((section) => <Stack gap="md" key={section.id} id={section.id} style={{ scrollMarginTop: 24 }}>
                <Title order={2}>{section.title}</Title><Text>{section.hint}</Text>
                {section.items.map(([title, source]) => <Example key={title} title={title} source={source} />)}
                {section.id === 'blanks' && <Text size="sm" c="dimmed">У цьому прикладі правильні слова: «сонце», «дні». Позначки залишаються текстом у довідці, а у грі стають місцями для перетягування.</Text>}
            </Stack>)}
            <Paper withBorder p="lg" radius="md" id="practice">
                <Title order={2} mb="sm">Спробуйте форматування</Title>
                <Text c="dimmed" mb="md">Чернетка автоматично зберігається в цьому браузері. Вона не створює питання в тесті.</Text>
                <Group mb="md"><CopyButton value={savedDraft}>{({ copied, copy }) => <Button variant="light" onClick={copy}>{copied ? 'Скопійовано' : 'Копіювати чернетку'}</Button>}</CopyButton><Button variant="subtle" onClick={() => { setSavedDraft(draft); setDraft(draft); }}>Відновити приклад</Button></Group>
                <Grid><Grid.Col span={{ base: 12, md: 6 }}><Textarea label="Ваш текст" value={savedDraft} onChange={(event) => setSavedDraft(event.currentTarget.value)} minRows={10} maxLength={10000} /></Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}><Text fw={500} mb="sm">Попередній перегляд</Text><RichText>{savedDraft}</RichText></Grid.Col></Grid>
            </Paper>
            <Paper withBorder p="lg" radius="md"><Title order={2} mb="md">Якщо щось не відображається</Title>
                <Stack gap="sm"><Text>Перевірте, чи закриті обидва символи $ та всі фігурні дужки. Для складного індексу або степеня використовуйте дужки: <Code>{'x^{12}'}</Code>.</Text>
                    <Text>Перед формулою-командою потрібна зворотна риска: <Code>{String.raw`\frac{1}{2}`}</Code>. У полі редактора вводьте одну риску.</Text>
                    <Text>Блок коду має починатися й закінчуватися окремим рядком із трьома зворотними лапками. Для звичайного тексту поза формулою символ долара можна екранувати: <Code>{String.raw`\$`}</Code>.</Text>
                    <Text>HTML, JavaScript і повні LaTeX-документи не виконуються. Формули обчислення не виконують: правильну відповідь потрібно задати окремо в редакторі.</Text>
                    <Text>Зображення додавайте кнопкою «Додати фото». Наведене форматування призначене для тексту питання. Перевірте результат у попередньому перегляді та пробному проходженні.</Text>
                </Stack>
            </Paper>
            <Anchor component={Link} to="/admin/quizzes">До моїх вікторин</Anchor>
        </Stack>
    </Container>;
}
