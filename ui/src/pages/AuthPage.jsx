import {beginGoogleSignIn} from '../auth/browserSession.js';
import React, { useState } from 'react';
import {
    Container,
    Paper,
    Title,
    Text,
    TextInput,
    PasswordInput,
    Button,
    Group,
    Stack,
    Anchor,
    Divider,
    Center,
    Transition,
} from '@mantine/core';
import {  IconBrandGoogle, IconMail, IconUser, IconLock } from '@tabler/icons-react';
import useAuth from "../hooks/useAuth.js";


const AuthPage = () => {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [submitting, setSubmitting] = useState(false);


    const isLogin = mode === 'login';

    const { login, register } = useAuth();

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                });
                await login(formData.email, formData.password);
            }

            window.location.href = '/';
        } catch (err) {
            setSubmitting(false);
            console.error(err);
            alert(err?.response?.data?.message || "Something went wrong");
        }
    };


    return (
        <Container size="sm" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
            <Center mb="xl">
                <Stack gap="xs" align="center">
                    <Title order={1} style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        {isLogin ? 'З поверненням!' : 'Приєднатись до Quizzy'}
                    </Title>
                    <Text c="dimmed" size="sm" ta="center" maw={400}>
                        {isLogin
                            ? 'Увійдіть, щоб продовжити користування сервісом'
                            : 'Новий акаунт має роль учня. Викладачі подають заявку на підтвердження в особистому кабінеті.'}
                    </Text>
                </Stack>
            </Center>

            {new URLSearchParams(window.location.search).has('loginError')&&<Text c="red" mb="md">Перевірте email і пароль та спробуйте увійти ще раз.</Text>}
            <Paper
                radius="xl"
                p={40}
                style={{
                    background: 'white',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                }}
            >
                <Stack gap="lg">
                    <Group grow>
                        <Button
                            onClick={() => (beginGoogleSignIn())}
                            variant="light"
                            color="violet"
                            leftSection={<IconBrandGoogle size={18} />}
                            radius="md"
                            size="md"
                            styles={{
                                root: {
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                    }
                                }
                            }}
                        >
                            Google
                        </Button>
                    </Group>

                    <Divider
                        label={
                            <Text size="sm" c="dimmed" fw={500}>
                                або скористайтеся поштою
                            </Text>
                        }
                        labelPosition="center"
                    />

                    <Stack gap="md">
                        <Transition
                            mounted={!isLogin}
                            transition="slide-down"
                            duration={200}
                            timingFunction="ease"
                        >
                            {(styles) => (
                                <div style={styles}>
                                    <TextInput
                                        label="Псевдонім"
                                        placeholder="griotte"
                                        leftSection={<IconUser size={18} stroke={1.5} />}
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        radius="md"
                                        size="md"
                                        styles={{
                                            input: {
                                                borderColor: 'rgba(102, 126, 234, 0.3)',
                                                '&:focus': {
                                                    borderColor: '#667eea',
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </Transition>

                        <TextInput
                            label="Email"
                            placeholder="your@email.com"
                            leftSection={<IconMail size={18} stroke={1.5} />}
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            radius="md"
                            size="md"
                            styles={{
                                input: {
                                    borderColor: 'rgba(102, 126, 234, 0.3)',
                                    '&:focus': {
                                        borderColor: '#667eea',
                                    }
                                }
                            }}
                        />

                        <PasswordInput
                            label="Пароль"
                            placeholder="••••••••"
                            leftSection={<IconLock size={18} stroke={1.5} />}
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            radius="md"
                            size="md"
                            styles={{
                                input: {
                                    borderColor: 'rgba(102, 126, 234, 0.3)',
                                    '&:focus': {
                                        borderColor: '#667eea',
                                    }
                                }
                            }}
                        />

                        {isLogin && (
                            <Group justify="flex-end">
                                <Anchor
                                    size="sm"
                                    c="violet"
                                    underline="never"
                                    fw={500}
                                >
                                    Забули пароль?
                                </Anchor>
                            </Group>
                        )}

                        <Button
                            loading={submitting}
                            disabled={submitting}
                            onClick={handleSubmit}
                            fullWidth
                            radius="md"
                            size="lg"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                marginTop: '0.5rem',
                                transition: 'all 0.2s',
                            }}
                            styles={{
                                root: {
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                    }
                                }
                            }}
                        >
                            {isLogin ? 'Увійти' : 'Зареєструватися'}
                        </Button>
                    </Stack>
                </Stack>

                <Center mt="xl">
                    <Text size="sm" c="dimmed">
                        {isLogin ? "Вперше тут? " : 'Маєте акаунт? '}
                        <Anchor
                            size="sm"
                            component="button"
                            type="button"
                            c="violet"
                            fw={600}
                            underline="never"
                            onClick={() => {
                                setMode(isLogin ? 'register' : 'login');
                                setFormData({ name: '', email: '', password: '' });
                            }}
                        >
                            {isLogin ? 'Зареєструватися' : 'Увійти'}
                        </Anchor>
                    </Text>
                </Center>
            </Paper>
        </Container>
    );
};

export default AuthPage;