import { PrismaClient, Role, DocStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 ກຳລັງເລີ່ມຕົ້ນການນຳເຂົ້າຂໍ້ມູນຕົວຢ່າງ (Seeding Data in Lao Language)...');

  // ລຶບຂໍ້ມູນເກົ່າອອກຕາມລຳດັບຄວາມສຳພັນ
  await prisma.userActivity.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.category.deleteMany();

  // 1. ສ້າງຂໍ້ມູນ ຄະນະ (Faculties) ແລະ ພາກວິຊາ (Departments)
  const fe = await prisma.faculty.create({
    data: {
      name: 'ຄະນະວິສະວະກຳສາດ (Faculty of Engineering)',
      code: 'FE',
      departments: {
        create: [
          { name: 'ພາກວິຊາວິສະວະກຳຄອມພິວເຕີ ແລະ ເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ' },
          { name: 'ພາກວິຊາວິສະວະກຳໂຍທາ' },
          { name: 'ພາກວິຊາວິສະວະກຳໄຟຟ້າ ແລະ ເອເລັກໂຕຣນິກ' },
        ],
      },
    },
    include: { departments: true },
  });

  const feb = await prisma.faculty.create({
    data: {
      name: 'ຄະນະເສດຖະສາດ ແລະ ບໍລິຫານທຸລະກິດ (Faculty of Economics and Business Management)',
      code: 'FEB',
      departments: {
        create: [
          { name: 'ພາກວິຊາເສດຖະສາດ' },
          { name: 'ພາກວິຊາການເງິນ ແລະ ການທະນາຄານ' },
          { name: 'ພາກວິຊາບໍລິຫານທຸລະກິດ' },
        ],
      },
    },
    include: { departments: true },
  });

  const fns = await prisma.faculty.create({
    data: {
      name: 'ຄະນະວິທະຍາສາດທຳມະຊາດ (Faculty of Natural Sciences)',
      code: 'FNS',
      departments: {
        create: [
          { name: 'ພາກວິຊາວິທະຍາສາດຄອມພິວເຕີ' },
          { name: 'ພາກວິຊາຄະນິດສາດ ແລະ ສະຖິຕິ' },
          { name: 'ພາກວິຊາຟີຊິກສາດ' },
        ],
      },
    },
    include: { departments: true },
  });

  const fl = await prisma.faculty.create({
    data: {
      name: 'ຄະນະອັກສອນສາດ (Faculty of Letters)',
      code: 'FL',
      departments: {
        create: [
          { name: 'ພາກວິຊາພາສາລາວ ແລະ ສື່ສານມວນຊົນ' },
          { name: 'ພາກວິຊາພາສາອັງກິດ' },
          { name: 'ພາກວິຊາປະຫວັດສາດ ແລະ ມະນຸດວິທະຍາ' },
        ],
      },
    },
    include: { departments: true },
  });

  console.log('✅ ສ້າງຂໍ້ມູນ ຄະນະ ແລະ ພາກວິຊາ ສຳເລັດແລ້ວ');

  // 2. ສ້າງຂໍ້ມູນ ໝວດໝູ່ເອກະສານ (Categories)
  const catThesis = await prisma.category.create({
    data: { name: 'ບົດວິທະຍານິພົນ ປະລິນຍາໂທ ແລະ ເອກ' },
  });
  const catResearch = await prisma.category.create({
    data: { name: 'ບົດຄົ້ນຄວ້າວິທະຍາສາດຂອງຄູອາຈານ' },
  });
  const catJournal = await prisma.category.create({
    data: { name: 'ວາລະສານວິຊາການ ມຊ' },
  });
  const catConference = await prisma.category.create({
    data: { name: 'ເອກະສານກອງປະຊຸມວິຊາການ' },
  });
  const catCaseStudy = await prisma.category.create({
    data: { name: 'ກໍລະນີສຶກສາ ແລະ ບົດວິໄຈພາກທຸລະກິດ' },
  });
  const catTextbook = await prisma.category.create({
    data: { name: 'ປຶ້ມແບບຮຽນ ແລະ ຕຳລາປະກອບການສອນ' },
  });

  console.log('✅ ສ້າງຂໍ້ມູນ ໝວດໝູ່ເອກະສານ ສຳເລັດແລ້ວ');

  // 3. ສ້າງບັນຊີຜູ້ໃຊ້ງານ (Users)
  const defaultHash = await bcrypt.hash('Nuol@1234', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.create({
    data: {
      userCode: 'AD001',
      password: adminHash,
      email: 'admin@nuol.edu.la',
      firstName: 'ສົມພອນ',
      lastName: 'ອິນທະວົງ',
      role: Role.ADMIN,
    },
  });

  const teacherEng = await prisma.user.create({
    data: {
      userCode: 'TC001',
      password: teacherHash,
      email: 'dr.sengkeo@fe.nuol.edu.la',
      firstName: 'ດຣ. ແສງແກ້ວ',
      lastName: 'ວົງໄຊ',
      role: Role.TEACHER,
      facultyId: fe.id,
      departmentId: fe.departments[0].id,
    },
  });

  const teacherEcon = await prisma.user.create({
    data: {
      userCode: 'TC002',
      password: defaultHash,
      email: 'k.phommachanh@feb.nuol.edu.la',
      firstName: 'ອາຈານ ແກ້ວ',
      lastName: 'ພົມມະຈັນ',
      role: Role.TEACHER,
      facultyId: feb.id,
      departmentId: feb.departments[0].id,
    },
  });

  const studentEng = await prisma.user.create({
    data: {
      userCode: 'ST001',
      password: studentHash,
      email: 'khamla.st001@fe.nuol.edu.la',
      firstName: 'ຄຳຫຼ້າ',
      lastName: 'ໄຊຍະວົງ',
      role: Role.STUDENT,
      facultyId: fe.id,
      departmentId: fe.departments[0].id,
    },
  });

  const studentEcon = await prisma.user.create({
    data: {
      userCode: 'ST002',
      password: defaultHash,
      email: 'manivone.st002@feb.nuol.edu.la',
      firstName: 'ມະນີວອນ',
      lastName: 'ສຸດາຈັນ',
      role: Role.STUDENT,
      facultyId: feb.id,
      departmentId: feb.departments[1].id,
    },
  });

  console.log('✅ ສ້າງຜູ້ໃຊ້ງານ ສຳເລັດ: AD001, TC001, TC002, ST001, ST002');

  // 4. ສ້າງຂໍ້ມູນ ເອກະສານວິຊາການ (Documents)
  const doc1 = await prisma.document.create({
    data: {
      title: 'ການເພີ່ມປະສິດທິພາບໂຄງລ່າງພື້ນຖານຄລາວ (Cloud Infrastructure) ສຳລັບສະຖາບັນການສຶກສາຊັ້ນສູງ',
      abstract: 'ການສຶກສາວິໄຈແບບຮອບດ້ານກ່ຽວກັບການຫຼຸດຜ່ອນເວລາຕອບສະໜອງ (Latency) ແລະ ການຍົກລະດັບຄວາມປອດໄພຂອງຂໍ້ມູນໃນເຄືອຂ່າຍມະຫາວິທະຍາໄລ ໂດຍການນຳໃຊ້ລະບົບຄຳນວນແບບກະຈາຍ Edge Computing ແລະ ສະຖາປັດຕະຍະກຳ Microservices ທີ່ເໝາະສົມກັບສະພາບການນຳໃຊ້ຕົວຈິງໃນ ສປປ ລາວ.',
      author: 'ດຣ. ແສງແກ້ວ ວົງໄຊ',
      publishedYear: 2024,
      status: DocStatus.AVAILABLE,
      fileUrl: '/uploads/sample-cloud-optimization.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60',
      tags: ['Cloud Computing', 'ຄວາມປອດໄພທາງໄຊເບີ', 'ເຄືອຂ່າຍຄອມພິວເຕີ', 'Edge Computing'],
      categoryId: catResearch.id,
      facultyId: fe.id,
      departmentId: fe.departments[0].id,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'ການວາງແຜນຜັງເມືອງແບບຍືນຍົງ ແລະ ການຄຸ້ມຄອງລະບົບລະບາຍນ້ຳໃນນະຄອນຫຼວງວຽງຈັນ',
      abstract: 'ການວິເຄາະການພັດທະນາພື້ນຖານໂຄງລ່າງໃນຕົວເມືອງ ໂດຍນຳໃຊ້ແບບຈຳລອງພູມສັນຖານສາມມິຕິ (GIS) ເພື່ອປະເມີນເຂດສ່ຽງໄພນ້ຳຖ້ວມຂັງ ແລະ ການວາງແນວທາງໃນການສ້າງເຂດສີຂຽວເພື່ອຮອງຮັບການປ່ຽນແປງຂອງດິນຟ້າອາກາດໃນເຂດຕົວເມືອງໃຫຍ່.',
      author: 'ປອ. ພອນໄຊ ຫຼວງລາດ ແລະ ທ. ຕຸ້ຍ ສິດທິເດດ',
      publishedYear: 2023,
      status: DocStatus.AVAILABLE,
      fileUrl: '/uploads/sample-urban-planning.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60',
      tags: ['ຜັງເມືອງ', 'ວິສະວະກຳໂຍທາ', 'ອຸທົກກະສາດ', 'ການພັດທະນາແບບຍືນຍົງ'],
      categoryId: catThesis.id,
      facultyId: fe.id,
      departmentId: fe.departments[1].id,
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      title: 'ຄວາມທົນທານທາງເສດຖະກິດ ແລະ ການເຂົ້າເຖິງການເງິນດິຈິຕອນຂອງວິສາຫະກິດຂະໜາດນ້ອຍ ແລະ ກາງ (SMEs) ໃນ ສປປ ລາວ',
      abstract: 'ບົດວິເຄາະເຊີງປະຈັກຕາກ່ຽວກັບຍຸດທະສາດການຟື້ນຟູທຸລະກິດພາຍຫຼັງວິກິດການເສດຖະກິດ ໂດຍສຸມໃສ່ບົດບາດຂອງ FinTech, Mobile Banking ແລະ ການຊຳລະເງິນຜ່ານລະບົບດິຈິຕອນ ຕໍ່ການເພີ່ມສະພາບຄ່ອງທາງການເງິນຂອງຜູ້ປະກອບການລາຍຍ່ອຍ.',
      author: 'ອາຈານ ແກ້ວ ພົມມະຈັນ',
      publishedYear: 2024,
      status: DocStatus.AVAILABLE,
      fileUrl: '/uploads/sample-asean-resilience.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
      tags: ['ເສດຖະສາດ', 'ການເງິນດິຈິຕອນ', 'SMEs', 'FinTech', 'ນະໂຍບາຍການເງິນ'],
      categoryId: catJournal.id,
      facultyId: feb.id,
      departmentId: feb.departments[1].id,
    },
  });

  const doc4 = await prisma.document.create({
    data: {
      title: 'ການພັດທະນາຕົວແບບການຮຽນຮູ້ຂອງເຄື່ອງ (Machine Learning) ສຳລັບການປະມວນຜົນພາສາລາວທຳມະຊາດ (NLP) ແລະ ການອ່ານໂຕໜັງສືໃບລານ',
      abstract: 'ການວິໄຈ ແລະ ອອກແບບສະຖາປັດຕະຍະກຳ Transformer ສະເພາະພາສາລາວ ເພື່ອການແປງຮູບພາບເອກະສານໃບລານບູຮານໃຫ້ເປັນຂໍ້ຄວາມດິຈິຕອນ (OCR) ພ້ອມທັງລະບົບການສະຫຼຸບເນື້ອໃນເອກະສານພາສາລາວແບບອັດຕະໂນມັດ.',
      author: 'ຄຳຫຼ້າ ໄຊຍະວົງ ແລະ ດຣ. ແສງແກ້ວ ວົງໄຊ',
      publishedYear: 2024,
      status: DocStatus.AVAILABLE,
      fileUrl: '/uploads/sample-lao-nlp.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
      tags: ['ປັນຍາປະດິດ', 'NLP', 'Machine Learning', 'OCR', 'ພາສາລາວ'],
      categoryId: catThesis.id,
      facultyId: fe.id,
      departmentId: fe.departments[0].id,
    },
  });

  const doc5 = await prisma.document.create({
    data: {
      title: 'ການເຊື່ອມໂຍງພະລັງງານທົດແທນ ແສງຕາເວັນ ແລະ ພະລັງງານນ້ຳ ເຂົ້າສູ່ຕາຂ່າຍໄຟຟ້າແຫ່ງຊາດ ໃນເຂດອ່າງແມ່ນ້ຳຂອງ',
      abstract: 'ການສຶກສາຄວາມໝັ້ນຄົງຂອງລະບົບສາຍສົ່ງ ແລະ ແບບຈຳລອງການຜະລິດໄຟຟ້າແບບປະສົມປະສານ (Solar-Hydro Hybrid) ເພື່ອຮັກສາສະຖຽນລະພາບຂອງແຮງດັນໄຟຟ້າ ແລະ ການຫຼຸດຜ່ອນການປ່ອຍອາຍກາກໂບນິກໃນພາກພື້ນ.',
      author: 'ດຣ. ບຸນທະວີ ຈັນທະວົງ',
      publishedYear: 2024,
      status: DocStatus.AVAILABLE,
      fileUrl: '/uploads/sample-renewable-energy.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=60',
      tags: ['ພະລັງງານສະອາດ', 'ວິສະວະກຳໄຟຟ້າ', 'Smart Grid', 'ພະລັງງານແສງຕາເວັນ'],
      categoryId: catConference.id,
      facultyId: fe.id,
      departmentId: fe.departments[2].id,
    },
  });

  const doc6 = await prisma.document.create({
    data: {
      title: 'ການສຶກສາປຽບທຽບໂຄງສ້າງໄວຍາກອນພາສາລາວບູຮານ ແລະ ພາສາລາວປັດຈຸບັນ ໃນວັນນະຄະດີພື້ນເມືອງ',
      abstract: 'ບົດວິໄຈທາງພາສາສາດທີ່ສຶກສາການວິວັດທະນາການຂອງຄຳສັບ, ຄວາມໝາຍ, ແລະ ລະບົບສຽງໃນວັນນະຄະດີເລື່ອງສັງສິນໄຊ ແລະ ສຽວສະຫວາດ ປຽບທຽບກັບການນຳໃຊ້ພາສາລາວມາດຕະຖານໃນຍຸກປັດຈຸບັນ.',
      author: 'ຮສ. ດຣ. ບົວລີ ວັນນະວົງ',
      publishedYear: 2023,
      status: DocStatus.AVAILABLE,
      fileUrl: '/uploads/default-sample.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=60',
      tags: ['ພາສາສາດ', 'ວັນນະຄະດີລາວ', 'ປະຫວັດສາດ', 'ໄວຍາກອນລາວ'],
      categoryId: catResearch.id,
      facultyId: fl.id,
      departmentId: fl.departments[0].id,
    },
  });

  console.log('✅ ສ້າງເອກະສານວິຊາການ 6 ລາຍການ ສຳເລັດແລ້ວ');

  // 5. ສ້າງຂໍ້ມູນ ປະຫວັດການເຄື່ອນໄຫວ (User Activities)
  await prisma.userActivity.createMany({
    data: [
      { userId: studentEng.id, documentId: doc1.id, actionType: 'VIEW' },
      { userId: studentEng.id, documentId: doc1.id, actionType: 'DOWNLOAD' },
      { userId: studentEng.id, documentId: doc4.id, actionType: 'VIEW' },
      { userId: studentEng.id, documentId: doc4.id, actionType: 'DOWNLOAD' },
      { userId: studentEcon.id, documentId: doc3.id, actionType: 'VIEW' },
      { userId: studentEcon.id, documentId: doc3.id, actionType: 'DOWNLOAD' },
      { userId: teacherEng.id, documentId: doc2.id, actionType: 'VIEW' },
      { userId: teacherEng.id, documentId: doc5.id, actionType: 'VIEW' },
    ],
  });

  console.log('✅ ສ້າງປະຫວັດການເຂົ້າເບິ່ງ ແລະ ດາວໂຫຼດ ສຳເລັດແລ້ວ');
  console.log('🎉 ສຳເລັດການ Seeding ຂໍ້ມູນພາສາລາວຮຽບຮ້ອຍແລ້ວ!');
}

main()
  .catch((e) => {
    console.error('❌ ເກີດຂໍ້ຜິດພາດໃນການ Seed ຂໍ້ມູນ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
