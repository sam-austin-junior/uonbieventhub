import { PrismaClient, Role, SessionFormat, AttendeeMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding UoN Event Hub…");

  await prisma.announcement.deleteMany();
  await prisma.attendeeInvite.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.eventKnowledgeBase.deleteMany();
  await prisma.message.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.discussionReply.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.sessionRegistration.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.sessionSpeaker.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.session.deleteMany();
  await prisma.exhibitor.deleteMany();
  await prisma.customPage.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformConfig.deleteMany();

  await prisma.platformConfig.create({
    data: { id: "singleton", brandName: "UoN Event Hub" },
  });

  const pw = await bcrypt.hash("password123", 10);

  const hubAdmin = await prisma.user.create({
    data: {
      email: "hubadmin@uonbi.ac.ke",
      passwordHash: pw,
      name: "Hub Administrator",
      role: Role.SUPERADMIN,
      jobTitle: "Platform Owner",
      organization: "Unity of Nations",
      activatedAt: new Date(),
    },
  });

  const oneYearOut = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const organizer = await prisma.user.create({
    data: {
      email: "organizer@uonbi.ac.ke",
      passwordHash: pw,
      name: "Dr. Peter Mwangi",
      role: Role.ORGANIZER,
      jobTitle: "Conference Chair",
      organization: "Faculty of Science & Technology",
      activatedAt: new Date(),
      expiresAt: oneYearOut,
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: "uon-research-week-2026",
      name: "UoN Research & Innovation Week 2026",
      tagline: "Knowledge for the World",
      description:
        "A week-long convening of researchers, students, industry partners and policy makers to showcase the Unity of Nations' leading research and innovation. Join workshops, keynotes, exhibitions and networking sessions across all faculties.",
      startDate: new Date("2026-07-13T08:00:00+03:00"),
      endDate: new Date("2026-07-17T17:00:00+03:00"),
      timezone: "Africa/Nairobi",
      venue: "Chancellor's Court, Main Campus, Unity of Nations",
      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80",
      logoUrl: "https://ui-avatars.com/api/?name=UoN&background=174776&color=fff&size=200",
      attendeeMode: AttendeeMode.INVITE_ONLY,
      organizerId: organizer.id,
    },
  });

  const attendeeSeeds = [
    { firstName: "Brenda", lastName: "Kamau", faculty: "Faculty of Engineering", jobTitle: "Postgraduate Researcher" },
    { firstName: "James", lastName: "Onyango", faculty: "Faculty of Business Management Sciences", jobTitle: "MBA Candidate" },
    { firstName: "Wanjiku", lastName: "Njeri", faculty: "Faculty of Health Sciences", jobTitle: "Lecturer, Public Health" },
    { firstName: "Samuel", lastName: "Kiprop", faculty: "Faculty of Science & Technology", jobTitle: "Undergraduate, Computer Science" },
    { firstName: "Fatuma", lastName: "Hassan", faculty: "Faculty of Arts & Social Sciences", jobTitle: "PhD Candidate, Sociology" },
    { firstName: "Daniel", lastName: "Mutua", faculty: "Faculty of Law", jobTitle: "LLM Student" },
    { firstName: "Linet", lastName: "Achieng", faculty: "Faculty of Education", jobTitle: "Education Researcher" },
    { firstName: "Kevin", lastName: "Otieno", faculty: "Faculty of Engineering", jobTitle: "Civil Engineering Lecturer" },
  ];

  const attendees = await Promise.all(
    attendeeSeeds.map((a, i) =>
      prisma.user.create({
        data: {
          email: `attendee${i + 1}@uonbi.ac.ke`,
          passwordHash: pw,
          name: `${a.firstName} ${a.lastName}`,
          role: Role.ATTENDEE,
          jobTitle: a.jobTitle,
          organization: "Unity of Nations",
          faculty: a.faculty,
          bio: `${a.jobTitle} interested in interdisciplinary research and innovation.`,
          studentId: `UoN/${10000 + i}/2025`,
          avatarUrl: `https://i.pravatar.cc/200?u=attendee${i + 1}`,
          activatedAt: new Date(),
        },
      })
    )
  );

  for (const u of [organizer, ...attendees]) {
    await prisma.registration.create({ data: { eventId: event.id, userId: u.id } });
  }

  for (let i = 0; i < attendeeSeeds.length; i++) {
    const a = attendeeSeeds[i];
    await prisma.attendeeInvite.create({
      data: {
        eventId: event.id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: `attendee${i + 1}@uonbi.ac.ke`,
        activatedAt: new Date(),
      },
    });
  }

  const speakerData = [
    { name: "Prof. Stephen Kiama", jobTitle: "Vice-Chancellor", organization: "Unity of Nations", bio: "Visionary leader driving research excellence.", isKeynote: true, photoUrl: "https://i.pravatar.cc/300?u=speaker1" },
    { name: "Prof. Margaret Hutchinson", jobTitle: "Principal, College of Agriculture", organization: "Unity of Nations", bio: "Award-winning researcher in horticulture and food systems.", isKeynote: true, photoUrl: "https://i.pravatar.cc/300?u=speaker2" },
    { name: "Dr. Joyce Nyairo", jobTitle: "Cultural Analyst", organization: "Independent", bio: "Cultural critic and writer.", photoUrl: "https://i.pravatar.cc/300?u=speaker3" },
    { name: "Dr. Bitange Ndemo", jobTitle: "Professor of Entrepreneurship", organization: "UoN Business School", bio: "Architect of Kenya's digital economy.", photoUrl: "https://i.pravatar.cc/300?u=speaker4" },
    { name: "Dr. Catherine Ngila", jobTitle: "Executive Director", organization: "African Academy of Sciences", bio: "Chemist and champion of women in STEM.", photoUrl: "https://i.pravatar.cc/300?u=speaker5" },
    { name: "Eng. Joseph Mwakima", jobTitle: "Head of Innovation", organization: "Kenya Industrial Research Institute", bio: "Bridging academic research and industry.", photoUrl: "https://i.pravatar.cc/300?u=speaker6" },
  ];

  const speakers = await Promise.all(
    speakerData.map((s) => prisma.speaker.create({ data: { ...s, eventId: event.id } }))
  );

  const d1 = "2026-07-13", d2 = "2026-07-14", d3 = "2026-07-15", d4 = "2026-07-16", d5 = "2026-07-17";
  const sessionPlan = [
    { title: "Opening Ceremony & Vice-Chancellor's Address", description: "Official opening with a keynote on the future of African higher education.", start: `${d1}T09:00:00+03:00`, end: `${d1}T10:30:00+03:00`, location: "Taifa Hall", format: SessionFormat.IN_PERSON, track: "Plenary", isFeatured: true, speakerIdx: [0] },
    { title: "Keynote: Food Systems for a Changing Climate", description: "How African universities can lead climate-smart agricultural research.", start: `${d1}T11:00:00+03:00`, end: `${d1}T12:00:00+03:00`, location: "Taifa Hall", format: SessionFormat.HYBRID, track: "Keynote", isFeatured: true, speakerIdx: [1] },
    { title: "Panel: Universities and Cultural Production in Africa", description: "How the academy shapes African culture, language and identity.", start: `${d1}T14:00:00+03:00`, end: `${d1}T15:30:00+03:00`, location: "Education Theatre II", format: SessionFormat.IN_PERSON, track: "Humanities", speakerIdx: [2] },
    { title: "Workshop: Writing Competitive Grant Proposals", description: "Hands-on workshop for early-career researchers.", start: `${d2}T09:00:00+03:00`, end: `${d2}T11:30:00+03:00`, location: "PG Hall", format: SessionFormat.IN_PERSON, track: "Researcher Development", capacity: 40, speakerIdx: [4] },
    { title: "Innovation Showcase: Student Startups from C4DLab", description: "Live demos from the UoN incubator.", start: `${d2}T13:00:00+03:00`, end: `${d2}T15:00:00+03:00`, location: "C4DLab", format: SessionFormat.IN_PERSON, track: "Innovation", isFeatured: true, speakerIdx: [3] },
    { title: "Fireside Chat: Building Kenya's Digital Economy", description: "From Konza Technopolis to the Startup Bill.", start: `${d3}T10:00:00+03:00`, end: `${d3}T11:30:00+03:00`, location: "Education Theatre I", format: SessionFormat.HYBRID, track: "Innovation", isFeatured: true, speakerIdx: [3, 5] },
    { title: "Roundtable: Women in STEM Across the Continent", description: "Strategies for retaining and elevating women in STEM.", start: `${d3}T14:00:00+03:00`, end: `${d3}T15:30:00+03:00`, location: "Senate Boardroom", format: SessionFormat.IN_PERSON, track: "Equity & Inclusion", speakerIdx: [4, 1] },
    { title: "Hands-on Lab: AI for Public Health Surveillance", description: "Open data and ML for disease outbreak detection.", start: `${d4}T09:00:00+03:00`, end: `${d4}T12:00:00+03:00`, location: "SCI Lab B", format: SessionFormat.IN_PERSON, track: "Technology", capacity: 30, speakerIdx: [5] },
    { title: "Industry Day: Partnerships Between Academia & Manufacturing", description: "Connecting UoN research groups with Kenyan manufacturers.", start: `${d4}T13:30:00+03:00`, end: `${d4}T17:00:00+03:00`, location: "Chancellor's Court Marquee", format: SessionFormat.IN_PERSON, track: "Industry", speakerIdx: [5, 3] },
    { title: "Closing Ceremony & Awards", description: "Recognition of outstanding researchers and innovators.", start: `${d5}T15:00:00+03:00`, end: `${d5}T17:00:00+03:00`, location: "Taifa Hall", format: SessionFormat.HYBRID, track: "Plenary", isFeatured: true, speakerIdx: [0, 1] },
  ];

  for (const s of sessionPlan) {
    const created = await prisma.session.create({
      data: {
        eventId: event.id,
        title: s.title,
        description: s.description,
        startTime: new Date(s.start),
        endTime: new Date(s.end),
        location: s.location,
        format: s.format,
        track: s.track,
        capacity: s.capacity,
        isFeatured: s.isFeatured ?? false,
      },
    });
    for (const idx of s.speakerIdx) {
      await prisma.sessionSpeaker.create({ data: { sessionId: created.id, speakerId: speakers[idx].id } });
    }
  }

  for (const e of [
    { name: "C4DLab — UoN Innovation Hub", tagline: "Where ideas become enterprises", description: "UoN's flagship innovation lab.", logoUrl: "https://ui-avatars.com/api/?name=C4D&background=174776&color=fff&size=200", website: "https://c4dlab.ac.ke", boothNumber: "A1", category: "Innovation" },
    { name: "Safaricom PLC", tagline: "Transforming lives", description: "Scholarship programs and research grants.", logoUrl: "https://ui-avatars.com/api/?name=SAF&background=00aa44&color=fff&size=200", website: "https://safaricom.co.ke", boothNumber: "B1", category: "Industry" },
    { name: "APHRC", tagline: "Evidence to action", description: "Public health research across Africa.", logoUrl: "https://ui-avatars.com/api/?name=APHRC&background=c98e00&color=fff&size=200", website: "https://aphrc.org", boothNumber: "B2", category: "Research" },
  ]) {
    await prisma.exhibitor.create({ data: { ...e, eventId: event.id } });
  }

  for (const p of [
    { slug: "welcome", title: "Welcome Message", order: 1, body: "Karibu! Welcome to UoN Research & Innovation Week 2026." },
    { slug: "venue-and-travel", title: "Venue & Travel", order: 2, body: "The event takes place at the Main Campus along University Way, Nairobi." },
    { slug: "code-of-conduct", title: "Code of Conduct", order: 3, body: "We are committed to providing a respectful, inclusive and safe environment for all participants." },
    { slug: "faq", title: "FAQ", order: 4, body: "**Do I need to register for individual sessions?** Most are open to all registered attendees." },
  ]) {
    await prisma.customPage.create({ data: { ...p, eventId: event.id } });
  }

  console.log("Done.\n");
  console.log("Test logins (all use password: password123):");
  console.log("  Hub Admin:  hubadmin@uonbi.ac.ke   → /hub-admin");
  console.log("  Organizer:  organizer@uonbi.ac.ke  → /admin");
  console.log("  Attendees:  attendee1@uonbi.ac.ke … attendee8@uonbi.ac.ke");
  console.log("");
  console.log("Sample event URL: http://localhost:3000/e/uon-research-week-2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
