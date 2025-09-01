import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type CreateArticleInput, type Article } from '../schema';
import { eq } from 'drizzle-orm';

export const createArticle = async (input: CreateArticleInput): Promise<Article> => {
  try {
    // Check if slug already exists to ensure uniqueness
    const existingArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.slug, input.slug))
      .execute();

    if (existingArticle.length > 0) {
      throw new Error(`Article with slug '${input.slug}' already exists`);
    }

    // Insert article record
    const result = await db.insert(articlesTable)
      .values({
        title: input.title,
        content: input.content,
        excerpt: input.excerpt ?? null, // Handle optional excerpt
        slug: input.slug,
        published: input.published // Zod has already applied defaults during parsing
        // created_at and updated_at will be set automatically by database defaults
      })
      .returning()
      .execute();

    // Return the created article
    const article = result[0];
    return {
      ...article,
      // Convert timestamps to Date objects for consistency
      created_at: new Date(article.created_at),
      updated_at: new Date(article.updated_at)
    };
  } catch (error) {
    console.error('Article creation failed:', error);
    throw error;
  }
};