import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticleByIdInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export const getArticleById = async (input: GetArticleByIdInput): Promise<Article | null> => {
  try {
    // Query article by ID
    const result = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .execute();

    // Return null if no article found
    if (result.length === 0) {
      return null;
    }

    // Return the found article
    return result[0];
  } catch (error) {
    console.error('Failed to get article by ID:', error);
    throw error;
  }
};