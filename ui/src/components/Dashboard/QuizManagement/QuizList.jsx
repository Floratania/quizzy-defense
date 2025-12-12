import {
    ActionIcon,
    Avatar,
    Box,
    Button,
    Card,
    Grid,
    Group,
    Menu,
    Stack,
    Table,
    Text,
    Title
} from "@mantine/core";
import {
    IconDots,
    IconEdit,
    IconEye,
    IconList,
    IconPlayerPlay,
    IconPlus,
    IconTrash,
    IconTrophy,
    IconUsers
} from "@tabler/icons-react";
import React from "react";
import { useQuizzes } from "../../../hooks/useQuizzes.js";
import { useSession } from "../../../hooks/useSession.js";
import { useNavigate } from "react-router";

export default function QuizList() {


    const { quizzes, deleteQuiz } = useQuizzes();
    const navigate = useNavigate();

    // ----- ACTIONS -----

    const handleCreateQuiz = () => {
        navigate("/admin/quizzes/new");
    };

    const handleEditQuiz = (quiz) => {
        navigate(`/admin/quizzes/${quiz.id}/edit`);
    };

    const handleDeleteQuizClick = (id) => {
        deleteQuiz(id);
    };

    const handleStartSession = async (quizId) => {
        navigate(`/host/${quizId}`);
    };

    return (
        <Stack gap="xl">
            {/* Stats Cards */}
            <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Всі Вікторини
                                </Text>
                                <Text size="xl" fw={700}>{quizzes.length}</Text>
                            </Box>
                            <Avatar color="blue" variant="light" size="lg">
                                <IconList size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Активні
                                </Text>
                                <Text size="xl" fw={700}>{15}</Text>
                            </Box>
                            <Avatar color="teal" variant="light" size="lg">
                                <IconPlayerPlay size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Усього Проходжень
                                </Text>
                                <Text size="xl" fw={700}>{100}</Text>
                            </Box>
                            <Avatar color="violet" variant="light" size="lg">
                                <IconUsers size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    Середній Результат
                                </Text>
                                <Text size="xl" fw={700}>{12}%</Text>
                            </Box>
                            <Avatar color="orange" variant="light" size="lg">
                                <IconTrophy size={24}/>
                            </Avatar>
                        </Group>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Quiz List */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                    <Title order={3}>Мої Вікторини</Title>
                    <Button
                        leftSection={<IconPlus size={16}/>}
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'violet' }}
                        onClick={handleCreateQuiz}
                    >
                        Створити Вікторину
                    </Button>
                </Group>

                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Назва</Table.Th>
                            <Table.Th>Створено</Table.Th>
                            <Table.Th>Дії</Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {quizzes.map((quiz) => (
                            <Table.Tr key={quiz.id}>
                                <Table.Td>
                                    <Text fw={600}>{quiz.title}</Text>
                                </Table.Td>

                                <Table.Td>
                                    <Text size="sm" c="dimmed">{quiz.createdAt}</Text>
                                </Table.Td>

                                <Table.Td>
                                    <Group gap="xs">

                                        <ActionIcon
                                            variant="light"
                                            color="blue"
                                            onClick={() => handleStartSession(quiz.id)}
                                        >
                                            <IconPlayerPlay size={16}/>
                                        </ActionIcon>

                                        <ActionIcon
                                            variant="light"
                                            color="blue"
                                            onClick={() => handleEditQuiz(quiz)}
                                        >
                                            <IconEdit size={16}/>
                                        </ActionIcon>

                                        <Menu position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon variant="light">
                                                    <IconDots size={16}/>
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={16}/>}>
                                                    Preview
                                                </Menu.Item>

                                                <Menu.Divider/>

                                                <Menu.Item
                                                    color="red"
                                                    leftSection={<IconTrash size={16}/>}
                                                    onClick={() => handleDeleteQuizClick(quiz.id)}
                                                >
                                                    Delete
                                                </Menu.Item>
                                            </Menu.Dropdown>

                                        </Menu>

                                    </Group>
                                </Table.Td>

                            </Table.Tr>
                        ))}
                    </Table.Tbody>

                </Table>
            </Card>
        </Stack>
    );
}
