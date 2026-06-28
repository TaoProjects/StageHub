import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { GigDashboard } from './components/GigDashboard';
import { OnboardingForm } from './components/OnboardingForm';
import { PublicInvite } from './pages/PublicInvite';

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

function AppContent() {
  const { user, loading, hasProfile } = useAuth();
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  // 1. ROTA PÚBLICA: /invite/:id (100% aberta, ignora autenticação)
  if (pathname.startsWith('/invite/')) {
    return <PublicInvite />;
  }

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

  // 2. CHAVE MESTRA DO ONBOARDING:
  // Ativa se o Supabase acusar pendência OU se você digitar /onboarding no link
  if (pathname === '/onboarding' || hasProfile === false) {
    return <OnboardingForm />;
  }

  // 3. LOGADO COM PERFIL -> Painel Real de Shows
  if (hasProfile === true) {
    return <GigDashboard />;
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