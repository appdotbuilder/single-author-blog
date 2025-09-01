import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticleByIdInput, type CreateArticleInput } from '../schema';
import { deleteArticle } from '../handlers/delete_article';
import { eq } from 'drizzle-orm';

// Test input for creating prerequisite articles
const testArticleInput: CreateArticleInput = {
  title: 'Test Article for Deletion',
  content: 'This article will be deleted in tests',
  excerpt: 'Article to be deleted',
  slug: 'test-article-delete',
  published: true
};

describe('deleteArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing article and return true', async () => {
    // Create a test article first
    const createResult = await db.insert(articlesTable)
      .values({
        title: testArticleInput.title,
        content: testArticleInput.content,
        excerpt: testArticleInput.excerpt,
        slug: testArticleInput.slug,
        published: testArticleInput.published
      })
      .returning()
      .execute();

    const articleId = createResult[0].id;
    const deleteInput: GetArticleByIdInput = { id: articleId };

    // Delete the article
    const result = await deleteArticle(deleteInput);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the article no longer exists in the database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .execute();

    expect(articles).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent article', async () => {
    const nonExistentId = 99999;
    const deleteInput: GetArticleByIdInput = { id: nonExistentId };

    // Try to delete non-existent article
    const result = await deleteArticle(deleteInput);

    // Should return false indicating no article was deleted
    expect(result).toBe(false);
  });

  it('should not affect other articles when deleting one', async () => {
    // Create multiple test articles
    const article1 = await db.insert(articlesTable)
      .values({
        title: 'First Article',
        content: 'Content of first article',
        excerpt: 'First excerpt',
        slug: 'first-article',
        published: true
      })
      .returning()
      .execute();

    const article2 = await db.insert(articlesTable)
      .values({
        title: 'Second Article',
        content: 'Content of second article',
        excerpt: 'Second excerpt',
        slug: 'second-article',
        published: false
      })
      .returning()
      .execute();

    const deleteInput: GetArticleByIdInput = { id: article1[0].id };

    // Delete the first article
    const result = await deleteArticle(deleteInput);

    expect(result).toBe(true);

    // Verify first article is deleted
    const deletedArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article1[0].id))
      .execute();

    expect(deletedArticle).toHaveLength(0);

    // Verify second article still exists
    const remainingArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article2[0].id))
      .execute();

    expect(remainingArticle).toHaveLength(1);
    expect(remainingArticle[0].title).toBe('Second Article');
  });

  it('should handle deletion of published and unpublished articles', async () => {
    // Create a published article
    const publishedArticle = await db.insert(articlesTable)
      .values({
        title: 'Published Article',
        content: 'Published content',
        excerpt: 'Published excerpt',
        slug: 'published-article',
        published: true
      })
      .returning()
      .execute();

    // Create an unpublished article
    const unpublishedArticle = await db.insert(articlesTable)
      .values({
        title: 'Draft Article',
        content: 'Draft content',
        excerpt: null,
        slug: 'draft-article',
        published: false
      })
      .returning()
      .execute();

    // Delete published article
    const publishedDeleteResult = await deleteArticle({ id: publishedArticle[0].id });
    expect(publishedDeleteResult).toBe(true);

    // Delete unpublished article
    const unpublishedDeleteResult = await deleteArticle({ id: unpublishedArticle[0].id });
    expect(unpublishedDeleteResult).toBe(true);

    // Verify both articles are deleted
    const remainingArticles = await db.select()
      .from(articlesTable)
      .execute();

    expect(remainingArticles).toHaveLength(0);
  });
});