import { AppProvider, useApp } from '@/context';
import { NavProvider, useNav } from '@/nav';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { QuizMatePage } from '@/pages/QuizMatePage';
import { GenerateQuizPage } from '@/pages/GenerateQuizPage';
import { TakeQuizPage } from '@/pages/TakeQuizPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { StudyPlannerPage } from '@/pages/StudyPlannerPage';
import { ProfilePage } from '@/pages/ProfilePage';

function Router() {
  const { page } = useNav();
  const { user } = useApp();

  const authPages = ['landing', 'auth'];
  if (!user && !authPages.includes(page)) {
    return <AuthPage />;
  }
  if (user && (page === 'landing' || page === 'auth')) {
    return <DashboardPage />;
  }

  switch (page) {
    case 'landing': return <LandingPage />;
    case 'auth': return <AuthPage />;
    case 'dashboard': return <DashboardPage />;
    case 'quizmate': return <QuizMatePage />;
    case 'generate': return <GenerateQuizPage />;
    case 'takequiz': return <TakeQuizPage />;
    case 'results': return <ResultsPage />;
    case 'progress': return <ProgressPage />;
    case 'history': return <HistoryPage />;
    case 'planner': return <StudyPlannerPage />;
    case 'profile': return <ProfilePage />;
    default: return <DashboardPage />;
  }
}

function App() {
  return (
    <AppProvider>
      <NavProvider>
        <Layout>
          <Router />
        </Layout>
      </NavProvider>
    </AppProvider>
  );
}

export default App;
