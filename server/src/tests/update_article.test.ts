import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type UpdateArticleInput } from '../schema';
import { updateArticle } from '../handlers/update_article';
import { eq } from 'drizzle-orm';

// Test data for creating initial articles
const createTestArticle = async (overrides = {}) => {
  const defaultArticle = {
    title: 'Original Title',
    content: 'Original content for testing',
    excerpt: 'Original excerpt',
    slug: 'original-slug',
    published: false
  };

  const result = await db.insert(articlesTable)
    .values({ ...defaultArticle, ...overrides })
    .returning()
    .execute();

  return result[0];
};

describe('updateArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update article title and content', async () => {
    // Create initial article
    const article = await createTestArticle();
    const originalUpdatedAt = article.updated_at;
    
    // Wait a bit to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateArticleInput = {
      id: article.id,
      title: 'Updated Title',
      content: 'Updated content for the article'
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(article.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.content).toEqual('Updated content for the article');
    expect(result!.excerpt).toEqual('Original excerpt'); // Unchanged
    expect(result!.slug).toEqual('original-slug'); // Unchanged
    expect(result!.published).toEqual(false); // Unchanged
    expect(result!.created_at).toEqual(article.created_at); // Unchanged
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update excerpt and published status', async () => {
    const article = await createTestArticle();

    const updateInput: UpdateArticleInput = {
      id: article.id,
      excerpt: 'New excerpt for the article',
      published: true
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeTruthy();
    expect(result!.excerpt).toEqual('New excerpt for the article');
    expect(result!.published).toEqual(true);
    expect(result!.title).toEqual('Original Title'); // Unchanged
    expect(result!.content).toEqual('Original content for testing'); // Unchanged
  });

  it('should update slug', async () => {
    const article = await createTestArticle();

    const updateInput: UpdateArticleInput = {
      id: article.id,
      slug: 'new-article-slug'
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeTruthy();
    expect(result!.slug).toEqual('new-article-slug');
  });

  it('should set excerpt to null', async () => {
    const article = await createTestArticle({ excerpt: 'Existing excerpt' });

    const updateInput: UpdateArticleInput = {
      id: article.id,
      excerpt: null
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeTruthy();
    expect(result!.excerpt).toBeNull();
  });

  it('should update all fields at once', async () => {
    const article = await createTestArticle();

    const updateInput: UpdateArticleInput = {
      id: article.id,
      title: 'Completely Updated Title',
      content: 'Completely updated content',
      excerpt: 'Completely updated excerpt',
      slug: 'completely-updated-slug',
      published: true
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeTruthy();
    expect(result!.title).toEqual('Completely Updated Title');
    expect(result!.content).toEqual('Completely updated content');
    expect(result!.excerpt).toEqual('Completely updated excerpt');
    expect(result!.slug).toEqual('completely-updated-slug');
    expect(result!.published).toEqual(true);
  });

  it('should return null for non-existent article', async () => {
    const updateInput: UpdateArticleInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const article = await createTestArticle();

    const updateInput: UpdateArticleInput = {
      id: article.id,
      title: 'Database Updated Title',
      published: true
    };

    await updateArticle(updateInput);

    // Query database directly to verify changes
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article.id))
      .execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toEqual('Database Updated Title');
    expect(articles[0].published).toEqual(true);
  });

  it('should always update the updated_at timestamp', async () => {
    const article = await createTestArticle();
    const originalUpdatedAt = article.updated_at;
    
    // Wait to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateArticleInput = {
      id: article.id,
      title: 'Title with timestamp check'
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeTruthy();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle unique constraint violation on slug', async () => {
    // Create two articles
    const article1 = await createTestArticle({ slug: 'first-article' });
    const article2 = await createTestArticle({ slug: 'second-article' });

    const updateInput: UpdateArticleInput = {
      id: article2.id,
      slug: 'first-article' // This should cause a unique constraint violation
    };

    await expect(updateArticle(updateInput)).rejects.toThrow(/unique constraint/i);
  });

  it('should return null when no fields are provided to update', async () => {
    const article = await createTestArticle();

    const updateInput: UpdateArticleInput = {
      id: article.id
      // No fields to update
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeNull();
  });
});