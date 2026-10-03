import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutSessionProvider } from './context/WorkoutSessionContext';
import { Navbar } from './components/Navbar';
import { RestTimerWidget } from './components/RestTimerWidget';
import { EditProfileModal } from './components/EditProfileModal';
import { WorkoutCoach } from './components/WorkoutCoach';

// Pages
import { AuthPage } from './pages/AuthPage';
import { FeedPage } from './pages/FeedPage';
import { LogWorkoutPage } from './pages/LogWorkoutPage';
import { CalendarPage } from './pages/CalendarPage';
import { HistoryPage } from './pages/HistoryPage';
import { ExerciseProgressPage } from './pages/ExerciseProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchUsersPage } from './pages/SearchUsersPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient();

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('feed');
  const [profileUsername, setProfileUsername] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-extrabold text-sm tracking-wider">LOADING PULSE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleNavigateToTab = (tab: string, param?: string) => {
    if (tab === 'profile' && param) {
      setProfileUsername(param);
    } else if (tab === 'profile' && !param) {
      setProfileUsername(user.username);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col md:flex-row">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigateToTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Screen Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {currentTab === 'feed' && (
          <FeedPage onNavigateToTab={handleNavigateToTab} />
        )}

        {currentTab === 'log' && (
          <LogWorkoutPage onWorkoutFinished={() => handleNavigateToTab('calendar')} />
        )}

        {currentTab === 'calendar' && (
          <CalendarPage />
        )}

        {currentTab === 'history' && (
          <HistoryPage />
        )}

        {currentTab === 'progress' && (
          <ExerciseProgressPage />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            targetUsername={profileUsername || user.username}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectUser={(un) => handleNavigateToTab('profile', un)}
          />
        )}

        {currentTab === 'search' && (
          <SearchUsersPage
            onSelectUser={(un) => handleNavigateToTab('profile', un)}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      {/* Floating Rest Timer Widget */}
      <RestTimerWidget />

      {/* Workout Q&A Assistant */}
      <WorkoutCoach />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkoutSessionProvider>
          <MainContent />
        </WorkoutSessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
