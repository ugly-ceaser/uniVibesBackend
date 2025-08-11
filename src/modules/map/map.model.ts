export type MapLocationOutput = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
}; 