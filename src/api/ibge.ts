import { supabase } from '../lib/supabase';
import type { Instrument, Specialty, Location } from '../types/database';
import type { IBGEState, IBGECity } from '../types/database';

const IBGE_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export async function fetchIBGEStates(): Promise<IBGEState[]> {
  const response = await fetch(`${IBGE_BASE_URL}/estados`);
  if (!response.ok) {
    throw new Error('Failed to fetch states from IBGE');
  }
  const states: IBGEState[] = await response.json();
  return states.sort((a, b) => a.sigla.localeCompare(b.sigla));
}

export async function fetchIBGECities(stateUF: string): Promise<IBGECity[]> {
  const response = await fetch(`${IBGE_BASE_URL}/estados/${stateUF}/municipios`);
  if (!response.ok) {
    throw new Error('Failed to fetch cities from IBGE');
  }
  const cities: IBGECity[] = await response.json();
  return cities.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function fetchInstruments(): Promise<Instrument[]> {
  const { data, error } = await supabase
    .from('instruments')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchSpecialties(): Promise<Specialty[]> {
  const { data, error } = await supabase
    .from('specialties')
    .select('id, name')
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function findOrCreateLocation(
  stateUF: string,
  cityName: string,
  ibgeCode?: string
): Promise<Location> {
  const normalizedName = cityName.trim();
  const normalizedUF = stateUF.toUpperCase();

  const { data: existingLocation, error: findError } = await supabase
    .from('locations')
    .select('id, state_uf, city_name, ibge_code')
    .eq('state_uf', normalizedUF)
    .ilike('city_name', normalizedName)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingLocation) {
    return existingLocation;
  }

  const { data: newLocation, error: insertError } = await supabase
    .from('locations')
    .insert({
      state_uf: normalizedUF,
      city_name: normalizedName,
      ibge_code: ibgeCode ?? null,
    })
    .select('id, state_uf, city_name, ibge_code')
    .single();

  if (insertError) {
    throw insertError;
  }

  return newLocation;
}

export async function checkMusicianProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('musicians')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking musician profile:', error);
    return false;
  }

  return data !== null;
}
