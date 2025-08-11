import { PrismaClient, MapLocation, Status } from '@prisma/client';
import { CreateLocationInput, UpdateLocationInput } from './map.model';

const gmUrl = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export type LocationWithGoogleMaps = MapLocation & {
  googleMapsUrl: string;
};

export const createMapService = (prisma: PrismaClient) => {
  return {
    // List only approved locations for public viewing
    list: async (): Promise<LocationWithGoogleMaps[]> => {
      try {
        const items = await prisma.mapLocation.findMany({ 
          where: { status: 'Cleared' },
          orderBy: { name: 'asc' } 
        });
        return items.map((i: MapLocation) => ({ ...i, googleMapsUrl: gmUrl(i.latitude, i.longitude) }));
      } catch (error) {
        throw new Error('Failed to fetch map locations');
      }
    },

    // Get approved location by ID for public viewing
    getById: async (id: string): Promise<LocationWithGoogleMaps | null> => {
      try {
        const item = await prisma.mapLocation.findUnique({ 
          where: { id, status: 'Cleared' } 
        });
        if (!item) return null;
        return { ...item, googleMapsUrl: gmUrl(item.latitude, item.longitude) };
      } catch (error) {
        throw new Error('Failed to fetch map location');
      }
    },

    // Create location (requires approval for non-admin users)
    create: async (input: CreateLocationInput, isAdmin: boolean = false): Promise<MapLocation> => {
      try {
        // Validate coordinates
        if (input.latitude < -90 || input.latitude > 90) {
          throw new Error('Invalid latitude. Must be between -90 and 90.');
        }
        if (input.longitude < -180 || input.longitude > 180) {
          throw new Error('Invalid longitude. Must be between -180 and 180.');
        }

        return await prisma.mapLocation.create({
          data: {
            name: input.name,
            description: input.description,
            latitude: input.latitude,
            longitude: input.longitude,
            status: isAdmin ? 'Cleared' : 'Reported' // Admin locations are auto-approved
          }
        });
      } catch (error) {
        if (error instanceof Error && ['Invalid latitude. Must be between -90 and 90.', 'Invalid longitude. Must be between -180 and 180.'].includes(error.message)) {
          throw error;
        }
        throw new Error('Failed to create map location');
      }
    },

    // Update location (admin only)
    update: async (id: string, input: UpdateLocationInput): Promise<MapLocation> => {
      try {
        const existing = await prisma.mapLocation.findUnique({ where: { id } });
        if (!existing) {
          throw new Error('Location not found');
        }

        // Validate coordinates if provided
        if (input.latitude !== undefined && (input.latitude < -90 || input.latitude > 90)) {
          throw new Error('Invalid latitude. Must be between -90 and 90.');
        }
        if (input.longitude !== undefined && (input.longitude < -180 || input.longitude > 180)) {
          throw new Error('Invalid longitude. Must be between -180 and 180.');
        }

        return await prisma.mapLocation.update({
          where: { id },
          data: input
        });
      } catch (error) {
        if (error instanceof Error && ['Location not found', 'Invalid latitude. Must be between -90 and 90.', 'Invalid longitude. Must be between -180 and 180.'].includes(error.message)) {
          throw error;
        }
        throw new Error('Failed to update map location');
      }
    },

    // Delete location (admin only)
    delete: async (id: string): Promise<void> => {
      try {
        const existing = await prisma.mapLocation.findUnique({ where: { id } });
        if (!existing) {
          throw new Error('Location not found');
        }

        await prisma.mapLocation.delete({ where: { id } });
      } catch (error) {
        if (error instanceof Error && error.message === 'Location not found') {
          throw error;
        }
        throw new Error('Failed to delete map location');
      }
    },

    // Admin: List all locations (including pending approval)
    listAll: async (): Promise<MapLocation[]> => {
      try {
        return await prisma.mapLocation.findMany({ 
          orderBy: { createdAt: 'desc' } 
        });
      } catch (error) {
        throw new Error('Failed to fetch all map locations');
      }
    },

    // Admin: Get any location by ID (including pending approval)
    getByIdAdmin: async (id: string): Promise<MapLocation | null> => {
      try {
        return await prisma.mapLocation.findUnique({ where: { id } });
      } catch (error) {
        throw new Error('Failed to fetch map location');
      }
    },

    // Admin: Approve a location
    approveLocation: async (id: string): Promise<MapLocation> => {
      try {
        const existing = await prisma.mapLocation.findUnique({ where: { id } });
        if (!existing) {
          throw new Error('Location not found');
        }

        if (existing.status === 'Cleared') {
          throw new Error('Location is already approved');
        }

        return await prisma.mapLocation.update({
          where: { id },
          data: { status: 'Cleared' }
        });
      } catch (error) {
        if (error instanceof Error && ['Location not found', 'Location is already approved'].includes(error.message)) {
          throw error;
        }
        throw new Error('Failed to approve location');
      }
    },

    // Admin: Reject a location
    rejectLocation: async (id: string): Promise<MapLocation> => {
      try {
        const existing = await prisma.mapLocation.findUnique({ where: { id } });
        if (!existing) {
          throw new Error('Location not found');
        }

        if (existing.status === 'Block') {
          throw new Error('Location is already rejected');
        }

        return await prisma.mapLocation.update({
          where: { id },
          data: { status: 'Block' }
        });
      } catch (error) {
        if (error instanceof Error && ['Location not found', 'Location is already rejected'].includes(error.message)) {
          throw error;
        }
        throw new Error('Failed to reject location');
      }
    },

    // Admin: Investigate a location
    investigateLocation: async (id: string): Promise<MapLocation> => {
      try {
        const existing = await prisma.mapLocation.findUnique({ where: { id } });
        if (!existing) {
          throw new Error('Location not found');
        }

        if (existing.status === 'Investigated') {
          throw new Error('Location is already under investigation');
        }

        return await prisma.mapLocation.update({
          where: { id },
          data: { status: 'Investigated' }
        });
      } catch (error) {
        if (error instanceof Error && ['Location not found', 'Location is already under investigation'].includes(error.message)) {
          throw error;
        }
        throw new Error('Failed to investigate location');
      }
    },

    // Get pending locations for admin review
    getPendingLocations: async (): Promise<MapLocation[]> => {
      try {
        return await prisma.mapLocation.findMany({
          where: { status: 'Reported' },
          orderBy: { createdAt: 'desc' }
        });
      } catch (error) {
        throw new Error('Failed to fetch pending locations');
      }
    }
  };
}; 