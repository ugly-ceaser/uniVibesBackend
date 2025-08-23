import { PrismaClient, LocationStatus } from '@prisma/client';

const prisma = new PrismaClient();

// GO University campus coordinates (sample coordinates for a Nigerian university)
// You can adjust these coordinates to match the actual GO University location
const CAMPUS_CENTER = {
  latitude: 6.5244,  // Lagos, Nigeria area coordinates
  longitude: 3.3792
};

// Helper function to generate coordinates around campus center
const generateCampusCoordinates = (baseLat: number, baseLng: number, offsetRange: number = 0.01) => {
  const latOffset = (Math.random() - 0.5) * offsetRange;
  const lngOffset = (Math.random() - 0.5) * offsetRange;
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset
  };
};

const sampleLocationData = [
  {
    name: "Main Library (Dr. Samuel Johnson Library)",
    description: "Central university library with over 200,000 books, digital resources, study halls, computer labs, and 24/7 access during exam periods. Features quiet study zones, group discussion rooms, and research facilities.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Administrative Block",
    description: "Houses the Vice-Chancellor's office, Registrar, Bursary, Student Affairs, Admissions office, and other key administrative departments. All student services and official documentation handled here.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Lecture Theatre Complex (LT1-LT10)",
    description: "Main academic building containing 10 large lecture theatres (LT1-LT10) with modern audio-visual equipment. Capacity ranges from 200-500 students per theatre.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Faculty of Sciences Building",
    description: "Dedicated building for Science departments including Physics, Chemistry, Biology, Mathematics, and Computer Science. Features modern laboratories and research facilities.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Faculty of Engineering Complex",
    description: "State-of-the-art engineering facility with Civil, Mechanical, Electrical, and Chemical Engineering departments. Includes workshops, design studios, and testing laboratories.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Student Union Building",
    description: "Central hub for student activities, housing student government offices, multipurpose halls, recreation rooms, and meeting spaces for student organizations and clubs.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Main Cafeteria (Unity Cafeteria)",
    description: "Primary dining facility serving breakfast, lunch, and dinner. Offers local Nigerian dishes, continental options, and vegetarian meals. Accommodates 800+ students.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Sports Complex & Gymnasium",
    description: "Complete sports facility with basketball courts, tennis courts, football field, gymnasium with modern equipment, and facilities for various indoor and outdoor sports.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Medical Center & Health Services",
    description: "On-campus medical facility providing healthcare services to students and staff. Includes consultation rooms, pharmacy, laboratory services, and emergency care.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Main Auditorium (GO Hall)",
    description: "Large capacity auditorium for convocations, major events, conferences, and ceremonies. Seats 2,000 people with modern sound and lighting systems.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Computer Center & IT Services",
    description: "Central IT hub with 150+ computer workstations, free internet access, printing services, and technical support. Also houses the university's main servers.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Female Hostel Block A (Grace Hostel)",
    description: "Modern female accommodation facility with 200 rooms, common rooms, laundry facilities, kitchen spaces, and 24-hour security. Well-furnished with study areas.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Male Hostel Block B (Valor Hostel)",
    description: "Male student accommodation with 250 rooms, recreational facilities, study halls, laundry services, and round-the-clock security. Modern amenities throughout.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Faculty of Arts & Humanities",
    description: "Home to English, History, Philosophy, Languages, and Fine Arts departments. Features art studios, language laboratories, and performance spaces.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Business School (GO Business Center)",
    description: "Modern facility for Business Administration, Economics, and Management programs. Includes case study rooms, business simulation labs, and conference facilities.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Main Parking Area",
    description: "Primary parking facility for students, staff, and visitors. Covered parking available with security monitoring. Capacity for 500+ vehicles.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Central Park & Gardens",
    description: "Beautiful landscaped area in the heart of campus with walking paths, benches, study spots, and recreational spaces. Popular gathering place for students.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Security Post & Main Gate",
    description: "Primary entrance to GO University with 24/7 security checkpoint, visitor registration, and campus security coordination center.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Research Institute Building",
    description: "Dedicated facility for postgraduate research, faculty research projects, and collaborative studies. Houses specialized laboratories and research centers.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  },
  {
    name: "Chapel & Mosque Complex",
    description: "Interfaith worship facilities serving the spiritual needs of the university community. Includes Christian chapel and Islamic mosque with prayer halls and offices.",
    ...generateCampusCoordinates(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude),
    status: LocationStatus.ACTIVE
  }
];

export const seedMapLocations = async (): Promise<void> => {
  try {
    console.log('Starting to seed map locations data...');
    
    // Clear existing locations (optional - remove if you want to keep existing data)
    await prisma.mapLocation.deleteMany({});
    console.log('Cleared existing map locations data');
    
    // Seed new locations
    const createdLocations = await prisma.mapLocation.createMany({
      data: sampleLocationData,
      skipDuplicates: true,
    });
    
    console.log(`Successfully seeded ${createdLocations.count} map locations`);
    
    // Fetch and display the seeded locations
    const locations = await prisma.mapLocation.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\nSeeded Map Locations:');
    locations.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name}`);
      console.log(`   Status: ${location.status} | Coords: (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`);
      console.log(`   ID: ${location.id}\n`);
    });
    
  } catch (error) {
    console.error('Error seeding map locations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Function to seed locations without clearing existing data
export const seedMapLocationsWithoutClearing = async (): Promise<void> => {
  try {
    console.log('Starting to seed map locations data (preserving existing)...');
    
    // Seed new locations without clearing existing ones
    const createdLocations = await prisma.mapLocation.createMany({
      data: sampleLocationData,
      skipDuplicates: true,
    });
    
    console.log(`Successfully seeded ${createdLocations.count} new map locations`);
    
    // Get total count of locations
    const totalCount = await prisma.mapLocation.count();
    console.log(`Total map locations in database: ${totalCount}`);
    
  } catch (error) {
    console.error('Error seeding map locations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// If this file is run directly, execute the seeding
if (require.main === module) {
  seedMapLocations()
    .then(() => {
      console.log('✅ Map locations seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Map locations seeding failed:', error);
      process.exit(1);
    });
}
