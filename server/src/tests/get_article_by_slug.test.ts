import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticleBySlugInput } from '../schema';
import { getArticleBySlug } from '../handlers/get_article_by_slug';

// Test data for creating articles
const testArticle = {
  title: 'Test Article',
  content: 'This is the full content of the test article with detailed information.',
  excerpt: 'Brief summary of the test article',
  slug: 'test-article',
  published: true
};

const draftArticle = {
  title: 'Draft Article',
  content: 'This is a draft article that is not yet published.',
  excerpt: null, // Test null excerpt
  slug: 'draft-article',
  published: false
};

describe('getArticleBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return article when found by slug', async () => {
    // Create test article
    const insertResult = await db.insert(articlesTable)
      .values(testArticle)
      .returning()
      .execute();
    
    const createdArticle = insertResult[0];
    
    const input: GetArticleBySlugInput = {
      slug: 'test-article'
    };

    const result = await getArticleBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdArticle.id);
    expect(result!.title).toEqual('Test Article');
    expect(result!.content).toEqual('This is the full content of the test article with detailed information.');
    expect(result!.excerpt).toEqual('Brief summary of the test article');
    expect(result!.slug).toEqual('test-article');
    expect(result!.published).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when article not found', async () => {
    const input: GetArticleBySlugInput = {
      slug: 'non-existent-article'
    };

    const result = await getArticleBySlug(input);

    expect(result).toBeNull();
  });

  it('should return draft articles (not just published)', async () => {
    // Create draft article
    await db.insert(articlesTable)
      .values(draftArticle)
      .returning()
      .execute();

    const input: GetArticleBySlugInput = {
      slug: 'draft-article'
    };

    const result = await getArticleBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Draft Article');
    expect(result!.published).toEqual(false);
    expect(result!.excerpt).toBeNull(); // Test null excerpt handling
  });

  it('should handle articles with null excerpt', async () => {
    // Create article with null excerpt
    const articleWithNullExcerpt = {
      ...testArticle,
      excerpt: null,
      slug: 'no-excerpt-article'
    };

    await db.insert(articlesTable)
      .values(articleWithNullExcerpt)
      .returning()
      .execute();

    const input: GetArticleBySlugInput = {
      slug: 'no-excerpt-article'
    };

    const result = await getArticleBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.excerpt).toBeNull();
    expect(result!.title).toEqual('Test Article');
  });

  it('should handle case-sensitive slug matching', async () => {
    // Create article with lowercase slug
    await db.insert(articlesTable)
      .values(testArticle)
      .returning()
      .execute();

    // Test with different case - should not find the article
    const input: GetArticleBySlugInput = {
      slug: 'TEST-ARTICLE' // uppercase
    };

    const result = await getArticleBySlug(input);

    expect(result).toBeNull();
  });

  it('should return correct article when multiple articles exist', async () => {
    // Create multiple articles
    await db.insert(articlesTable)
      .values([testArticle, draftArticle])
      .execute();

    const input: GetArticleBySlugInput = {
      slug: 'draft-article'
    };

    const result = await getArticleBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Draft Article');
    expect(result!.slug).toEqual('draft-article');
    expect(result!.published).toEqual(false);
  });

  it('should handle special characters in slug', async () => {
    const specialSlugArticle = {
      title: 'Special Characters Article',
      content: 'Article with special characters in slug',
      excerpt: 'Testing special characters',
      slug: 'special-chars-123-test',
      published: true
    };

    await db.insert(articlesTable)
      .values(specialSlugArticle)
      .returning()
      .execute();

    const input: GetArticleBySlugInput = {
      slug: 'special-chars-123-test'
    };

    const result = await getArticleBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Special Characters Article');
    expect(result!.slug).toEqual('special-chars-123-test');
  });
});