import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type CreateArticleInput } from '../schema';
import { createArticle } from '../handlers/create_article';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateArticleInput = {
  title: 'Test Article',
  content: 'This is a comprehensive test article with detailed content about testing.',
  excerpt: 'Brief summary of the test article',
  slug: 'test-article',
  published: true
};

// Input without optional fields to test defaults
const minimalInput: CreateArticleInput = {
  title: 'Minimal Article',
  content: 'Basic content for minimal test',
  slug: 'minimal-article',
  published: false // Explicitly set to test defaults
  // excerpt will be undefined and handled as null
};

describe('createArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a complete article with all fields', async () => {
    const result = await createArticle(testInput);

    // Verify all fields are correctly set
    expect(result.title).toEqual('Test Article');
    expect(result.content).toEqual(testInput.content);
    expect(result.excerpt).toEqual('Brief summary of the test article');
    expect(result.slug).toEqual('test-article');
    expect(result.published).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create article with minimal input and apply defaults', async () => {
    const result = await createArticle(minimalInput);

    // Verify required fields
    expect(result.title).toEqual('Minimal Article');
    expect(result.content).toEqual('Basic content for minimal test');
    expect(result.slug).toEqual('minimal-article');
    
    // Verify defaults are applied
    expect(result.excerpt).toBeNull();
    expect(result.published).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save article to database correctly', async () => {
    const result = await createArticle(testInput);

    // Query database to verify the article was saved
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles).toHaveLength(1);
    const savedArticle = articles[0];
    
    expect(savedArticle.title).toEqual('Test Article');
    expect(savedArticle.content).toEqual(testInput.content);
    expect(savedArticle.excerpt).toEqual('Brief summary of the test article');
    expect(savedArticle.slug).toEqual('test-article');
    expect(savedArticle.published).toEqual(true);
    expect(savedArticle.created_at).toBeInstanceOf(Date);
    expect(savedArticle.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null excerpt properly', async () => {
    const inputWithNullExcerpt: CreateArticleInput = {
      title: 'Article Without Excerpt',
      content: 'Content without excerpt',
      excerpt: null,
      slug: 'no-excerpt',
      published: false
    };

    const result = await createArticle(inputWithNullExcerpt);

    expect(result.excerpt).toBeNull();
    
    // Verify in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles[0].excerpt).toBeNull();
  });

  it('should prevent duplicate slugs', async () => {
    // Create first article
    await createArticle(testInput);

    // Try to create another article with the same slug
    const duplicateInput: CreateArticleInput = {
      title: 'Another Article',
      content: 'Different content',
      slug: 'test-article', // Same slug as first article
      published: false
    };

    await expect(createArticle(duplicateInput))
      .rejects
      .toThrow(/slug.*already exists/i);
  });

  it('should create multiple articles with different slugs', async () => {
    const firstResult = await createArticle(testInput);
    const secondResult = await createArticle(minimalInput);

    // Verify both articles exist and have different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.slug).toEqual('test-article');
    expect(secondResult.slug).toEqual('minimal-article');

    // Verify both are in database
    const allArticles = await db.select()
      .from(articlesTable)
      .execute();

    expect(allArticles).toHaveLength(2);
    
    const slugs = allArticles.map(article => article.slug);
    expect(slugs).toContain('test-article');
    expect(slugs).toContain('minimal-article');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createArticle(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000); // Allow 1s buffer
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);

    // For new articles, created_at and updated_at should be very close
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });
});