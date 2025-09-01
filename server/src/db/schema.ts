import { serial, text, pgTable, timestamp, boolean } from 'drizzle-orm/pg-core';

export const articlesTable = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(), // Full article content
  excerpt: text('excerpt'), // Nullable by default - brief summary for listing
  slug: text('slug').notNull().unique(), // URL-friendly identifier, must be unique
  published: boolean('published').notNull().default(false), // Draft vs published status
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Article = typeof articlesTable.$inferSelect; // For SELECT operations
export type NewArticle = typeof articlesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { articles: articlesTable };