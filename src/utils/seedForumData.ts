import { PrismaClient } from '@prisma/client';

export async function seedForumData(prisma: PrismaClient) {
  console.log('🏛️ Starting forum data seeding for GO University...');

  // Sample forum categories
  const forumCategories = [
    { name: 'General Discussion', description: 'General university discussions' },
    { name: 'Academic Help', description: 'Get help with coursework and assignments' },
    { name: 'Student Life', description: 'Campus life, events, and social activities' },
    { name: 'Career & Internships', description: 'Job opportunities and career advice' },
    { name: 'Tech & Programming', description: 'Programming help and tech discussions' },
    { name: 'Campus Services', description: 'Library, dining, housing questions' },
  ];

  // Create forums first
  console.log('Creating forums...');
  const forums = [];
  
  // Get admin user for forum creation
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('⚠️ No admin user found. Creating default admin...');
    const defaultAdmin = await prisma.user.create({
      data: {
        email: 'admin@gouniversity.edu',
        fullname: 'System Administrator',
        password: 'hashedPassword123', // In real app, this would be properly hashed
        role: 'ADMIN',
        verificationStatus: true,
      }
    });
    
    for (const category of forumCategories) {
      const forum = await prisma.forum.create({
        data: {
          name: category.name,
          creatorId: defaultAdmin.id,
          verificationStatus: true,
          visibiltyStatus: true,
        }
      });
      forums.push(forum);
    }
  } else {
    for (const category of forumCategories) {
      const forum = await prisma.forum.create({
        data: {
          name: category.name,
          creatorId: adminUser.id,
          verificationStatus: true,
          visibiltyStatus: true,
        }
      });
      forums.push(forum);
    }
  }

  // Sample student users for posts
  const studentUsers = [
    { email: 'alice.johnson@student.go.edu', fullname: 'Alice Johnson' },
    { email: 'bob.smith@student.go.edu', fullname: 'Bob Smith' },
    { email: 'carol.brown@student.go.edu', fullname: 'Carol Brown' },
    { email: 'david.wilson@student.go.edu', fullname: 'David Wilson' },
    { email: 'emma.davis@student.go.edu', fullname: 'Emma Davis' },
    { email: 'frank.miller@student.go.edu', fullname: 'Frank Miller' },
    { email: 'grace.lee@student.go.edu', fullname: 'Grace Lee' },
    { email: 'henry.garcia@student.go.edu', fullname: 'Henry Garcia' },
    { email: 'ivy.martinez@student.go.edu', fullname: 'Ivy Martinez' },
    { email: 'jack.anderson@student.go.edu', fullname: 'Jack Anderson' },
  ];

  // Create student users
  console.log('Creating student users...');
  const createdUsers = [];
  for (const userData of studentUsers) {
    try {
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: 'hashedPassword123', // In real app, this would be properly hashed
          role: 'STUDENT',
          verificationStatus: true,
        }
      });
      createdUsers.push(user);
    } catch (error) {
      // User might already exist, try to find them
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      if (existingUser) {
        createdUsers.push(existingUser);
      }
    }
  }

  // Sample questions data
  const questionTemplates = [
    // General Discussion
    {
      forumIndex: 0,
      questions: [
        { title: "Welcome new students! Introduce yourself here", body: "Hey everyone! Let's get to know each other. Share your name, major, and one fun fact about yourself!" },
        { title: "What's your favorite spot on campus?", body: "I'm curious to know where everyone likes to hang out on campus. Share your favorite study spots, relaxation areas, or hidden gems!" },
        { title: "GO University traditions - what should freshmen know?", body: "Every university has its traditions. What are some GO University traditions that new students should be aware of?" },
        { title: "Best coffee on campus?", body: "Coffee is essential for student survival. Where can I find the best coffee on or near campus?" },
        { title: "Campus Wi-Fi issues - anyone else experiencing problems?", body: "The Wi-Fi in the library keeps dropping out. Is anyone else having connectivity issues around campus?" },
        { title: "Lost and Found - missing blue backpack", body: "I left my blue JanSport backpack in the cafeteria yesterday. Has anyone seen it? It has my laptop and textbooks inside." },
        { title: "Best places to eat near campus", body: "Getting tired of cafeteria food. What are some good restaurants or food trucks near GO University?" },
      ]
    },
    // Academic Help
    {
      forumIndex: 1,
      questions: [
        { title: "Help with Calculus 2 - Integration by parts", body: "I'm struggling with integration by parts in Calc 2. Can someone explain the LIATE rule and walk through an example?" },
        { title: "Chemistry Lab Report Format", body: "Does anyone have a template or example of a properly formatted chemistry lab report? My professor is very picky about formatting." },
        { title: "Study groups for Organic Chemistry", body: "Looking to form a study group for Organic Chem. We could meet twice a week in the library. Who's interested?" },
        { title: "Statistics homework - probability distributions", body: "Can someone help me understand the difference between binomial and normal distributions? I have a quiz tomorrow!" },
        { title: "Research paper citation help - APA vs MLA", body: "When should I use APA format versus MLA? My professor wasn't clear about this for our research paper." },
        { title: "Physics 101 - projectile motion problems", body: "I keep getting the wrong answers for projectile motion problems. Can someone check my approach and see where I'm going wrong?" },
        { title: "Writing center appointments - how to book?", body: "I need help with my essay but can't figure out how to book an appointment at the writing center. Has anyone used their services?" },
      ]
    },
    // Student Life
    {
      forumIndex: 2,
      questions: [
        { title: "Dorm life - roommate etiquette tips", body: "Living with a roommate for the first time. Any tips on how to be a good roommate and avoid conflicts?" },
        { title: "Upcoming events this weekend", body: "What events are happening on campus this weekend? Looking for something fun to do!" },
        { title: "Joining clubs and organizations", body: "I want to get more involved on campus. What clubs would you recommend for someone interested in community service?" },
        { title: "Gym membership and facilities", body: "Is the campus gym included in tuition? What equipment do they have available for students?" },
        { title: "Parking on campus - tips for finding spots", body: "Parking is always a nightmare. Does anyone have tips for finding parking spots, especially during peak hours?" },
        { title: "Laundry room etiquette", body: "Some people leave their clothes in the washing machines for hours. What's the proper etiquette for shared laundry facilities?" },
        { title: "Best apps for college students", body: "What apps do you find most useful as a college student? Looking for productivity, study, and social apps." },
      ]
    },
    // Career & Internships
    {
      forumIndex: 3,
      questions: [
        { title: "Summer internship applications - when to start?", body: "When should I start applying for summer internships? I'm a sophomore in computer science." },
        { title: "Resume review - engineering student", body: "Would anyone be willing to review my resume? I'm applying for engineering internships and want to make sure it's competitive." },
        { title: "Interview tips for tech companies", body: "I have interviews coming up with several tech companies. Any tips for technical interviews and coding challenges?" },
        { title: "Networking events on campus", body: "Are there any networking events or career fairs coming up? I want to start building professional connections." },
        { title: "LinkedIn profile optimization", body: "How should I optimize my LinkedIn profile as a college student with limited work experience?" },
        { title: "Part-time jobs while studying", body: "Looking for part-time work that won't interfere too much with my studies. Any recommendations for student-friendly jobs?" },
      ]
    },
    // Tech & Programming
    {
      forumIndex: 4,
      questions: [
        { title: "Python vs Java - which to learn first?", body: "I'm new to programming and can't decide between Python and Java for my first language. What are the pros and cons of each?" },
        { title: "Git and GitHub tutorial recommendations", body: "I need to learn version control for my programming classes. Can anyone recommend good Git/GitHub tutorials for beginners?" },
        { title: "Web development stack - beginner friendly", body: "Want to start learning web development. What's a good beginner-friendly tech stack to start with?" },
        { title: "Code review - Python sorting algorithm", body: "Can someone review my bubble sort implementation in Python? I think there might be a more efficient way to do this." },
        { title: "Best IDEs for different programming languages", body: "What IDEs do you recommend for Python, Java, and C++? I'm looking for something with good debugging features." },
        { title: "Database design for class project", body: "Working on a database project and need advice on normalization. Should I always aim for 3NF or are there exceptions?" },
      ]
    },
    // Campus Services
    {
      forumIndex: 5,
      questions: [
        { title: "Library hours during finals week", body: "Does the library extend its hours during finals week? I need a quiet place to study late into the night." },
        { title: "Dining hall meal plan options", body: "Which meal plan offers the best value? I'm trying to decide between the different options available." },
        { title: "Health center services and appointments", body: "How do I schedule an appointment at the campus health center? Do they handle minor injuries and illnesses?" },
        { title: "Housing applications for next year", body: "When do housing applications open for next year? I want to make sure I don't miss the deadline." },
        { title: "Printing services on campus", body: "Where can I print documents on campus besides the library? I need to print a lot of pages for my research project." },
        { title: "IT support for student devices", body: "My laptop is having issues connecting to the campus network. Does IT support help with personal devices?" },
      ]
    },
  ];

  // Create questions, answers, and comments
  console.log('Creating questions, answers, and comments...');
  let totalQuestionsCreated = 0;
  let totalAnswersCreated = 0;
  let totalCommentsCreated = 0;

  for (const template of questionTemplates) {
    const forum = forums[template.forumIndex];
    // Map forum index to enum
    const categoryByIndex = [
      'GENERAL_DISCUSSION',
      'ACADEMIC_HELP',
      'STUDENT_LIFE',
      'CAREER_AND_INTERNSHIPS',
      'TECH_AND_PROGRAMMING',
      'CAMPUS_SERVICES',
    ] as const;
    const category = categoryByIndex[template.forumIndex];
    
    for (const questionData of template.questions) {
      // Create question
      const randomAuthor = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      const question = await prisma.question.create({
        data: ({
          title: questionData.title,
          body: questionData.body,
          forumId: forum.id,
          authorId: randomAuthor.id,
          status: 'Cleared',
          category: category,
        } as any)
      });
      
      totalQuestionsCreated++;

      // Create 1-4 answers for each question
      const numAnswers = Math.floor(Math.random() * 4) + 1;
      
      for (let i = 0; i < numAnswers; i++) {
        const answerAuthor = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        
        // Sample answer content based on question topic
        const answerContent = generateAnswerContent(questionData.title, questionData.body);
        
        const answer = await prisma.answer.create({
          data: {
            body: answerContent,
            questionId: question.id,
            authorId: answerAuthor.id,
            status: 'Cleared',
          }
        });
        
        totalAnswersCreated++;

        // Create 0-3 comments for each answer
        const numComments = Math.floor(Math.random() * 4);
        
        for (let j = 0; j < numComments; j++) {
          const commentAuthor = createdUsers[Math.floor(Math.random() * createdUsers.length)];
          
          const commentContent = generateCommentContent();
          
          await prisma.comment.create({
            data: {
              body: commentContent,
              answerId: answer.id,
              authorId: commentAuthor.id,
              status: 'Cleared',
            }
          });
          
          totalCommentsCreated++;
        }

        // Update answer's comment count
        await prisma.answer.update({
          where: { id: answer.id },
          data: { commentsCount: numComments }
        });
      }
    }
  }

  console.log(`✅ Forum data seeding completed!`);
  console.log(`📊 Created ${forums.length} forums`);
  console.log(`📊 Created ${createdUsers.length} student users`);
  console.log(`📊 Created ${totalQuestionsCreated} questions`);
  console.log(`📊 Created ${totalAnswersCreated} answers`);
  console.log(`📊 Created ${totalCommentsCreated} comments`);

  return {
    forums: forums.length,
    users: createdUsers.length,
    questions: totalQuestionsCreated,
    answers: totalAnswersCreated,
    comments: totalCommentsCreated,
  };
}

