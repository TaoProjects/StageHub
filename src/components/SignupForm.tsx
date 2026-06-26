import { useState } from 'react';
import { Mail, Lock, Music, Eye, EyeOff, Check } from 'lucide-react';

interface SignupFormProps {
  onSignUp: (email: string, password: string, consentAccepted: boolean) => Promise<{ error: Error | null }>;
  onSwitchToLogin: () => void;
}

const CONSENT_VERSION = '1.0';

export function SignupForm({ onSignUp, onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!consentAccepted) {
      setError('Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    const result = await onSignUp(email.trim(), password, consentAccepted);

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-zinc-400 mt-1">Junte-se ao StageHub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-2">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                required
                autoComplete="new-password"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="py-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all ${
                    consentAccepted
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-zinc-600 group-hover:border-zinc-500'
                  }`}
                >
                  {consentAccepted && <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}
                </div>
              </div>
              <span className="text-sm text-zinc-400 leading-relaxed">
                Li e aceito os{' '}
                <button type="button" className="text-amber-500 hover:text-amber-400 font-medium">
                  Termos de Uso
                </button>{' '}
                e a{' '}
                <button type="button" className="text-amber-500 hover:text-amber-400 font-medium">
                  Política de Privacidade (LGPD)
                </button>
                . <span className="text-zinc-500">(Versão {CONSENT_VERSION})</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !consentAccepted}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-400 text-sm">
            Já tem uma conta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
