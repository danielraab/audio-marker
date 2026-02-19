#!/usr/bin/env node
/**
 * Database seeder script to fill the database with test data
 * All dates are relative to the script execution time
 *
 * Usage: npm run db:seed
 * Or: tsx scripts/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to get relative dates from now
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Generate random listen records spread across time
function generateListenDates(count: number, maxDaysAgo: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const randomDays = Math.random() * maxDaysAgo;
    const randomHours = Math.random() * 24;
    const date = new Date();
    date.setDate(date.getDate() - randomDays);
    date.setHours(date.getHours() - randomHours);
    dates.push(date);
  }
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

// Generate listen records only in the past (for inactive audio testing)
function generatePastListenDates(count: number, minDaysAgo: number, maxDaysAgo: number): Date[] {
  const dates: Date[] = [];
  const range = maxDaysAgo - minDaysAgo;
  for (let i = 0; i < count; i++) {
    const randomDays = minDaysAgo + Math.random() * range;
    const randomHours = Math.random() * 24;
    const date = new Date();
    date.setDate(date.getDate() - randomDays);
    date.setHours(date.getHours() - randomHours);
    dates.push(date);
  }
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

// Marker colors for variety
const MARKER_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // =========================================
    // 1. Create Users
    // =========================================
    console.log("👤 Creating users...");

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
        emailVerified: daysAgo(30),
      },
    });

    const regularUser1 = await prisma.user.upsert({
      where: { email: "user1@example.com" },
      update: {},
      create: {
        email: "user1@example.com",
        name: "John Doe",
        isAdmin: false,
        emailVerified: daysAgo(25),
      },
    });

    const regularUser2 = await prisma.user.upsert({
      where: { email: "user2@example.com" },
      update: {},
      create: {
        email: "user2@example.com",
        name: "Jane Smith",
        isAdmin: false,
        emailVerified: daysAgo(20),
      },
    });

    await prisma.user.upsert({
      where: { email: "disabled@example.com" },
      update: {},
      create: {
        email: "disabled@example.com",
        name: "Disabled User",
        isAdmin: false,
        isDisabled: true,
        emailVerified: daysAgo(60),
      },
    });

    console.log(`  ✅ Created ${4} users`);

    // =========================================
    // 2. Create Audios with Markers
    // =========================================
    console.log("\n🎵 Creating audios...");

    const audio1 = await prisma.audio.upsert({
      where: { id: "seed-audio-1" },
      update: {},
      create: {
        id: "seed-audio-1",
        name: "Introduction to TypeScript",
        description: "A comprehensive guide to TypeScript fundamentals, covering types, interfaces, and best practices.",
        originalFileName: "intro-typescript.mp3",
        filePath: "uploads/seed/intro-typescript.mp3",
        createdById: adminUser.id,
        createdAt: daysAgo(14),
        isPublic: true,
      },
    });

    const audio2 = await prisma.audio.upsert({
      where: { id: "seed-audio-2" },
      update: {},
      create: {
        id: "seed-audio-2",
        name: "React Hooks Deep Dive",
        description: "An in-depth exploration of React Hooks including useState, useEffect, useContext, and custom hooks.",
        originalFileName: "react-hooks.mp3",
        filePath: "uploads/seed/react-hooks.mp3",
        createdById: adminUser.id,
        createdAt: daysAgo(12),
        isPublic: true,
      },
    });

    const audio3 = await prisma.audio.upsert({
      where: { id: "seed-audio-3" },
      update: {},
      create: {
        id: "seed-audio-3",
        name: "Database Design Patterns",
        description: "Learn about common database design patterns and when to apply them in your applications.",
        originalFileName: "db-patterns.mp3",
        filePath: "uploads/seed/db-patterns.mp3",
        createdById: regularUser1.id,
        createdAt: daysAgo(10),
        isPublic: true,
      },
    });

    const audio4 = await prisma.audio.upsert({
      where: { id: "seed-audio-4" },
      update: {},
      create: {
        id: "seed-audio-4",
        name: "Private Meeting Recording",
        description: "Internal team meeting discussing Q4 planning and roadmap.",
        originalFileName: "team-meeting.mp3",
        filePath: "uploads/seed/team-meeting.mp3",
        createdById: regularUser1.id,
        createdAt: daysAgo(7),
        isPublic: false,
      },
    });

    const audio5 = await prisma.audio.upsert({
      where: { id: "seed-audio-5" },
      update: {},
      create: {
        id: "seed-audio-5",
        name: "Podcast: Tech Trends 2026",
        description: "Discussion about emerging technology trends and their impact on software development.",
        originalFileName: "tech-trends-podcast.mp3",
        filePath: "uploads/seed/tech-trends-podcast.mp3",
        createdById: regularUser2.id,
        createdAt: daysAgo(5),
        isPublic: true,
      },
    });

    const audio6 = await prisma.audio.upsert({
      where: { id: "seed-audio-6" },
      update: {},
      create: {
        id: "seed-audio-6",
        name: "Interview: Software Architecture",
        description: "Expert interview on software architecture principles and microservices.",
        originalFileName: "architecture-interview.mp3",
        filePath: "uploads/seed/architecture-interview.mp3",
        createdById: regularUser2.id,
        createdAt: daysAgo(3),
        isPublic: true,
      },
    });

    // Inactive audio - only has past listens (30-60 days ago), no recent activity
    const audio7 = await prisma.audio.upsert({
      where: { id: "seed-audio-7" },
      update: {},
      create: {
        id: "seed-audio-7",
        name: "Legacy Tutorial: jQuery Basics",
        description: "An older tutorial covering jQuery fundamentals. This audio has not been listened to recently.",
        originalFileName: "jquery-basics.mp3",
        filePath: "uploads/seed/jquery-basics.mp3",
        createdById: adminUser.id,
        createdAt: daysAgo(60),
        isPublic: true,
      },
    });

    console.log(`  ✅ Created ${7} audios`);

    // =========================================
    // 3. Create Markers
    // =========================================
    console.log("\n📍 Creating markers...");

    // Markers for Audio 1 - TypeScript Introduction
    const markersAudio1 = [
      { label: "Introduction", timestamp: 0, color: MARKER_COLORS[0] },
      { label: "Basic Types", timestamp: 120.5, color: MARKER_COLORS[1] },
      { label: "Interfaces", timestamp: 300, endTimestamp: 480, color: MARKER_COLORS[2] }, // Section
      { label: "Type Guards", timestamp: 540, color: MARKER_COLORS[3] },
      { label: "Generics Section", timestamp: 720, endTimestamp: 900, color: MARKER_COLORS[4] }, // Section
      { label: "Q&A", timestamp: 1020, color: MARKER_COLORS[5] },
    ];

    // Markers for Audio 2 - React Hooks
    const markersAudio2 = [
      { label: "What are Hooks?", timestamp: 0, color: MARKER_COLORS[0] },
      { label: "useState", timestamp: 180, color: MARKER_COLORS[1] },
      { label: "useEffect Deep Dive", timestamp: 360, endTimestamp: 600, color: MARKER_COLORS[2] }, // Section
      { label: "useContext", timestamp: 660, color: MARKER_COLORS[3] },
      { label: "Custom Hooks", timestamp: 840, endTimestamp: 1020, color: MARKER_COLORS[6] }, // Section
      { label: "Best Practices", timestamp: 1080, color: MARKER_COLORS[7] },
    ];

    // Markers for Audio 3 - Database Patterns
    const markersAudio3 = [
      { label: "Overview", timestamp: 0, color: MARKER_COLORS[0] },
      { label: "Normalization", timestamp: 150, color: MARKER_COLORS[1] },
      { label: "Indexing Strategies", timestamp: 400, endTimestamp: 600, color: MARKER_COLORS[4] }, // Section
      { label: "Query Optimization", timestamp: 750, color: MARKER_COLORS[5] },
    ];

    // Markers for Audio 5 - Podcast
    const markersAudio5 = [
      { label: "Intro", timestamp: 0, color: MARKER_COLORS[0] },
      { label: "AI & ML Trends", timestamp: 300, endTimestamp: 720, color: MARKER_COLORS[1] }, // Section
      { label: "Cloud Computing", timestamp: 780, color: MARKER_COLORS[2] },
      { label: "Edge Computing", timestamp: 1200, color: MARKER_COLORS[3] },
      { label: "Closing Thoughts", timestamp: 1500, color: MARKER_COLORS[7] },
    ];

    for (const marker of markersAudio1) {
      await prisma.marker.upsert({
        where: { audioId_timestamp: { audioId: audio1.id, timestamp: marker.timestamp } },
        update: {},
        create: {
          audioId: audio1.id,
          label: marker.label,
          timestamp: marker.timestamp,
          endTimestamp: marker.endTimestamp ?? null,
          color: marker.color,
          createdAt: daysAgo(14),
        },
      });
    }

    for (const marker of markersAudio2) {
      await prisma.marker.upsert({
        where: { audioId_timestamp: { audioId: audio2.id, timestamp: marker.timestamp } },
        update: {},
        create: {
          audioId: audio2.id,
          label: marker.label,
          timestamp: marker.timestamp,
          endTimestamp: marker.endTimestamp ?? null,
          color: marker.color,
          createdAt: daysAgo(12),
        },
      });
    }

    for (const marker of markersAudio3) {
      await prisma.marker.upsert({
        where: { audioId_timestamp: { audioId: audio3.id, timestamp: marker.timestamp } },
        update: {},
        create: {
          audioId: audio3.id,
          label: marker.label,
          timestamp: marker.timestamp,
          endTimestamp: marker.endTimestamp ?? null,
          color: marker.color,
          createdAt: daysAgo(10),
        },
      });
    }

    for (const marker of markersAudio5) {
      await prisma.marker.upsert({
        where: { audioId_timestamp: { audioId: audio5.id, timestamp: marker.timestamp } },
        update: {},
        create: {
          audioId: audio5.id,
          label: marker.label,
          timestamp: marker.timestamp,
          endTimestamp: marker.endTimestamp ?? null,
          color: marker.color,
          createdAt: daysAgo(5),
        },
      });
    }

    const totalMarkers = markersAudio1.length + markersAudio2.length + markersAudio3.length + markersAudio5.length;
    console.log(`  ✅ Created ${totalMarkers} markers`);

    // =========================================
    // 4. Create Playlists
    // =========================================
    console.log("\n📋 Creating playlists...");

    const playlist1 = await prisma.playlist.upsert({
      where: { id: "seed-playlist-1" },
      update: {},
      create: {
        id: "seed-playlist-1",
        name: "Web Development Essentials",
        description: "A curated collection of essential web development tutorials covering TypeScript, React, and more.",
        isPublic: true,
        createdById: adminUser.id,
        createdAt: daysAgo(10),
      },
    });

    const playlist2 = await prisma.playlist.upsert({
      where: { id: "seed-playlist-2" },
      update: {},
      create: {
        id: "seed-playlist-2",
        name: "Backend Development",
        description: "Resources for backend development including database design and architecture patterns.",
        isPublic: true,
        createdById: regularUser1.id,
        createdAt: daysAgo(8),
      },
    });

    const playlist3 = await prisma.playlist.upsert({
      where: { id: "seed-playlist-3" },
      update: {},
      create: {
        id: "seed-playlist-3",
        name: "My Private Collection",
        description: "Personal audio collection for later listening.",
        isPublic: false,
        createdById: regularUser2.id,
        createdAt: daysAgo(4),
      },
    });

    console.log(`  ✅ Created ${3} playlists`);

    // =========================================
    // 5. Add Audios to Playlists
    // =========================================
    console.log("\n🔗 Linking audios to playlists...");

    // Web Development Essentials playlist
    await prisma.playlistAudio.upsert({
      where: { playlistId_audioId: { playlistId: playlist1.id, audioId: audio1.id } },
      update: {},
      create: {
        playlistId: playlist1.id,
        audioId: audio1.id,
        order: 0,
        addedAt: daysAgo(10),
      },
    });

    await prisma.playlistAudio.upsert({
      where: { playlistId_audioId: { playlistId: playlist1.id, audioId: audio2.id } },
      update: {},
      create: {
        playlistId: playlist1.id,
        audioId: audio2.id,
        order: 1,
        addedAt: daysAgo(9),
      },
    });

    // Backend Development playlist
    await prisma.playlistAudio.upsert({
      where: { playlistId_audioId: { playlistId: playlist2.id, audioId: audio3.id } },
      update: {},
      create: {
        playlistId: playlist2.id,
        audioId: audio3.id,
        order: 0,
        addedAt: daysAgo(8),
      },
    });

    await prisma.playlistAudio.upsert({
      where: { playlistId_audioId: { playlistId: playlist2.id, audioId: audio6.id } },
      update: {},
      create: {
        playlistId: playlist2.id,
        audioId: audio6.id,
        order: 1,
        addedAt: daysAgo(3),
      },
    });

    // Private collection
    await prisma.playlistAudio.upsert({
      where: { playlistId_audioId: { playlistId: playlist3.id, audioId: audio5.id } },
      update: {},
      create: {
        playlistId: playlist3.id,
        audioId: audio5.id,
        order: 0,
        addedAt: daysAgo(4),
      },
    });

    await prisma.playlistAudio.upsert({
      where: { playlistId_audioId: { playlistId: playlist3.id, audioId: audio1.id } },
      update: {},
      create: {
        playlistId: playlist3.id,
        audioId: audio1.id,
        order: 1,
        addedAt: daysAgo(2),
      },
    });

    console.log(`  ✅ Linked ${6} audios to playlists`);

    // =========================================
    // 6. Create Listen Records (Statistics)
    // =========================================
    console.log("\n📊 Creating listen records...");

    // Delete existing seed listen records to avoid duplicates
    await prisma.audioListenRecord.deleteMany({
      where: {
        audioId: { in: [audio1.id, audio2.id, audio3.id, audio4.id, audio5.id, audio6.id, audio7.id] },
      },
    });

    await prisma.playlistListenRecord.deleteMany({
      where: {
        playlistId: { in: [playlist1.id, playlist2.id, playlist3.id] },
      },
    });

    // Audio listen records with varying popularity
    const audio1Listens = generateListenDates(45, 14); // Most popular
    const audio2Listens = generateListenDates(32, 12);
    const audio3Listens = generateListenDates(18, 10);
    const audio4Listens = generateListenDates(5, 7); // Private, less listens
    const audio5Listens = generateListenDates(28, 5);
    const audio6Listens = generateListenDates(12, 3);

    for (const listenedAt of audio1Listens) {
      await prisma.audioListenRecord.create({
        data: { audioId: audio1.id, listenedAt },
      });
    }

    for (const listenedAt of audio2Listens) {
      await prisma.audioListenRecord.create({
        data: { audioId: audio2.id, listenedAt },
      });
    }

    for (const listenedAt of audio3Listens) {
      await prisma.audioListenRecord.create({
        data: { audioId: audio3.id, listenedAt },
      });
    }

    for (const listenedAt of audio4Listens) {
      await prisma.audioListenRecord.create({
        data: { audioId: audio4.id, listenedAt },
      });
    }

    for (const listenedAt of audio5Listens) {
      await prisma.audioListenRecord.create({
        data: { audioId: audio5.id, listenedAt },
      });
    }

    for (const listenedAt of audio6Listens) {
      await prisma.audioListenRecord.create({
        data: { audioId: audio6.id, listenedAt },
      });
    }

    // Inactive audio - only past listens between 30-60 days ago
    const audio7Listens = generatePastListenDates(25, 30, 60);
    for (const listenedAt of audio7Listens) {
      await prisma.audioListenRecord.create({
        data: { audioId: audio7.id, listenedAt },
      });
    }

    const totalAudioListens =
      audio1Listens.length +
      audio2Listens.length +
      audio3Listens.length +
      audio4Listens.length +
      audio5Listens.length +
      audio6Listens.length +
      audio7Listens.length;
    console.log(`  ✅ Created ${totalAudioListens} audio listen records`);

    // Playlist listen records
    const playlist1Listens = generateListenDates(22, 10);
    const playlist2Listens = generateListenDates(15, 8);
    const playlist3Listens = generateListenDates(8, 4);

    for (const listenedAt of playlist1Listens) {
      await prisma.playlistListenRecord.create({
        data: { playlistId: playlist1.id, listenedAt },
      });
    }

    for (const listenedAt of playlist2Listens) {
      await prisma.playlistListenRecord.create({
        data: { playlistId: playlist2.id, listenedAt },
      });
    }

    for (const listenedAt of playlist3Listens) {
      await prisma.playlistListenRecord.create({
        data: { playlistId: playlist3.id, listenedAt },
      });
    }

    const totalPlaylistListens = playlist1Listens.length + playlist2Listens.length + playlist3Listens.length;
    console.log(`  ✅ Created ${totalPlaylistListens} playlist listen records`);

    // =========================================
    // 7. Create/Update Legal Information
    // =========================================
    console.log("\n📜 Creating legal information...");

    await prisma.legalInformation.upsert({
      where: { id: "seed-legal-impressum" },
      update: {},
      create: {
        id: "seed-legal-impressum",
        enabled: true,
        label: "Impressum",
        content: `<h2>Company Information</h2>
<p><strong>Audio Marker Demo Company</strong></p>
<p>123 Demo Street<br>12345 Demo City<br>Germany</p>
<p><strong>Contact:</strong><br>Email: contact@example.com<br>Phone: +49 123 456789</p>
<p><strong>Managing Director:</strong> John Doe</p>
<p><strong>Registration:</strong> Demo Registry, HRB 12345</p>
<p><strong>VAT ID:</strong> DE123456789</p>`,
        sortOrder: 0,
        updatedById: adminUser.id,
        createdAt: daysAgo(30),
      },
    });

    await prisma.legalInformation.upsert({
      where: { id: "seed-legal-privacy" },
      update: {},
      create: {
        id: "seed-legal-privacy",
        enabled: true,
        label: "Privacy Policy",
        content: `<h2>Privacy Policy</h2>
<p>Last updated: ${new Date().toLocaleDateString()}</p>
<h3>1. Data Collection</h3>
<p>We collect information you provide directly to us when you create an account, upload audio files, or contact us.</p>
<h3>2. Use of Information</h3>
<p>We use the information we collect to provide, maintain, and improve our services.</p>
<h3>3. Data Storage</h3>
<p>Your data is stored securely on our servers and is protected using industry-standard encryption.</p>
<h3>4. Your Rights</h3>
<p>You have the right to access, correct, or delete your personal data at any time.</p>
<h3>5. Contact</h3>
<p>For questions about this policy, contact us at privacy@example.com</p>`,
        sortOrder: 1,
        updatedById: adminUser.id,
        createdAt: daysAgo(30),
      },
    });

    await prisma.legalInformation.upsert({
      where: { id: "seed-legal-terms" },
      update: {},
      create: {
        id: "seed-legal-terms",
        enabled: true,
        label: "Terms of Service",
        content: `<h2>Terms of Service</h2>
<p>Last updated: ${new Date().toLocaleDateString()}</p>
<h3>1. Acceptance of Terms</h3>
<p>By accessing or using Audio Marker, you agree to be bound by these Terms of Service.</p>
<h3>2. User Accounts</h3>
<p>You are responsible for maintaining the confidentiality of your account credentials.</p>
<h3>3. Content</h3>
<p>You retain ownership of content you upload. By uploading, you grant us a license to host and display your content.</p>
<h3>4. Prohibited Conduct</h3>
<p>You agree not to upload any content that violates laws or infringes on others' rights.</p>
<h3>5. Termination</h3>
<p>We reserve the right to terminate accounts that violate these terms.</p>`,
        sortOrder: 2,
        updatedById: adminUser.id,
        createdAt: daysAgo(30),
      },
    });

    console.log(`  ✅ Created ${3} legal information entries`);

    // =========================================
    // Summary
    // =========================================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 Database seeding completed successfully!");
    console.log("=".repeat(50));
    console.log("\nSummary:");
    console.log(`  • Users: 4 (1 admin, 2 regular, 1 disabled)`);
    console.log(`  • Audios: 7 (6 public, 1 private) - includes 1 inactive`);
    console.log(`  • Markers: ${totalMarkers}`);
    console.log(`  • Playlists: 3 (2 public, 1 private)`);
    console.log(`  • Audio Listen Records: ${totalAudioListens}`);
    console.log(`  • Playlist Listen Records: ${totalPlaylistListens}`);
    console.log(`  • Legal Information: 3`);
    console.log("\nTest Accounts:");
    console.log(`  • Admin: admin@example.com`);
    console.log(`  • User 1: user1@example.com`);
    console.log(`  • User 2: user2@example.com`);
    console.log(`  • Disabled: disabled@example.com`);
    console.log("\nNote: Users need to sign in via configured auth provider.");
    console.log("");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void seed();
