import { PrismaClient, GuideItem, Status } from '@prisma/client';
import { CreateGuideInput, UpdateGuideInput } from './guide.model';
import { DatabaseSeeder } from '../../utils/databaseSeeder';

export const createGuideService = (prisma: PrismaClient) => {
  const seeder = new DatabaseSeeder(prisma);
  return {
    list: async (): Promise<GuideItem[]> => {
      try {
        return await prisma.guideItem.findMany({ 
          orderBy: { createdAt: 'desc' },
          where: { status: Status.Cleared }
        });
      } catch {
        throw new Error('Failed to fetch guide items');
      }
    },

    getById: async (id: string): Promise<GuideItem | null> => {
      try {
        return await prisma.guideItem.findUnique({ where: { id } });
      } catch {
        throw new Error('Failed to fetch guide item');
      }
    },

    create: async (input: CreateGuideInput): Promise<GuideItem> => {
      try {
        return await prisma.guideItem.create({
          data: {
            title: input.title,
            content: input.content,
            status: Status.Cleared,
            likesCount: 0
          }
        });
      } catch {
        throw new Error('Failed to create guide item');
      }
    },

    update: async (id: string, input: UpdateGuideInput): Promise<GuideItem> => {
      try {
        const existing = await prisma.guideItem.findUnique({ where: { id } });
        if (!existing) throw new Error('Guide item not found');

        return await prisma.guideItem.update({
          where: { id },
          data: input
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Guide item not found') throw error;
        throw new Error('Failed to update guide item');
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const existing = await prisma.guideItem.findUnique({ where: { id } });
        if (!existing) throw new Error('Guide item not found');

        await prisma.guideItem.delete({ where: { id } });
      } catch (error) {
        if (error instanceof Error && error.message === 'Guide item not found') throw error;
        throw new Error('Failed to delete guide item');
      }
    },

    // Seeding function for development/testing
    seedSampleGuides: async (clearExisting: boolean = false): Promise<{ totalCount: number; addedCount: number }> => {
      try {
        const beforeCount = await prisma.guideItem.count();
        await seeder.seedGuides({ clearExisting, verbose: false });
        const afterCount = await prisma.guideItem.count();
        
        return {
          totalCount: afterCount,
          addedCount: clearExisting ? afterCount : afterCount - beforeCount
        };
      } catch (error) {
        throw new Error('Failed to seed sample guides');
      }
    }
  };
};
