import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticleByIdInput } from '../schema';
import { getArticleById } from '../handlers/get_article_by_id';

describe('getArticleById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an article by ID', async () => {
    // Create a test article first
    const testArticle = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        content: 'This is test content for the article.',
        excerpt: 'Test excerpt',
        slug: 'test-article',
        published: true
      })
      .returning()
      .execute();

    const input: GetArticleByIdInput = {
      id: testArticle[0].id
    };

    const result = await getArticleById(input);

    // Verify the article was returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(testArticle[0].id);
    expect(result!.title).toBe('Test Article');
    expect(result!.content).toBe('This is test content for the article.');
    expect(result!.excerpt).toBe('Test excerpt');
    expect(result!.slug).toBe('test-article');
    expect(result!.published).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when article does not exist', async () => {
    const input: GetArticleByIdInput = {
      id: 999 // Non-existent ID
    };

    const result = await getArticleById(input);

    expect(result).toBeNull();
  });

  it('should return article with null excerpt', async () => {
    // Create an article without excerpt
    const testArticle = await db.insert(articlesTable)
      .values({
        title: 'Article Without Excerpt',
        content: 'Content without excerpt.',
        excerpt: null, // Explicitly null
        slug: 'no-excerpt-article',
        published: false
      })
      .returning()
      .execute();

    const input: GetArticleByIdInput = {
      id: testArticle[0].id
    };

    const result = await getArticleById(input);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Article Without Excerpt');
    expect(result!.excerpt).toBeNull();
    expect(result!.published).toBe(false);
  });

  it('should return draft article when published is false', async () => {
    // Create a draft article
    const testArticle = await db.insert(articlesTable)
      .values({
        title: 'Draft Article',
        content: 'This is a draft article.',
        excerpt: 'Draft excerpt',
        slug: 'draft-article',
        published: false
      })
      .returning()
      .execute();

    const input: GetArticleByIdInput = {
      id: testArticle[0].id
    };

    const result = await getArticleById(input);

    expect(result).not.toBeNull();
    expect(result!.published).toBe(false);
    expect(result!.title).toBe('Draft Article');
  });

  it('should handle multiple articles and return the correct one', async () => {
    // Create multiple articles
    const articles = await db.insert(articlesTable)
      .values([
        {
          title: 'First Article',
          content: 'First content',
          slug: 'first-article',
          published: true
        },
        {
          title: 'Second Article',
          content: 'Second content',
          slug: 'second-article',
          published: false
        },
        {
          title: 'Third Article',
          content: 'Third content',
          slug: 'third-article',
          published: true
        }
      ])
      .returning()
      .execute();

    // Get the second article
    const input: GetArticleByIdInput = {
      id: articles[1].id
    };

    const result = await getArticleById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(articles[1].id);
    expect(result!.title).toBe('Second Article');
    expect(result!.content).toBe('Second content');
    expect(result!.slug).toBe('second-article');
    expect(result!.published).toBe(false);
  });
});