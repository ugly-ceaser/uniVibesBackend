export type CreateLocationInput = {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
};

export type UpdateLocationInput = {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

export type MapLocationOutput = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: Date;
  googleMapsUrl: string;
};

export type MapLocationAdminOutput = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: Date;
};

export type PendingLocationOutput = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: Date;
};

export type LocationApprovalResponse = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: Date;
  message: string;
}; 