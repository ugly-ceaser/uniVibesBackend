import { PrismaClient } from '@prisma/client';
import { seedGuides, seedGuidesWithoutClearing } from '../utils/seedGuides';
import { seedMapLocations, seedMapLocationsWithoutClearing } from '../utils/seedMapLocations';
import { seedForumData, clearForumData } from '../utils/seedForumData';
import { seedUniversityData } from '../utils/seedUniversityData';

const prisma = new PrismaClient();

interface SeedOptions {
  clearExisting?: boolean;
  verbose?: boolean;
}

class DatabaseSeeder {
  async getMapLocationStats(): Promise<{
    totalCount: number;
    recentLocations: Array<{ id: string; name: string; createdAt: Date }>;
  }> {
    const totalCount = await this.prisma.mapLocation.count();
    const recentLocations = await this.prisma.mapLocation.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return { totalCount, recentLocations };
  }
  constructor(private prisma: PrismaClient) {}

  async seedCourses(options: SeedOptions = {}): Promise<void> {
    const { clearExisting = false, verbose = true } = options;
    try {
      if (verbose) console.log('📚 Starting university & course seeding process...');
      await seedUniversityData(this.prisma);
      const newCount = await this.prisma.course.count();
      if (verbose) {
        console.log(`✅ Course seeding completed successfully!`);
        console.log(`🎯 Total courses now: ${newCount}`);
      }
    } catch (error) {
      console.error('❌ Error during course seeding:', error);
      throw error;
    }
  }

  async seedGuides(options: SeedOptions = {}): Promise<void> {
    const { clearExisting = false, verbose = true } = options;

    try {
      if (verbose) console.log('🌱 Starting guide seeding process...');

      if (clearExisting) {
        if (verbose) console.log('🧹 Clearing existing guide data...');
        await this.prisma.guideItem.deleteMany({});
      }

      // Check existing count
      const existingCount = await this.prisma.guideItem.count();
      if (verbose) console.log(`📊 Current guides in database: ${existingCount}`);

      // Run the seeding function
      if (clearExisting) {
        await seedGuides();
      } else {
        await seedGuidesWithoutClearing();
      }

      // Verify seeding
      const newCount = await this.prisma.guideItem.count();
      const addedCount = newCount - existingCount;
      
      if (verbose) {
        console.log(`✅ Guide seeding completed successfully!`);
        console.log(`📈 Added ${addedCount} new guides`);
        console.log(`🎯 Total guides now: ${newCount}`);
      }

    } catch (error) {
      console.error('❌ Error during guide seeding:', error);
      throw error;
    }
  }

  async seedMapLocations(options: SeedOptions = {}): Promise<void> {
    const { clearExisting = false, verbose = true } = options;

    try {
      if (verbose) console.log('🗺️ Starting map locations seeding process...');

      if (clearExisting) {
        if (verbose) console.log('🧹 Clearing existing map locations data...');
        await this.prisma.mapLocation.deleteMany({});
      }

      // Check existing count
      const existingCount = await this.prisma.mapLocation.count();
      if (verbose) console.log(`📊 Current map locations in database: ${existingCount}`);

      // Run the seeding function
      if (clearExisting) {
        await seedMapLocations();
      } else {
        await seedMapLocationsWithoutClearing();
      }

      // Verify seeding
      const newCount = await this.prisma.mapLocation.count();
      const addedCount = newCount - existingCount;
      
      if (verbose) {
        console.log(`✅ Map locations seeding completed successfully!`);
        console.log(`📈 Added ${addedCount} new locations`);
        console.log(`🎯 Total locations now: ${newCount}`);
      }

    } catch (error) {
      console.error('❌ Error during map locations seeding:', error);
      throw error;
    }
  }

  async seedForumData(options: SeedOptions = {}): Promise<void> {
    const { clearExisting = false, verbose = true } = options;

    try {
      if (verbose) console.log('🏛️ Starting forum data seeding process...');

      if (clearExisting) {
        if (verbose) console.log('🧹 Clearing existing forum data...');
        await clearForumData(this.prisma);
      }

      // Check existing counts
      const [existingForums, existingQuestions, existingAnswers, existingComments] = await Promise.all([
        this.prisma.forum.count(),
        this.prisma.question.count(),
        this.prisma.answer.count(),
        this.prisma.comment.count(),
      ]);

      if (verbose) {
        console.log(`📊 Current forum data in database:`);
        console.log(`   Forums: ${existingForums}`);
        console.log(`   Questions: ${existingQuestions}`);
        console.log(`   Answers: ${existingAnswers}`);
        console.log(`   Comments: ${existingComments}`);
      }

      // Run the seeding function
      const result = await seedForumData(this.prisma);

      // Verify seeding
      const [newForums, newQuestions, newAnswers, newComments] = await Promise.all([
        this.prisma.forum.count(),
        this.prisma.question.count(),
        this.prisma.answer.count(),
        this.prisma.comment.count(),
      ]);
      
      if (verbose) {
        console.log(`✅ Forum data seeding completed successfully!`);
        console.log(`📈 Added:`);
        console.log(`   Forums: ${newForums - existingForums}`);
        console.log(`   Questions: ${newQuestions - existingQuestions}`);
        console.log(`   Answers: ${newAnswers - existingAnswers}`);
        console.log(`   Comments: ${newComments - existingComments}`);
        console.log(`🎯 Total forum data now:`);
        console.log(`   Forums: ${newForums}`);
        console.log(`   Questions: ${newQuestions}`);
        console.log(`   Answers: ${newAnswers}`);
        console.log(`   Comments: ${newComments}`);
      }

    } catch (error) {
      console.error('❌ Error during forum data seeding:', error);
      throw error;
    }
  }

