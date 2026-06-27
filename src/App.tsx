import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { OnboardingForm } from './components/OnboardingForm';
import { GigDashboard } from './components/GigDashboard';
import { PublicInvite } from './pages/PublicInvite';
import { Toaster } from 'react-hot-toast';

type AuthView = 'login' | 'signup';

function AuthScreen() {
  const [view, setView] = useState<AuthView>('login');
  const { signIn, signUp } = useAuth();

  if (view === 'signup') {
    return (
      <SignupForm
        onSignUp={signUp}
        onSwitchToLogin={() => setView('login')}
      />
    );
  }

  return (
    <LoginForm
      onSignIn={signIn}
      onSwitchToSignup={() => setView('signup')}
    />
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (hasProfile === false) {
    return <OnboardingForm />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, loading, hasProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <AuthScreen />
      </div>
    );
  }

  if (hasProfile === false) {
    return <OnboardingForm />;
  }

  return <GigDashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
            },
            success: {
              iconTheme: {
                primary: '#f59e0b',
                secondary: '#18181b',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#18181b',
              },
            },
          }}
        />
        <Routes>
          <Route path="/invite/:id" element={<PublicInvite />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <GigDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
