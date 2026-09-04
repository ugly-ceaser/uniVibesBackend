import { PrismaClient, Prisma } from '@prisma/client';

export interface KeysetCursor {
  score: number;
  id: string;
}

export function encodeCursor(cursor: KeysetCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor(cursorStr: string): KeysetCursor | null {
  try {
    const decoded = Buffer.from(cursorStr, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.score === 'number' && typeof parsed.id === 'string') {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to decode cursor:', e);
  }
  return null;
}

export const RANKING_PROFILES = {
  forum: {
    decayExponent: 1.5,
    unansweredBoostMultiplier: 2.5,
    unansweredBoostWindowHours: 48,
  },
  homeTrending: {
    decayExponent: 2.0,            // Steeper decay for Home
    unansweredBoostMultiplier: 1.5, // Lower unanswered boost for Home
    unansweredBoostWindowHours: 24, // Smaller boost window
  },
};

export class PostRankingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get ranked questions using engagement scoring and keyset/cursor pagination
   */
  async getRankedQuestions(params: {
    profileName: 'forum' | 'homeTrending';
    userId: string | null;
    userDepartment: string | null;
    cursorStr?: string;
    limit: number;
    category?: string;
    forumId?: string;
  }) {
    const profile = RANKING_PROFILES[params.profileName];
    const decayExponent = profile.decayExponent;
    const boostMultiplier = profile.unansweredBoostMultiplier;
    const boostWindow = profile.unansweredBoostWindowHours;
    const limit = params.limit;

    let cursorScore: number | null = null;
    let cursorId: string | null = null;

    if (params.cursorStr) {
      const decoded = decodeCursor(params.cursorStr);
      if (decoded) {
        cursorScore = decoded.score;
        cursorId = decoded.id;
      }
    }

    // Main raw query using subquery wrapping to support keyset filtering on the computed alias 'score'
    const questions = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM (
        SELECT 
          q.id,
          q.title,
          q.body,
          q."forumId",
          q.status,
          q."authorId",
          q."createdAt",
          q.category,
          q."answerCount",
          q."reactionCount",
          q."viewCount",
          q.department,
          q."courseCode",
          u.fullname as "authorName",
          u.email as "authorEmail",
          u."avatarUrl" as "authorAvatar",
          u.department as "authorDepartment",
          u.faculty as "authorFaculty",
          u.level as "authorLevel",
          f.name as "forumName",
          -- Relevance boost based on course enrollment or department match
          (CASE 
             WHEN q."courseCode" IS NOT NULL AND ${params.userId}::text IS NOT NULL AND EXISTS (
               SELECT 1 FROM "_UserEnrolledCourses" uec
               JOIN "Course" c ON uec."A" = c.id
               WHERE uec."B" = ${params.userId}::text AND c."courseCode" = q."courseCode"
             ) THEN 1.8
             WHEN q.department IS NOT NULL AND ${params.userDepartment}::text IS NOT NULL AND q.department = ${params.userDepartment}::text THEN 1.4
             ELSE 1.0
           END)
           
          -- Fresh unanswered question boost
          * (CASE 
               WHEN q."answerCount" = 0 AND q."createdAt" > NOW() - (INTERVAL '1 hour' * ${boostWindow}::integer)
               THEN ${boostMultiplier}::double precision
               ELSE 1.0 
             END)
             
          -- Raw engagement calculation
          * (q."answerCount" * 3.0 + q."reactionCount" * 1.0 + q."viewCount" * 0.1 + 1.0) -- +1.0 ensures non-zero base
          
          -- Time decay (hours since post + 2.0)^decayExponent
          / POWER(EXTRACT(EPOCH FROM (NOW() - q."createdAt")) / 3600.0 + 2.0, ${decayExponent}::double precision) 
          AS score
        FROM "Question" q
        LEFT JOIN "User" u ON q."authorId" = u.id
        LEFT JOIN "Forum" f ON q."forumId" = f.id
        WHERE q.status = 'Cleared'
          ${params.category ? Prisma.sql`AND q.category = ${params.category}::"ForumCategory"` : Prisma.empty}
          ${params.forumId ? Prisma.sql`AND q."forumId" = ${params.forumId}` : Prisma.empty}
      ) sub
      WHERE (${cursorScore}::double precision IS NULL OR (
           score < ${cursorScore}::double precision OR (score = ${cursorScore}::double precision AND id < ${cursorId}::text)
      ))
      ORDER BY score DESC, id DESC
      LIMIT ${limit}::integer;
    `;

    // Map fields back to match standard Prisma response formatting
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      title: q.title,
      body: q.body,
      forumId: q.forumId,
      status: q.status,
      authorId: q.authorId,
      createdAt: q.createdAt,
      category: q.category,
      answerCount: q.answerCount,
      reactionCount: q.reactionCount,
      viewCount: q.viewCount,
      department: q.department,
      courseCode: q.courseCode,
      author: q.authorId ? {
        id: q.authorId,
        fullname: q.authorName || 'Anonymous',
        email: q.authorEmail || '',
        avatarUrl: q.authorAvatar || null,
        department: q.authorDepartment || null,
        faculty: q.authorFaculty || null,
        level: q.authorLevel || null
      } : null,
      forum: q.forumId ? {
        id: q.forumId,
        name: q.forumName || ''
      } : null,
      _count: {
        answers: q.answerCount
      },
      score: q.score
    }));

    // Derive nextCursor strictly from organic N-th organic post before diversity injection
    let nextCursor: string | null = null;
    if (formattedQuestions.length > 0) {
      const lastOrganic = formattedQuestions[formattedQuestions.length - 1];
      nextCursor = encodeCursor({
        score: lastOrganic.score,
        id: lastOrganic.id
      });
    }

    // Apply diversity injection for Page 1 of Forum feed only
    let finalQuestions = formattedQuestions;
    if (params.profileName === 'forum' && !params.cursorStr) {
      finalQuestions = await this.injectDiversity(
        formattedQuestions,
        params.userId,
        params.userDepartment,
        profile,
        params.category,
        params.forumId
      );
    }

    return {
      questions: finalQuestions,
      nextCursor
    };
  }

  private async injectDiversity(
    questions: any[],
    userId: string | null,
    userDepartment: string | null,
    profile: any,
    category?: string,
    forumId?: string
  ): Promise<any[]> {
    if (questions.length === 0) return questions;

    const authorIds = questions.map(q => q.authorId).filter(Boolean);
    if (authorIds.length === 0) return questions;

    // 1. Check if any poster in this page is a first-time poster (total posts === 1)
    const authorPostCounts = await this.prisma.question.groupBy({
      by: ['authorId'],
      where: { authorId: { in: authorIds }, status: 'Cleared' },
      _count: { id: true }
    });

    const hasFirstTimePoster = authorPostCounts.some(c => c._count.id === 1);
    if (hasFirstTimePoster) {
      return questions; // Already has first-time poster, no injection needed
    }

    // 2. Fetch the top 50 scoring posts to scan for first-time posters
    const topPosts = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM (
        SELECT 
          q.id,
          q.title,
          q.body,
          q."forumId",
          q.status,
          q."authorId",
          q."createdAt",
          q.category,
          q."answerCount",
          q."reactionCount",
          q."viewCount",
          q.department,
          q."courseCode",
          u.fullname as "authorName",
          u.email as "authorEmail",
          u."avatarUrl" as "authorAvatar",
          f.name as "forumName",
          (CASE 
             WHEN q."courseCode" IS NOT NULL AND ${userId}::text IS NOT NULL AND EXISTS (
               SELECT 1 FROM "_UserEnrolledCourses" uec
               JOIN "Course" c ON uec."A" = c.id
               WHERE uec."B" = ${userId}::text AND c."courseCode" = q."courseCode"
             ) THEN 1.8
             WHEN q.department IS NOT NULL AND ${userDepartment}::text IS NOT NULL AND q.department = ${userDepartment}::text THEN 1.4
             ELSE 1.0
           END)
           * (CASE 
                WHEN q."answerCount" = 0 AND q."createdAt" > NOW() - (INTERVAL '1 hour' * ${profile.unansweredBoostWindowHours}::integer)
                THEN ${profile.unansweredBoostMultiplier}::double precision
                ELSE 1.0 
              END)
           * (q."answerCount" * 3.0 + q."reactionCount" * 1.0 + q."viewCount" * 0.1 + 1.0)
           / POWER(EXTRACT(EPOCH FROM (NOW() - q."createdAt")) / 3600.0 + 2.0, ${profile.decayExponent}::double precision) 
           AS score
        FROM "Question" q
        LEFT JOIN "User" u ON q."authorId" = u.id
        LEFT JOIN "Forum" f ON q."forumId" = f.id
        WHERE q.status = 'Cleared'
          ${category ? Prisma.sql`AND q.category = ${category}::"ForumCategory"` : Prisma.empty}
          ${forumId ? Prisma.sql`AND q."forumId" = ${forumId}` : Prisma.empty}
      ) sub
      ORDER BY score DESC, id DESC
      LIMIT 50;
    `;

    const candidateAuthorIds = topPosts.map(p => p.authorId).filter(Boolean);
    if (candidateAuthorIds.length === 0) return questions;

    const candidateCounts = await this.prisma.question.groupBy({
      by: ['authorId'],
      where: { authorId: { in: candidateAuthorIds }, status: 'Cleared' },
      _count: { id: true }
    });

    const firstTimeAuthorIds = new Set(
      candidateCounts.filter(c => c._count.id === 1).map(c => c.authorId)
    );

    // Find the highest-scoring candidate not currently in the current page
    const diversityCandidate = topPosts.find(
      p => p.authorId && firstTimeAuthorIds.has(p.authorId) && !questions.some(q => q.id === p.id)
    );

    if (diversityCandidate) {
      const formattedCandidate = {
        id: diversityCandidate.id,
        title: diversityCandidate.title,
        body: diversityCandidate.body,
        forumId: diversityCandidate.forumId,
        status: diversityCandidate.status,
        authorId: diversityCandidate.authorId,
        createdAt: diversityCandidate.createdAt,
        category: diversityCandidate.category,
        answerCount: diversityCandidate.answerCount,
        reactionCount: diversityCandidate.reactionCount,
        viewCount: diversityCandidate.viewCount,
        department: diversityCandidate.department,
        courseCode: diversityCandidate.courseCode,
        author: diversityCandidate.authorId ? {
          id: diversityCandidate.authorId,
          fullname: diversityCandidate.authorName || 'Anonymous',
          email: diversityCandidate.authorEmail || '',
          avatarUrl: diversityCandidate.authorAvatar || null
        } : null,
        forum: diversityCandidate.forumId ? {
          id: diversityCandidate.forumId,
          name: diversityCandidate.forumName || ''
        } : null,
        _count: {
          answers: diversityCandidate.answerCount
        },
        score: diversityCandidate.score
      };

      // Append diversity candidate to return N+1 questions (avoids orphaning/corrupting cursor)
      return [...questions, formattedCandidate];
    }

    return questions;
  }
}
