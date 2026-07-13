import { PrismaClient } from '@prisma/client';

export async function seedUniversityData(prisma: PrismaClient) {
  console.log('🌱 Seeding University, Faculty, Department, Programme, Level, and Semester data...');

  // 1. Clear existing data
  await prisma.courseAuditLog.deleteMany({});
  await prisma.courseSubmissionSupport.deleteMany({});
  await prisma.courseSubmission.deleteMany({});
  await prisma.courseVersion.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.level.deleteMany({});
  await prisma.programme.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.academicSession.deleteMany({});
  await prisma.university.deleteMany({});

  // 2. Create Universities
  const gouni = await prisma.university.create({
    data: {
      name: 'Godfrey Okoye University',
      shortName: 'GOUNI',
      country: 'Nigeria',
      state: 'Enugu',
      logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&h=100&fit=crop',
      status: 'ACTIVE',
    },
  });

  const caritas = await prisma.university.create({
    data: {
      name: 'Caritas University',
      shortName: 'Caritas',
      country: 'Nigeria',
      state: 'Enugu',
      logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&h=100&fit=crop',
      status: 'ACTIVE',
    },
  });

  // Seed academic sessions
  await prisma.academicSession.createMany({
    data: [
      { universityId: gouni.id, session: '2025/2026' },
      { universityId: caritas.id, session: '2025/2026' },
    ],
  });

  // 3. Godfrey Okoye University (GOUNI) Details
  // College of Medicine
  const gouniMedicine = await prisma.faculty.create({
    data: { universityId: gouni.id, name: 'College of Medicine' },
  });
  const gouniMedicineDept = await prisma.department.create({
    data: { facultyId: gouniMedicine.id, name: 'Medicine & Surgery' },
  });
  const gouniMedicineProg = await prisma.programme.create({
    data: { departmentId: gouniMedicineDept.id, name: 'Medicine & Surgery', degreeType: 'MBBS' },
  });

  // Faculty of Allied Health Sciences
  const gouniAlliedHealth = await prisma.faculty.create({
    data: { universityId: gouni.id, name: 'Faculty of Allied Health Sciences' },
  });
  const gouniNursingDept = await prisma.department.create({
    data: { facultyId: gouniAlliedHealth.id, name: 'Nursing Science' },
  });
  const gouniNursingProg = await prisma.programme.create({
    data: { departmentId: gouniNursingDept.id, name: 'Nursing Science', degreeType: 'BSc' },
  });

  // Faculty of Computing and Information Technology (FACIT)
  const gouniFacit = await prisma.faculty.create({
    data: { universityId: gouni.id, name: 'Faculty of Computing and Information Technology (FACIT)' },
  });
  const gouniCSDept = await prisma.department.create({
    data: { facultyId: gouniFacit.id, name: 'Computer Science & IT' },
  });
  
  const compSciProg = await prisma.programme.create({
    data: { departmentId: gouniCSDept.id, name: 'Computer Science', degreeType: 'BSc' },
  });
  const softEngProg = await prisma.programme.create({
    data: { departmentId: gouniCSDept.id, name: 'Software Engineering', degreeType: 'BSc' },
  });
  const cyberProg = await prisma.programme.create({
    data: { departmentId: gouniCSDept.id, name: 'Cybersecurity', degreeType: 'BSc' },
  });
  const dataSciProg = await prisma.programme.create({
    data: { departmentId: gouniCSDept.id, name: 'Data Science', degreeType: 'BSc' },
  });

  // 4. Seed Levels and Semesters for GOUNI Software Engineering & Computer Science
  const programmes = [compSciProg, softEngProg, cyberProg, dataSciProg, gouniMedicineProg, gouniNursingProg];
  
  for (const prog of programmes) {
    const sem1 = await prisma.semester.create({
      data: { programmeId: prog.id, name: 'First Semester' },
    });
    const sem2 = await prisma.semester.create({
      data: { programmeId: prog.id, name: 'Second Semester' },
    });

    // Levels 100 to 400 (or 500 for MBBS)
    const maxLevel = prog.degreeType === 'MBBS' ? 500 : 400;
    for (let lvl = 100; lvl <= maxLevel; lvl += 100) {
      const level = await prisma.level.create({
        data: { programmeId: prog.id, level: lvl },
      });

      // Seed mock courses for Level 100 & 200 of Software Engineering
      if (prog.id === softEngProg.id && lvl === 100) {
        await prisma.course.createMany({
          data: [
            {
              universityId: gouni.id,
              facultyId: gouniFacit.id,
              departmentId: gouniCSDept.id,
              programmeId: prog.id,
              levelId: level.id,
              semesterId: sem1.id,
              courseCode: 'SEN101',
              title: 'Introduction to Software Engineering',
              creditUnit: 3,
              courseType: 'Core',
              status: 'ACTIVE',
            },
            {
              universityId: gouni.id,
              facultyId: gouniFacit.id,
              departmentId: gouniCSDept.id,
              programmeId: prog.id,
              levelId: level.id,
              semesterId: sem1.id,
              courseCode: 'CSC101',
              title: 'Introduction to Computer Science',
              creditUnit: 3,
              courseType: 'Core',
              status: 'ACTIVE',
            },
            {
              universityId: gouni.id,
              facultyId: gouniFacit.id,
              departmentId: gouniCSDept.id,
              programmeId: prog.id,
              levelId: level.id,
              semesterId: sem2.id,
              courseCode: 'SEN102',
              title: 'Software Engineering Workshop I',
              creditUnit: 2,
              courseType: 'Core',
              status: 'ACTIVE',
            },
            {
              universityId: gouni.id,
              facultyId: gouniFacit.id,
              departmentId: gouniCSDept.id,
              programmeId: prog.id,
              levelId: level.id,
              semesterId: sem2.id,
              courseCode: 'CSC102',
              title: 'Structured Programming (C)',
              creditUnit: 3,
              courseType: 'Core',
              status: 'ACTIVE',
            },
          ],
        });
      }
    }
  }

  // 5. Caritas University details
  const caritasEngineering = await prisma.faculty.create({
    data: { universityId: caritas.id, name: 'Faculty of Engineering' },
  });
  const caritasChemDept = await prisma.department.create({
    data: { facultyId: caritasEngineering.id, name: 'Chemical Engineering' },
  });
  const caritasChemProg = await prisma.programme.create({
    data: { departmentId: caritasChemDept.id, name: 'Chemical Engineering', degreeType: 'BEng' },
  });

  const caritasSem1 = await prisma.semester.create({
    data: { programmeId: caritasChemProg.id, name: 'First Semester' },
  });
  const caritasSem2 = await prisma.semester.create({
    data: { programmeId: caritasChemProg.id, name: 'Second Semester' },
  });

  // Seed levels and semesters for Caritas Chemical Engineering
  for (let lvl = 100; lvl <= 500; lvl += 100) {
    const level = await prisma.level.create({
      data: { programmeId: caritasChemProg.id, level: lvl },
    });

    if (lvl === 100) {
      await prisma.course.createMany({
        data: [
          {
            universityId: caritas.id,
            facultyId: caritasEngineering.id,
            departmentId: caritasChemDept.id,
            programmeId: caritasChemProg.id,
            levelId: level.id,
            semesterId: caritasSem1.id,
            courseCode: 'CHE101',
            title: 'Introduction to Chemical Engineering',
            creditUnit: 3,
            courseType: 'Core',
            status: 'ACTIVE',
          },
        ],
      });
    }
  }

  console.log('✅ University data seeded successfully!');
}
