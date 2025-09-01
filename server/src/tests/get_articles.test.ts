import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type ListArticlesInput } from '../schema';
import { getArticles } from '../handlers/get_articles';

describe('getArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no articles exist', async () => {
    const input: ListArticlesInput = {
      limit: 10,
      offset: 0
    };

    const result = await getArticles(input);
    expect(result).toEqual([]);
  });

  it('should return all articles when no filters applied', async () => {
    // Create first article
    await db.insert(articlesTable).values({
      title: 'First Article',
      content: 'Content of first article',
      excerpt: 'First excerpt',
      slug: 'first-article',
      published: true
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second article (should be newer)
    await db.insert(articlesTable).values({
      title: 'Second Article', 
      content: 'Content of second article',
      excerpt: 'Second excerpt',
      slug: 'second-article',
      published: false
    }).execute();

    const input: ListArticlesInput = {
      limit: 10,
      offset: 0
    };

    const result = await getArticles(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Article'); // Newest first due to DESC order
    expect(result[1].title).toEqual('First Article');
  });

  it('should filter by published status', async () => {
    // Create test articles with different published status
    await db.insert(articlesTable).values([
      {
        title: 'Published Article',
        content: 'Published content',
        excerpt: 'Published excerpt',
        slug: 'published-article',
        published: true
      },
      {
        title: 'Draft Article',
        content: 'Draft content', 
        excerpt: 'Draft excerpt',
        slug: 'draft-article',
        published: false
      }
    ]).execute();

    // Test filtering for published articles only
    const publishedInput: ListArticlesInput = {
      published: true,
      limit: 10,
      offset: 0
    };

    const publishedResult = await getArticles(publishedInput);
    expect(publishedResult).toHaveLength(1);
    expect(publishedResult[0].title).toEqual('Published Article');
    expect(publishedResult[0].published).toBe(true);

    // Test filtering for draft articles only
    const draftInput: ListArticlesInput = {
      published: false,
      limit: 10,
      offset: 0
    };

    const draftResult = await getArticles(draftInput);
    expect(draftResult).toHaveLength(1);
    expect(draftResult[0].title).toEqual('Draft Article');
    expect(draftResult[0].published).toBe(false);
  });

  it('should respect pagination limits', async () => {
    // Create multiple test articles
    const articles = [];
    for (let i = 1; i <= 5; i++) {
      articles.push({
        title: `Article ${i}`,
        content: `Content ${i}`,
        excerpt: `Excerpt ${i}`,
        slug: `article-${i}`,
        published: true
      });
    }

    await db.insert(articlesTable).values(articles).execute();

    // Test limit
    const limitedInput: ListArticlesInput = {
      limit: 3,
      offset: 0
    };

    const limitedResult = await getArticles(limitedInput);
    expect(limitedResult).toHaveLength(3);
  });

  it('should handle pagination offset correctly', async () => {
    // Create test articles
    const articles = [];
    for (let i = 1; i <= 5; i++) {
      articles.push({
        title: `Article ${i}`,
        content: `Content ${i}`,
        excerpt: `Excerpt ${i}`,
        slug: `article-${i}`,
        published: true
      });
    }

    await db.insert(articlesTable).values(articles).execute();

    // First page
    const firstPageInput: ListArticlesInput = {
      limit: 2,
      offset: 0
    };

    const firstPage = await getArticles(firstPageInput);
    expect(firstPage).toHaveLength(2);

    // Second page
    const secondPageInput: ListArticlesInput = {
      limit: 2,
      offset: 2
    };

    const secondPage = await getArticles(secondPageInput);
    expect(secondPage).toHaveLength(2);

    // Ensure different articles on each page
    expect(firstPage[0].id).not.toEqual(secondPage[0].id);
    expect(firstPage[1].id).not.toEqual(secondPage[1].id);
  });

  it('should order articles by created_at DESC (newest first)', async () => {
    // Insert articles with slight delay to ensure different timestamps
    await db.insert(articlesTable).values({
      title: 'Older Article',
      content: 'Older content',
      excerpt: 'Older excerpt',
      slug: 'older-article',
      published: true
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(articlesTable).values({
      title: 'Newer Article',
      content: 'Newer content',
      excerpt: 'Newer excerpt', 
      slug: 'newer-article',
      published: true
    }).execute();

    const input: ListArticlesInput = {
      limit: 10,
      offset: 0
    };

    const result = await getArticles(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Article'); // Should be first (newest)
    expect(result[1].title).toEqual('Older Article'); // Should be second (oldest)
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should return correct article structure', async () => {
    await db.insert(articlesTable).values({
      title: 'Test Article',
      content: 'Test content for structure validation',
      excerpt: 'Test excerpt',
      slug: 'test-article',
      published: true
    }).execute();

    const input: ListArticlesInput = {
      limit: 1,
      offset: 0
    };

    const result = await getArticles(input);

    expect(result).toHaveLength(1);
    
    const article = result[0];
    expect(article.id).toBeDefined();
    expect(typeof article.id).toBe('number');
    expect(article.title).toEqual('Test Article');
    expect(article.content).toEqual('Test content for structure validation');
    expect(article.excerpt).toEqual('Test excerpt');
    expect(article.slug).toEqual('test-article');
    expect(article.published).toBe(true);
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
  });

  it('should handle articles with null excerpt', async () => {
    await db.insert(articlesTable).values({
      title: 'Article Without Excerpt',
      content: 'Content without excerpt',
      excerpt: null, // Explicitly null excerpt
      slug: 'no-excerpt-article',
      published: true
    }).execute();

    const input: ListArticlesInput = {
      limit: 1,
      offset: 0
    };

    const result = await getArticles(input);

    expect(result).toHaveLength(1);
    expect(result[0].excerpt).toBeNull();
  });
});