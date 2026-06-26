import { Music, Calendar, Users, Mic, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">StageHub</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <User className="w-4 h-4" />
                <span className="text-sm hidden sm:block">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Boas-vindas ao StageHub
          </h1>
          <p className="text-zinc-400 text-lg">
            Sua plataforma de gestão de gigs para músicos profissionais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Meus Gigs</h3>
            <p className="text-zinc-400 text-sm">
              Gerencie suas contratações, datas e cachês em um só lugar.
            </p>
            <div className="mt-4 text-3xl font-bold text-zinc-600">0</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Convites</h3>
            <p className="text-zinc-400 text-sm">
              Convide músicos para seus gigs e acompanhe as respostas.
            </p>
            <div className="mt-4 text-3xl font-bold text-zinc-600">0</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Meu Perfil</h3>
            <p className="text-zinc-400 text-sm">
              Configure seu perfil, instrumentos e especialidades.
            </p>
            <div className="mt-4 text-zinc-600 text-sm">Pendente</div>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Próximos passos</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Complete seu perfil para começar a criar e gerenciar seus gigs.
          </p>
          <button className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-4 py-2 rounded-lg transition-colors">
            Completar perfil
          </button>
        </div>
      </main>
    </div>
  );
}
