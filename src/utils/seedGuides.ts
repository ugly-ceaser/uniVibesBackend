import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleGuideData = [
  {
    title: "How to Register for Courses",
    content: "This guide will walk you through the step-by-step process of registering for courses at the beginning of each semester. First, log into the university portal using your student credentials. Navigate to the 'Course Registration' section and select your current level and semester. Browse through available courses and ensure you meet all prerequisites before adding them to your cart."
  },
  {
    title: "Campus Navigation Guide",
    content: "New to campus? This comprehensive guide covers all major buildings, lecture halls, and important facilities. The main academic block houses most lecture halls (LT1-LT10), while the administrative block contains the registrar's office, bursary, and student affairs. The library is located in the center of campus and offers 24/7 study spaces during exam periods."
  },
  {
    title: "How to Use the University Library",
    content: "Maximize your research potential with our library guide. Learn how to access digital resources, reserve study rooms, and use the catalog system. The library offers access to thousands of academic journals, research databases, and e-books. Don't forget to bring your student ID for access and follow the quiet study zone regulations."
  },
  {
    title: "Student ID Card Application Process",
    content: "Your student ID is essential for campus access and services. Visit the ID card office on the ground floor of the administrative block with two passport photographs, a copy of your admission letter, and school fees receipt. Processing takes 3-5 working days. The ID card serves as your library card, exam entry permit, and access card for various campus facilities."
  },
  {
    title: "How to Pay School Fees Online",
    content: "Follow these simple steps to pay your tuition fees online. Log into the university payment portal using your matriculation number. Select the appropriate session and semester, verify your fee breakdown, and choose your preferred payment method (debit card, bank transfer, or USSD). Always print your receipt for record-keeping purposes."
  },
  {
    title: "Hostel Accommodation Guide",
    content: "Secure on-campus accommodation with this comprehensive hostel guide. Applications open at the beginning of each academic session through the student portal. Priority is given to new students and those from distant locations. Hostel facilities include furnished rooms, common areas, laundry services, and 24-hour security."
  },
  {
    title: "Academic Calendar Overview",
    content: "Stay updated with important academic dates and deadlines. The academic calendar includes registration deadlines, lecture commencement dates, mid-semester breaks, examination periods, and graduation ceremonies. Plan your semester effectively by marking key dates in your personal calendar and setting reminders for critical deadlines."
  },
  {
    title: "How to Apply for Transcript",
    content: "Need your academic transcript? Visit the registrar's office with a completed application form, two passport photographs, and the prescribed fee receipt. Processing typically takes 2-3 weeks for current students and 4-6 weeks for graduates. You can track your application status online using your reference number."
  },
  {
    title: "Student Health Services Guide",
    content: "Access quality healthcare on campus through our student health center. Services include general consultations, emergency care, health screenings, and counseling services. The health center is open Monday-Friday, 8 AM-6 PM, with emergency services available 24/7. Remember to bring your student ID and health insurance information."
  },
  {
    title: "Campus Internet and WiFi Access",
    content: "Stay connected with our campus-wide internet service. Connect to 'UniWiFi' network using your student credentials. High-speed internet is available in all academic buildings, library, hostels, and common areas. For troubleshooting connection issues, contact the IT helpdesk at the computer center or submit a ticket online."
  },
  {
    title: "Student Union and Clubs Guide",
    content: "Get involved in campus life through student organizations. The Student Union represents student interests and organizes various activities throughout the year. Join academic clubs, cultural societies, or sports teams to enhance your university experience. Registration for clubs happens at the beginning of each semester during orientation week."
  },
  {
    title: "Exam Rules and Regulations",
    content: "Ensure exam success by understanding university examination policies. Arrive at the exam venue 30 minutes before the scheduled time with your student ID and writing materials. Strictly prohibited items include phones, books (unless specified), and unauthorized materials. Follow the examination timetable carefully and report any discrepancies immediately."
  },
  {
    title: "Research and Project Guidelines",
    content: "Excel in your research projects with these comprehensive guidelines. Start by identifying a suitable supervisor in your field of interest. Develop a clear research proposal with objectives, methodology, and timeline. Utilize library resources, conduct literature reviews, and maintain regular communication with your supervisor throughout the research process."
  },
  {
    title: "Student Financial Aid Options",
    content: "Explore various financial assistance programs available to students. The university offers merit-based scholarships, need-based grants, and work-study opportunities. Applications are typically due before the start of each academic year. Required documents include academic transcripts, financial need assessment, and recommendation letters."
  },
  {
    title: "Campus Safety and Security Guide",
    content: "Your safety is our priority. Learn about campus security measures, emergency procedures, and safety tips. Security personnel patrol campus 24/7, and emergency call points are located throughout the premises. Report any suspicious activities to campus security immediately and always travel in groups during late hours."
  },
  {
    title: "How to Change Your Course of Study",
    content: "Considering a course change? This guide outlines the process and requirements. Submit a change of course application to the academic office before the specified deadline, usually within the first month of resumption. You may need to meet with an academic advisor and demonstrate valid reasons for the change."
  },
  {
    title: "Graduate School Application Process",
    content: "Planning to pursue postgraduate studies? Start your application process early. Research available programs, admission requirements, and application deadlines. Prepare necessary documents including transcripts, recommendation letters, statement of purpose, and standardized test scores. Submit applications well before the deadline to ensure consideration."
  },
  {
    title: "Campus Dining and Food Services",
    content: "Discover dining options across campus. The main cafeteria offers affordable meals with various local and continental dishes. Operating hours are 7 AM-10 PM on weekdays and 8 AM-8 PM on weekends. Meal plans are available for hostel residents, and several snack bars are located in academic buildings."
  },
  {
    title: "Laboratory Safety Protocols",
    content: "Essential safety guidelines for laboratory work. Always wear appropriate personal protective equipment (PPE) including lab coats, safety goggles, and gloves. Familiarize yourself with emergency shower and eyewash station locations. Report all accidents or injuries to the lab supervisor immediately and follow proper chemical disposal procedures."
  },
  {
    title: "Graduation Requirements and Procedures",
    content: "Prepare for graduation with this comprehensive checklist. Ensure you've completed all required courses and maintained the minimum CGPA. Submit your graduation application by the specified deadline along with required fees. Attend the pre-graduation seminar and collection of graduation materials. Confirm your attendance at the graduation ceremony."
  }
];

