import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type ListArticlesInput, type Article } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPublishedArticles(input: Omit<ListArticlesInput, 'published'>): Promise<Article[]> {
  try {
    // Build query in a single chain to avoid TypeScript inference issues
    const results = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.published, true))
      .orderBy(desc(articlesTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Return articles as-is since all fields are already properly typed
    // No numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Get published articles failed:', error);
    throw error;
  }
}