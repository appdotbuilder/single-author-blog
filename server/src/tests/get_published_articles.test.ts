import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type ListArticlesInput } from '../schema';
import { getPublishedArticles } from '../handlers/get_published_articles';

// Test input with all required fields
const testInput: Omit<ListArticlesInput, 'published'> = {
  limit: 10,
  offset: 0
};

describe('getPublishedArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only published articles', async () => {
    // Create test articles - both published and unpublished
    await db.insert(articlesTable).values([
      {
        title: 'Published Article 1',
        content: 'Content of published article 1',
        excerpt: 'Excerpt 1',
        slug: 'published-article-1',
        published: true
      },
      {
        title: 'Draft Article',
        content: 'Content of draft article',
        excerpt: 'Draft excerpt',
        slug: 'draft-article',
        published: false
      },
      {
        title: 'Published Article 2',
        content: 'Content of published article 2',
        excerpt: 'Excerpt 2',
        slug: 'published-article-2',
        published: true
      }
    ]).execute();

    const result = await getPublishedArticles(testInput);

    // Should only return published articles
    expect(result).toHaveLength(2);
    result.forEach(article => {
      expect(article.published).toBe(true);
    });
  });

  it('should order articles by created_at DESC (newest first)', async () => {
    // Create articles with slight time differences
    const firstArticle = await db.insert(articlesTable).values({
      title: 'First Article',
      content: 'First content',
      excerpt: 'First excerpt',
      slug: 'first-article',
      published: true
    }).returning().execute();

    // Wait a tiny bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondArticle = await db.insert(articlesTable).values({
      title: 'Second Article',
      content: 'Second content',
      excerpt: 'Second excerpt',
      slug: 'second-article',
      published: true
    }).returning().execute();

    const result = await getPublishedArticles(testInput);

    expect(result).toHaveLength(2);
    // Second article should come first (newest)
    expect(result[0].id).toBe(secondArticle[0].id);
    expect(result[1].id).toBe(firstArticle[0].id);
    
    // Verify dates are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should respect limit parameter', async () => {
    // Create 5 published articles
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

    const limitedResult = await getPublishedArticles({
      limit: 3,
      offset: 0
    });

    expect(limitedResult).toHaveLength(3);
  });

  it('should respect offset parameter for pagination', async () => {
    // Create 5 published articles
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

    // Get first page
    const firstPage = await getPublishedArticles({
      limit: 2,
      offset: 0
    });

    // Get second page
    const secondPage = await getPublishedArticles({
      limit: 2,
      offset: 2
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);
    
    // Ensure different articles are returned
    expect(firstPage[0].id).not.toBe(secondPage[0].id);
    expect(firstPage[1].id).not.toBe(secondPage[1].id);
  });

  it('should return empty array when no published articles exist', async () => {
    // Create only unpublished articles
    await db.insert(articlesTable).values([
      {
        title: 'Draft Article 1',
        content: 'Draft content 1',
        excerpt: 'Draft excerpt 1',
        slug: 'draft-1',
        published: false
      },
      {
        title: 'Draft Article 2',
        content: 'Draft content 2',
        excerpt: 'Draft excerpt 2',
        slug: 'draft-2',
        published: false
      }
    ]).execute();

    const result = await getPublishedArticles(testInput);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle articles with null excerpts', async () => {
    // Create published article with null excerpt
    await db.insert(articlesTable).values({
      title: 'Article Without Excerpt',
      content: 'Content without excerpt',
      excerpt: null,
      slug: 'no-excerpt-article',
      published: true
    }).execute();

    const result = await getPublishedArticles(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].excerpt).toBeNull();
    expect(result[0].title).toBe('Article Without Excerpt');
  });

  it('should return correct article structure with all fields', async () => {
    await db.insert(articlesTable).values({
      title: 'Complete Article',
      content: 'Full article content here',
      excerpt: 'Brief summary',
      slug: 'complete-article',
      published: true
    }).execute();

    const result = await getPublishedArticles(testInput);

    expect(result).toHaveLength(1);
    const article = result[0];
    
    // Verify all expected fields are present
    expect(article.id).toBeDefined();
    expect(typeof article.id).toBe('number');
    expect(article.title).toBe('Complete Article');
    expect(article.content).toBe('Full article content here');
    expect(article.excerpt).toBe('Brief summary');
    expect(article.slug).toBe('complete-article');
    expect(article.published).toBe(true);
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
  });
});