  async seedAll(options: SeedOptions = {}): Promise<void> {
    const { verbose = true } = options;
    
    if (verbose) console.log('🚀 Starting complete database seeding...');
    
  await this.seedGuides(options);
  await this.seedMapLocations(options);
  await this.seedForumData(options);
  await this.seedCourses(options);
    
    if (verbose) console.log('🎉 Complete database seeding finished!');
  }

  async getGuidesStats(): Promise<{
    totalCount: number;
    recentGuides: Array<{ id: string; title: string; createdAt: Date }>;
  }> {
    const totalCount = await this.prisma.guideItem.count();
    const recentGuides = await this.prisma.guideItem.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
    });

    return { totalCount, recentGuides };
  }

  async getForumDataStats(): Promise<{
    totalForums: number;
    totalQuestions: number;
    totalAnswers: number;
    totalComments: number;
    recentQuestions: Array<{ id: string; title: string; createdAt: Date }>;
  }> {
    const [totalForums, totalQuestions, totalAnswers, totalComments] = await Promise.all([
      this.prisma.forum.count(),
      this.prisma.question.count(),
      this.prisma.answer.count(),
      this.prisma.comment.count(),
    ]);

    const recentQuestions = await this.prisma.question.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
    });

    return { totalForums, totalQuestions, totalAnswers, totalComments, recentQuestions };
  }

  async getCoursesStats(): Promise<{
    totalCount: number;
    recentCourses: Array<{ id: string; name: string; department: string; createdAt: Date }>;
  }> {
    const totalCount = await this.prisma.course.count();
    const raw = await this.prisma.course.findMany({
      select: { id: true, title: true, courseCode: true, createdAt: true, department: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentCourses = raw.map(c => ({
      id: c.id,
      name: `${c.courseCode} – ${c.title}`,
      department: c.department.name,
      createdAt: c.createdAt,
    }));
    return { totalCount, recentCourses };
  }
}

// Export the seeder class for use in other parts of the application
export { DatabaseSeeder };

// CLI interface for running seeds directly
async function runSeeder() {
  const args = process.argv.slice(2);
  const clearExisting = args.includes('--clear') || args.includes('-c');
  const quiet = args.includes('--quiet') || args.includes('-q');
  const seedType = args.find(arg => ['guides', 'locations', 'forum', 'courses', 'all'].includes(arg)) || 'guides';
  
  const seeder = new DatabaseSeeder(prisma);
  
  try {
    switch (seedType) {
      case 'guides':
        await seeder.seedGuides({ clearExisting, verbose: !quiet });
        break;
      case 'locations':
        await seeder.seedMapLocations({ clearExisting, verbose: !quiet });
        break;
      case 'forum':
        await seeder.seedForumData({ clearExisting, verbose: !quiet });
        break;
      case 'courses':
        await seeder.seedCourses({ clearExisting, verbose: !quiet });
        break;
      case 'all':
        await seeder.seedAll({ clearExisting, verbose: !quiet });
        break;
    }
    
    // Show stats
    if (!quiet) {
      const guideStats = await seeder.getGuidesStats();
      const locationStats = await seeder.getMapLocationStats();
      const forumStats = await seeder.getForumDataStats();
      const courseStats = await seeder.getCoursesStats();
      
      console.log('\n📊 Database Stats:');
      console.log(`Total Guides: ${guideStats.totalCount}`);
      console.log(`Total Locations: ${locationStats.totalCount}`);
      console.log(`Total Forums: ${forumStats.totalForums}`);
      console.log(`Total Questions: ${forumStats.totalQuestions}`);
      console.log(`Total Answers: ${forumStats.totalAnswers}`);
      console.log(`Total Comments: ${forumStats.totalComments}`);
      console.log(`Total Courses: ${courseStats.totalCount}`);
      
      if (seedType === 'guides' || seedType === 'all') {
        console.log('\nRecent Guides:');
        guideStats.recentGuides.forEach((guide, index) => {
          console.log(`${index + 1}. ${guide.title}`);
        });
      }
      
      if (seedType === 'locations' || seedType === 'all') {
        console.log('\nRecent Locations:');
        locationStats.recentLocations.forEach((location, index) => {
          console.log(`${index + 1}. ${location.name}`);
        });
      }

      if (seedType === 'forum' || seedType === 'all') {
        console.log('\nRecent Questions:');
        forumStats.recentQuestions.forEach((question, index) => {
          console.log(`${index + 1}. ${question.title}`);
        });
      }

      if (seedType === 'courses' || seedType === 'all') {
        console.log('\nRecent Courses:');
        courseStats.recentCourses.forEach((course, index) => {
          console.log(`${index + 1}. ${course.name} [${course.department}]`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// If this file is run directly, execute the CLI
if (require.main === module) {
  console.log('🚀 Database Seeder');
  console.log('Usage: npm run seed [guides|locations|forum|courses|all] [--clear] [--quiet]');
  console.log('  guides     : Seed only guides');
  console.log('  locations  : Seed only map locations');
  console.log('  forum      : Seed only forum data (questions, answers, comments)');
  console.log('  courses    : Seed only courses');
  console.log('  all        : Seed guides, locations, forum data, and courses');
  console.log('  --clear, -c: Clear existing data before seeding');
  console.log('  --quiet, -q: Run in quiet mode\n');
  
  runSeeder();
}

export default DatabaseSeeder;
