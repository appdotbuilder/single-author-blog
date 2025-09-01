import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticleByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteArticle(input: GetArticleByIdInput): Promise<boolean> {
  try {
    // Delete the article by ID
    const result = await db.delete(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .returning({ id: articlesTable.id })
      .execute();

    // Return true if a record was deleted, false if no article was found
    return result.length > 0;
  } catch (error) {
    console.error('Article deletion failed:', error);
    throw error;
  }
}