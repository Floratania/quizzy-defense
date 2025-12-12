import {createBrowserRouter} from 'react-router';
import App from '../App';
import QuizCreator from "../pages/QuizCreator.jsx";
import AuthPage from "../pages/AuthPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import AdminDashboard from "../pages/DashboardPage.jsx";
import HostPage from "../pages/GameProcess/HostPage.jsx";
import PlayerPage from "../pages/PlayerPage.jsx";
import {GuestGuard} from "../shared/guards/GuestGuard.jsx";
import ProtectedRoute from "../shared/guards/ProtectedRoute.jsx";
import JoinPage from "../pages/GameProcess/JoinPage.jsx";
import CreateEditQuizPage from "../components/Dashboard/QuizManagement/CreateEditQuizPage.jsx";
import QuizList from "../components/Dashboard/QuizManagement/QuizList.jsx";
import QuizSessionStatistics from "../components/Dashboard/Statistics.jsx";
import QuizReportsList from "../components/Dashboard/QuizReportsList.jsx";
import QuestionScreenTest from "../components/QuestionScreenTest.jsx";
import QuestionMock from "../components/QuestionMick.jsx";
import KahootGameScreen from "../pages/Test.jsx";

const router = createBrowserRouter([
    {
        path: '/',
        Component: App,
        children: [
            {index: true, Component: HomePage},
            {
                path: 'auth',
                element: (
                    <GuestGuard>
                        <AuthPage/>
                    </GuestGuard>
                ),
            },
            {path: 'panel2', Component: QuizCreator},
            {path: 'host/:quizId', Component: HostPage},
            {path: 'player', Component: PlayerPage},
            {path: 'join', Component: JoinPage},
            {path: 'manage', Component: CreateEditQuizPage},
            {path: 'stats', Component: QuizSessionStatistics},
            {path: 'test', Component: KahootGameScreen},
            {path: 'question-test', Component: QuestionMock},
            {
                path: "admin",
                element: (
                    <ProtectedRoute>
                        <AdminDashboard/>
                    </ProtectedRoute>
                ),
                children: [
                    {
                        index: true,
                        element: <QuizList/>,
                    },
                    { path: "quizzes", Component: QuizList },
                    { path: "quizzes/new", Component: CreateEditQuizPage },
                    { path: "quizzes/:id/edit", Component: CreateEditQuizPage },
                    { path: "reports/:id", Component: QuizSessionStatistics },
                    { path: "reports", Component: QuizReportsList },
                ]
            }
        ],
    },
]);

export default router;
