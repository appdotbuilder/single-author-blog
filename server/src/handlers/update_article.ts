import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type UpdateArticleInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateArticle(input: UpdateArticleInput): Promise<Article | null> {
  try {
    // Extract ID and other fields
    const { id, ...updateFields } = input;

    // Build update object with only provided fields
    const updateData: Partial<typeof articlesTable.$inferInsert> = {};
    
    if (updateFields.title !== undefined) {
      updateData.title = updateFields.title;
    }
    if (updateFields.content !== undefined) {
      updateData.content = updateFields.content;
    }
    if (updateFields.excerpt !== undefined) {
      updateData.excerpt = updateFields.excerpt;
    }
    if (updateFields.slug !== undefined) {
      updateData.slug = updateFields.slug;
    }
    if (updateFields.published !== undefined) {
      updateData.published = updateFields.published;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // If no fields to update, return null
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return null;
    }

    // Update the article
    const result = await db.update(articlesTable)
      .set(updateData)
      .where(eq(articlesTable.id, id))
      .returning()
      .execute();

    // Return the updated article or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Article update failed:', error);
    throw error;
  }
}