function generateAnswerContent(questionTitle: string, questionBody: string): string {
  const answerTemplates = [
    // Academic answers
    "Great question! I had the same problem last semester. Here's what helped me: {specific_advice}. You can also check out the resources in the library or ask the TA during office hours.",
    
    "I struggled with this too! What really clicked for me was {solution_approach}. Also, there are some great YouTube videos that explain this concept really well.",
    
    "Have you tried {suggestion}? That usually works for me. If you're still having trouble, the professor has office hours on Tuesdays and Thursdays from 2-4 PM.",
    
    // General discussion answers
    "Thanks for asking this! I think {opinion_or_advice}. It's definitely something worth considering, especially for new students.",
    
    "I can help with this! Based on my experience, {personal_experience}. Hope this helps!",
    
    "Good point about {topic_reference}. I've noticed this too. Maybe we could {collaborative_suggestion}?",
    
    // Campus life answers
    "I love this topic! My recommendation would be {recommendation}. I've been doing this since freshman year and it's been great.",
    
    "Absolutely! {enthusiastic_agreement} I think more students should know about this. Feel free to reach out if you want to {offer_to_help}.",
  ];

  // Select appropriate template based on question content
  let template = answerTemplates[Math.floor(Math.random() * answerTemplates.length)];
  
  // Replace placeholders with context-appropriate content
  if (questionTitle.toLowerCase().includes('help') || questionTitle.toLowerCase().includes('study')) {
    template = template.replace('{specific_advice}', 'breaking it down into smaller steps and practicing daily')
                      .replace('{solution_approach}', 'working through practice problems systematically')
                      .replace('{suggestion}', 'forming a study group');
  } else if (questionTitle.toLowerCase().includes('campus') || questionTitle.toLowerCase().includes('dorm')) {
    template = template.replace('{recommendation}', 'exploring different areas during your free time')
                      .replace('{personal_experience}', 'I found some amazing quiet spots by just wandering around')
                      .replace('{offer_to_help}', 'explore together sometime');
  } else {
    template = template.replace('{opinion_or_advice}', 'this is really valuable information for everyone')
                      .replace('{topic_reference}', 'what you mentioned')
                      .replace('{collaborative_suggestion}', 'work together to find a solution')
                      .replace('{enthusiastic_agreement}', 'This is so important!')
                      .replace('{recommendation}', 'checking out the options available')
                      .replace('{personal_experience}', 'this has been my experience as well')
                      .replace('{offer_to_help}', 'discuss this further');
  }

  return template;
}

