import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticleBySlugInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export async function getArticleBySlug(input: GetArticleBySlugInput): Promise<Article | null> {
  try {
    // Query article by slug - slug is unique so we expect 0 or 1 result
    const results = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.slug, input.slug))
      .limit(1)
      .execute();

    // Return null if no article found
    if (results.length === 0) {
      return null;
    }

    // Return the found article
    const article = results[0];
    return {
      ...article,
      created_at: new Date(article.created_at), // Ensure proper Date object
      updated_at: new Date(article.updated_at)  // Ensure proper Date object
    };
  } catch (error) {
    console.error('Failed to get article by slug:', error);
    throw error;
  }
}