export interface Location {
  id: string;
  state_uf: string;
  city_name: string;
  ibge_code: string | null;
}

export interface Specialty {
  id: number;
  name: string;
}

export interface Instrument {
  id: number;
  name: string;
}

export interface Musician {
  id: string;
  user_id: string;
  full_name: string;
  stage_name: string | null;
  whatsapp: string | null;
  city_id: string | null;
  primary_instrument_id: number | null;
  bio_url: string | null;
  is_available: boolean;
  consent_accepted_at: string | null;
  consent_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface MusicianSpecialty {
  musician_id: string;
  specialty_id: number;
}

export interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

export interface IBGECity {
  id: number;
  nome: string;
}
