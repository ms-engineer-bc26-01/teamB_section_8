// models.pyより
export interface User {
  id: string; // UUID
  email: string;
  temperature_sensitivity?: string;
  created_at: string;
}

export interface Item {
  id?: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  season: string;
  image_url?: string;
  created_at?: string;
}