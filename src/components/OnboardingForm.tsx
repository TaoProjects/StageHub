import { useState, useEffect, useCallback } from 'react';
import { User, MapPin, Music, Loader2, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchIBGEStates,
  fetchIBGECities,
  fetchInstruments,
  fetchSpecialties,
  findOrCreateLocation,
} from '../api/ibge';
import type { IBGEState, IBGECity, Instrument, Specialty } from '../types/database';

const INITIAL_STATE = {
  step: 1,
  full_name: '',
  stage_name: '',
  whatsapp: '',
  state_uf: '',
  city_id: '',
  city_name: '',
  primary_instrument_id: '',
  specialties: [] as number[],
  bio_url: '',
};

function formatWhatsApp(value: string): string {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : '';
  }
  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

function validateWhatsApp(value: string): boolean {
  const numbers = value.replace(/\D/g, '');
  return numbers.length === 11;
}

function validateUrl(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function OnboardingForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_STATE);
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [statesData, instrumentsData, specialtiesData] = await Promise.all([
          fetchIBGEStates(),
          fetchInstruments(),
          fetchSpecialties(),
        ]);
        setStates(statesData);
        setInstruments(instrumentsData);
        setSpecialties(specialtiesData);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Erro ao carregar dados. Tente recarregar a página.');
      } finally {
        setLoadingStates(false);
      }
    }
    loadInitialData();
  }, []);

  const handleStateChange = useCallback(async (stateUF: string) => {
    setForm((prev) => ({ ...prev, state_uf: stateUF, city_id: '', city_name: '' }));
    setCities([]);
    if (!stateUF) return;

    setLoadingCities(true);
    try {
      const citiesData = await fetchIBGECities(stateUF);
      setCities(citiesData);
    } catch (err) {
      console.error('Error loading cities:', err);
      setError('Erro ao carregar cidades. Tente novamente.');
    } finally {
      setLoadingCities(false);
    }
  }, []);

  const handleCityChange = useCallback((cityName: string) => {
    const city = cities.find((c) => c.nome === cityName);
    if (city) {
      setForm((prev) => ({
        ...prev,
        city_id: city.id.toString(),
        city_name: city.nome,
      }));
    }
  }, [cities]);

  const handleSpecialtyToggle = useCallback((specialtyId: number) => {
    setForm((prev) => {
      const isSelected = prev.specialties.includes(specialtyId);
      return {
        ...prev,
        specialties: isSelected
          ? prev.specialties.filter((id) => id !== specialtyId)
          : [...prev.specialties, specialtyId],
      };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Usuário não autenticado.');
      return;
    }

    if (form.specialties.length === 0) {
      setError('Selecione ao menos uma especialidade.');
      return;
    }

    if (form.whatsapp && !validateWhatsApp(form.whatsapp)) {
      setError('WhatsApp deve conter 11 dígitos (com DDD).');
      return;
    }

    if (form.bio_url && !validateUrl(form.bio_url)) {
      setError('Link de portfólio inválido.');
      return;
    }

    setLoadingSubmit(true);

    try {
      let cityId: string | null = null;

      if (form.state_uf && form.city_name) {
        const location = await findOrCreateLocation(
          form.state_uf,
          form.city_name,
          form.city_id
        );
        cityId = location.id;
      }

      const consentAcceptedAt = user.user_metadata?.consent_accepted_at ?? new Date().toISOString();
      const consentVersion = user.user_metadata?.consent_version ?? '1.0';

      const { data: musician, error: musicianError } = await supabase
        .from('musicians')
        .insert({
          user_id: user.id,
          full_name: form.full_name.trim(),
          stage_name: form.stage_name.trim() || null,
          whatsapp: form.whatsapp.replace(/\D/g, '') || null,
          city_id: cityId,
          primary_instrument_id: form.primary_instrument_id ? parseInt(form.primary_instrument_id) : null,
          bio_url: form.bio_url.trim() || null,
          is_available: true,
          consent_accepted_at: consentAcceptedAt,
          consent_version: consentVersion,
        })
        .select('id')
        .single();

      if (musicianError) {
        throw musicianError;
      }

      if (!musician) {
        throw new Error('Failed to create musician profile');
      }

      const specialtyInserts = form.specialties.map((specialtyId) => ({
        musician_id: musician.id,
        specialty_id: specialtyId,
      }));

      const { error: specialtiesError } = await supabase
        .from('musician_specialties')
        .insert(specialtyInserts);

      if (specialtiesError) {
        await supabase.from('musicians').delete().eq('id', musician.id);
        throw specialtiesError;
      }

      window.location.reload();
    } catch (err) {
      console.error('Error submitting onboarding:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingStates) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-zinc-400">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete seu perfil</h1>
          <p className="text-zinc-400">Essas informações serão usadas para conectar você com gigs.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Dados pessoais</h2>
                <p className="text-zinc-500 text-sm">Como você será identificado nas gigs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Seu nome completo"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="stage_name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome Artístico
                </label>
                <input
                  id="stage_name"
                  type="text"
                  value={form.stage_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, stage_name: e.target.value }))}
                  placeholder="É como você será achado nas Gigs"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="whatsapp" className="block text-sm font-medium text-zinc-300 mb-2">
                  WhatsApp
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: formatWhatsApp(e.target.value) }))}
                  placeholder="(99) 99999-9999"
                  maxLength={16}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <p className="text-zinc-500 text-xs mt-1">Digite apenas números, formataremos automaticamente.</p>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Localização</h2>
                <p className="text-zinc-500 text-sm">Onde você atua</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="state_uf" className="block text-sm font-medium text-zinc-300 mb-2">
                  Estado
                </label>
                <select
                  id="state_uf"
                  value={form.state_uf}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecione o estado</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.sigla}>
                      {state.sigla} - {state.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city_name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Cidade
                </label>
                <select
                  id="city_name"
                  value={form.city_name}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!form.state_uf || loadingCities}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingCities ? 'Carregando...' : 'Selecione a cidade'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.nome}>
                      {city.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Atuação Musical</h2>
                <p className="text-zinc-500 text-sm">Seu instrumento e segmentos</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="primary_instrument_id" className="block text-sm font-medium text-zinc-300 mb-2">
                  Instrumento Principal
                </label>
                <select
                  id="primary_instrument_id"
                  value={form.primary_instrument_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, primary_instrument_id: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecione seu instrumento</option>
                  {instruments.map((instrument) => (
                    <option key={instrument.id} value={instrument.id}>
                      {instrument.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Minhas Especialidades *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specialties.map((specialty) => (
                    <label
                      key={specialty.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        form.specialties.includes(specialty.id)
                          ? 'bg-amber-500/10 border-amber-500'
                          : 'bg-zinc-950 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            form.specialties.includes(specialty.id)
                              ? 'bg-amber-500 border-amber-500'
                              : 'border-zinc-600'
                          }`}
                        >
                          {form.specialties.includes(specialty.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={form.specialties.includes(specialty.id)}
                          onChange={() => handleSpecialtyToggle(specialty.id)}
                          className="sr-only"
                        />
                      </div>
                      <span
                        className={`text-sm ${
                          form.specialties.includes(specialty.id) ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {specialty.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="bio_url" className="block text-sm font-medium text-zinc-300 mb-2">
                  Link de Portfólio
                </label>
                <div className="relative">
                  <input
                    id="bio_url"
                    type="url"
                    value={form.bio_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, bio_url: e.target.value }))}
                    placeholder="https://youtube.com/@seucanal ou Instagram/TikTok"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                  <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                </div>
                <p className="text-zinc-500 text-xs mt-1">
                  Cole o link do seu YouTube, Instagram ou TikTok.
                </p>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={loadingSubmit || form.specialties.length === 0}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            {loadingSubmit ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando perfil...
              </>
            ) : (
              <>
                Finalizar cadastro
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
