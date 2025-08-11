import { PrismaClient } from '@prisma/client';

const gmUrl = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const createMapService = (prisma: PrismaClient) => {
  return {
    list: async () => {
      const items = await prisma.mapLocation.findMany({ orderBy: { name: 'asc' } });
      return items.map((i) => ({ ...i, googleMapsUrl: gmUrl(i.latitude, i.longitude) }));
    },
    getById: async (id: string) => {
      const item = await prisma.mapLocation.findUnique({ where: { id } });
      if (!item) return null;
      return { ...item, googleMapsUrl: gmUrl(item.latitude, item.longitude) };
    }
  };
}; 