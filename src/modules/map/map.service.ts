import { PrismaClient, MapLocation, LocationStatus, Status } from '@prisma/client';
import { CreateLocationInput, UpdateLocationInput } from './map.model';

const gmUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export type LocationWithGoogleMaps = MapLocation & {
  googleMapsUrl: string;
};

export const createMapService = (prisma: PrismaClient) => {
  return {
    // List only approved (ACTIVE) locations for public viewing
    list: async (): Promise<LocationWithGoogleMaps[]> => {
      const items = await prisma.mapLocation.findMany({
        where: { status: LocationStatus.ACTIVE },
        orderBy: { name: 'asc' }
      });
      return items.map((i) => ({
        ...i,
        googleMapsUrl: gmUrl(i.latitude, i.longitude)
      }));
    },

    // Get approved location by ID
    getById: async (id: string): Promise<LocationWithGoogleMaps | null> => {
      const item = await prisma.mapLocation.findUnique({
        where: { id },
      });
      if (!item || item.status !== LocationStatus.ACTIVE) return null;
      return { ...item, googleMapsUrl: gmUrl(item.latitude, item.longitude) };
    },

    // Create location (admin auto-approves → ACTIVE, else INACTIVE for review)
    create: async (input: CreateLocationInput, isAdmin = false): Promise<MapLocation> => {
      if (input.latitude < -90 || input.latitude > 90) {
        throw new Error('Invalid latitude. Must be between -90 and 90.');
      }
      if (input.longitude < -180 || input.longitude > 180) {
        throw new Error('Invalid longitude. Must be between -180 and 180.');
      }

      return prisma.mapLocation.create({
        data: {
          name: input.name,
          description: input.description,
          latitude: input.latitude,
          longitude: input.longitude,
          status: isAdmin ? LocationStatus.ACTIVE : LocationStatus.INACTIVE
        }
      });
    },

    // Update location
    update: async (id: string, input: UpdateLocationInput): Promise<MapLocation> => {
      const existing = await prisma.mapLocation.findUnique({ where: { id } });
      if (!existing) throw new Error('Location not found');

      if (input.latitude !== undefined && (input.latitude < -90 || input.latitude > 90)) {
        throw new Error('Invalid latitude. Must be between -90 and 90.');
      }
      if (input.longitude !== undefined && (input.longitude < -180 || input.longitude > 180)) {
        throw new Error('Invalid longitude. Must be between -180 and 180.');
      }

      return prisma.mapLocation.update({
        where: { id },
        data: input
      });
    },

    // Delete location
    delete: async (id: string): Promise<void> => {
      const existing = await prisma.mapLocation.findUnique({ where: { id } });
      if (!existing) throw new Error('Location not found');
      await prisma.mapLocation.delete({ where: { id } });
    },

    // Admin: List all
    listAll: async (): Promise<MapLocation[]> => {
      return prisma.mapLocation.findMany({
        orderBy: { createdAt: 'desc' }
      });
    },

    // Admin: Approve (set to ACTIVE)
    approveLocation: async (id: string): Promise<MapLocation> => {
      const existing = await prisma.mapLocation.findUnique({ where: { id } });
      if (!existing) throw new Error('Location not found');
      if (existing.status === LocationStatus.ACTIVE) {
        throw new Error('Location is already approved');
      }
      return prisma.mapLocation.update({
        where: { id },
        data: { status: LocationStatus.ACTIVE }
      });
    },

    // Admin: Reject (set to INACTIVE)
    rejectLocation: async (id: string): Promise<MapLocation> => {
      const existing = await prisma.mapLocation.findUnique({ where: { id } });
      if (!existing) throw new Error('Location not found');
      if (existing.status === LocationStatus.INACTIVE) {
        throw new Error('Location is already rejected');
      }
      return prisma.mapLocation.update({
        where: { id },
        data: { status: LocationStatus.INACTIVE }
      });
    },

    // Admin: Investigate → also use INACTIVE for now (or add new enum later)
    investigateLocation: async (id: string): Promise<MapLocation> => {
      const existing = await prisma.mapLocation.findUnique({ where: { id } });
      if (!existing) throw new Error('Location not found');
      // No INVESTIGATED in LocationStatus, so reusing INACTIVE for now
      return prisma.mapLocation.update({
        where: { id },
        data: { status: LocationStatus.INACTIVE }
      });
    },

getByIdAdmin: async (id: string): Promise<LocationWithGoogleMaps | null> => {
  try {
    const item = await prisma.mapLocation.findUnique({
      where: { id },
    });
    if (!item) return null;
    return { ...item, googleMapsUrl: gmUrl(item.latitude, item.longitude) };
  } catch {
    throw new Error('Failed to fetch location for admin');
  }
},



    // Get pending (INACTIVE) locations
    getPendingLocations: async (): Promise<MapLocation[]> => {
      return prisma.mapLocation.findMany({
        where: { status: LocationStatus.INACTIVE },
        orderBy: { createdAt: 'desc' }
      });
    }
  };
};
