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

      // Seed courses for Computer Science (compSciProg) across all levels and semesters
      if (prog.id === compSciProg.id) {
        if (lvl === 100) {
          await prisma.course.createMany({
            data: [
              // 100 Level - 1st Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC101', title: 'Introduction to Computer Science', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'COS101', title: 'Introduction to Computing Systems', creditUnit: 2, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'MTH101', title: 'Elementary Mathematics I (Algebra & Trig)', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'PHY101', title: 'General Physics I (Mechanics)', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'GST101', title: 'Use of English & Communication Skills I', creditUnit: 2, courseType: 'General', status: 'ACTIVE' },
              // 100 Level - 2nd Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC102', title: 'Introduction to Problem Solving & Python', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC104', title: 'Discrete Mathematics for Computing', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'MTH102', title: 'Elementary Mathematics II (Calculus)', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'PHY102', title: 'General Physics II (Electricity & Magnetism)', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'GST102', title: 'Use of English & Communication Skills II', creditUnit: 2, courseType: 'General', status: 'ACTIVE' },
            ],
          });
        } else if (lvl === 200) {
          await prisma.course.createMany({
            data: [
              // 200 Level - 1st Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC201', title: 'Computer Programming I (Java)', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC203', title: 'Data Structures & Algorithms', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC205', title: 'Digital Logic & Computer Architecture', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC207', title: 'Linear Algebra for Computing', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'GST201', title: 'Nigerian Peoples & Culture', creditUnit: 2, courseType: 'General', status: 'ACTIVE' },
              // 200 Level - 2nd Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC202', title: 'Object-Oriented Programming (C++)', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC204', title: 'Database Management Systems I', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC206', title: 'Operating Systems Concepts', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC208', title: 'Systems Analysis & Design', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'GST202', title: 'Peace Studies & Conflict Resolution', creditUnit: 2, courseType: 'General', status: 'ACTIVE' },
            ],
          });
        } else if (lvl === 300) {
          await prisma.course.createMany({
            data: [
              // 300 Level - 1st Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC301', title: 'Software Engineering Principles', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC303', title: 'Artificial Intelligence & Expert Systems', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC305', title: 'Computer Networks & Data Communication', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC307', title: 'Web Technologies & Development', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC309', title: 'Theory of Computation & Automata', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              // 300 Level - 2nd Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC302', title: 'Advanced Software Engineering', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC304', title: 'Database Management Systems II (NoSQL)', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC306', title: 'Mobile Application Development', creditUnit: 3, courseType: 'Elective', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC308', title: 'Compiler Construction', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC399', title: 'Industrial Training / SIWES', creditUnit: 6, courseType: 'Core', status: 'ACTIVE' },
            ],
          });
        } else if (lvl === 400) {
          await prisma.course.createMany({
            data: [
              // 400 Level - 1st Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC401', title: 'Final Year Project I', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC403', title: 'Computer Security & Cryptography', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC405', title: 'Cloud Computing & Distributed Systems', creditUnit: 3, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC407', title: 'Data Mining & Machine Learning', creditUnit: 3, courseType: 'Elective', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem1.id, courseCode: 'CSC409', title: 'Parallel & High Performance Computing', creditUnit: 3, courseType: 'Elective', status: 'ACTIVE' },
              // 400 Level - 2nd Semester
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC402', title: 'Final Year Project II', creditUnit: 6, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC404', title: 'Human-Computer Interaction (HCI)', creditUnit: 2, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC406', title: 'Ethics & Professional Practice in IT', creditUnit: 2, courseType: 'Core', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC408', title: 'Deep Learning & Neural Networks', creditUnit: 3, courseType: 'Elective', status: 'ACTIVE' },
              { universityId: gouni.id, facultyId: gouniFacit.id, departmentId: gouniCSDept.id, programmeId: prog.id, levelId: level.id, semesterId: sem2.id, courseCode: 'CSC410', title: 'Emerging Tech & Quantum Computing', creditUnit: 2, courseType: 'Elective', status: 'ACTIVE' },
            ],
          });
        }
      }

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