export const seedGuides = async (): Promise<void> => {
  try {
    console.log('Starting to seed guide data...');
    
    // Clear existing guides (optional - remove if you want to keep existing data)
    await prisma.guideItem.deleteMany({});
    console.log('Cleared existing guide data');
    
    // Seed new guides
    const createdGuides = await prisma.guideItem.createMany({
      data: sampleGuideData,
      skipDuplicates: true,
    });
    
    console.log(`Successfully seeded ${createdGuides.count} guides`);
    
    // Fetch and display the seeded guides
    const guides = await prisma.guideItem.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        likesCount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\nSeeded Guides:');
    guides.forEach((guide, index) => {
      console.log(`${index + 1}. ${guide.title} (ID: ${guide.id})`);
    });
    
  } catch (error) {
    console.error('Error seeding guides:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Function to seed guides without clearing existing data
export const seedGuidesWithoutClearing = async (): Promise<void> => {
  try {
    console.log('Starting to seed guide data (preserving existing)...');
    
    // Seed new guides without clearing existing ones
    const createdGuides = await prisma.guideItem.createMany({
      data: sampleGuideData,
      skipDuplicates: true,
    });
    
    console.log(`Successfully seeded ${createdGuides.count} new guides`);
    
    // Get total count of guides
    const totalCount = await prisma.guideItem.count();
    console.log(`Total guides in database: ${totalCount}`);
    
  } catch (error) {
    console.error('Error seeding guides:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// If this file is run directly, execute the seeding
if (require.main === module) {
  seedGuides()
    .then(() => {
      console.log('✅ Guide seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Guide seeding failed:', error);
      process.exit(1);
    });
}
