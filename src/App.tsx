import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { Dashboard } from './components/Dashboard';
import { OnboardingForm } from './components/OnboardingForm';

type AuthView = 'login' | 'signup';

function AuthScreen() {
  const [view, setView] = useState<AuthView>('login');
  const { signIn, signUp } = useAuth();

  // Funções intermediárias para resolver o conflito de tipos do TypeScript
  const handleSignIn = async (...args: any[]) => {
    return (signIn as any)(...args);
  };

  const handleSignUp = async (...args: any[]) => {
    return (signUp as any)(...args);
  };

  if (view === 'signup') {
    return (
      <SignupForm
        onSignUp={handleSignUp}
        onSwitchToLogin={() => setView('login')}
      />
    );
  }

  return (
    <LoginForm
      onSignIn={handleSignIn}
      onSwitchToSignup={() => setView('signup')}
    />
  );
}

function AppContent() {
  const { user, loading, hasProfile } = useAuth();
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

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

  if (pathname === '/onboarding' || hasProfile === false) {
    return <OnboardingForm />;
  }

  if (hasProfile === true) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400">Verificando perfil...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}