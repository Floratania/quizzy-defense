import React from 'react';
import { Box, Stack, Grid, Loader, Center } from '@mantine/core';
import {QuizProvider, useQuizContext} from "../../../context/QuizContext.jsx";
import {QuizHeader} from "./NewQuiz/QuizHeader.jsx";
import {QuizBasicInfo} from "./NewQuiz/QuizBasicInfo.jsx";
import {QuestionsList} from "./NewQuiz/QuestionsList.jsx";
import {AddQuestionForm} from "./NewQuiz/AddQuestionForm.jsx";
import {QuizSummary} from "./NewQuiz/QuizSummary.jsx";
import {AiQuizGenerator} from './NewQuiz/AiQuizGenerator.jsx';
import {QuestionBank} from './NewQuiz/QuestionBank.jsx';

export default function CreateEditQuizPage() {
    return <QuizProvider><QuizEditorContent /></QuizProvider>;
}

function QuizEditorContent() {
    const { loading } = useQuizContext();
    if (loading) return <Center mih={250}><Loader /></Center>;
    return (
            <Box
                style={{
                    minHeight: "100vh",
                    // background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                    padding: "2rem"
                }}
            >
                <Stack gap="xl" style={{ maxWidth: 1400, margin: '0 auto' }}>
                    <QuizHeader />

                    <Grid>
                        <Grid.Col span={{ base: 12, lg: 8 }}>
                            <Stack gap="md">
                                <AiQuizGenerator />
                                <QuestionBank />
                                <QuizBasicInfo />
                                <QuestionsList />
                                <AddQuestionForm />
                            </Stack>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, lg: 4 }}>
                            <QuizSummary />
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Box>
    );
}
