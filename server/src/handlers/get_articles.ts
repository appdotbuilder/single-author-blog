import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type ListArticlesInput, type Article } from '../schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export async function getArticles(input: ListArticlesInput): Promise<Article[]> {
  try {
    // Handle different query paths based on filters
    let results;

    if (input.published !== undefined) {
      // Query with published filter
      results = await db.select()
        .from(articlesTable)
        .where(eq(articlesTable.published, input.published))
        .orderBy(desc(articlesTable.created_at))
        .limit(input.limit)
        .offset(input.offset)
        .execute();
    } else {
      // Query without filters
      results = await db.select()
        .from(articlesTable)
        .orderBy(desc(articlesTable.created_at))
        .limit(input.limit)
        .offset(input.offset)
        .execute();
    }

    // Return results - no numeric conversions needed for articles table
    return results;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
}