function generateCommentContent(): string {
  const commentTemplates = [
    "Thanks for sharing this! Really helpful.",
    "I agree with this approach. Worked for me too.",
    "Great point! I hadn't thought of that.",
    "This is exactly what I was looking for. Thank you!",
    "Can you provide more details about this?",
    "I tried this and it worked perfectly. Thanks!",
    "Good suggestion! I'll definitely try this.",
    "This makes so much sense now. Appreciate the explanation!",
    "Have you considered trying this alternative approach as well?",
    "Thanks for taking the time to explain this clearly.",
    "This helped me understand the concept much better.",
    "I was struggling with the same thing. This is perfect!",
    "Really appreciate you sharing your experience.",
    "This is a game-changer! Thanks for the tip.",
    "Great advice! I wish I had known this earlier.",
  ];

  return commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
}

export async function clearForumData(prisma: PrismaClient) {
  console.log('🗑️ Clearing existing forum data...');
  
  // Delete in correct order to avoid foreign key constraints
  await prisma.comment.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.forum.deleteMany({});
  
  // Only delete users that were created for seeding (student users)
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@student.go.edu'
      }
    }
  });
  
  console.log('✅ Forum data cleared successfully');
}

export async function getForumDataStats(prisma: PrismaClient) {
  const [forumCount, questionCount, answerCount, commentCount, studentUserCount] = await Promise.all([
    prisma.forum.count(),
    prisma.question.count(),
    prisma.answer.count(),
    prisma.comment.count(),
    prisma.user.count({
      where: {
        email: {
          endsWith: '@student.go.edu'
        }
      }
    }),
  ]);

  return {
    forums: forumCount,
    questions: questionCount,
    answers: answerCount,
    comments: commentCount,
    students: studentUserCount,
  };
}
