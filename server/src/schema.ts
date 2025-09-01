import { z } from 'zod';

// Article schema with proper field handling
export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(), // Can be null if not provided
  slug: z.string(), // URL-friendly version of title
  published: z.boolean(),
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Article = z.infer<typeof articleSchema>;

// Input schema for creating articles
export const createArticleInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().nullable().optional(), // Optional excerpt, can be null
  slug: z.string().min(1, "Slug is required"), // URL-friendly identifier
  published: z.boolean().default(false) // Default to draft
});

export type CreateArticleInput = z.infer<typeof createArticleInputSchema>;

// Input schema for updating articles
export const updateArticleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  slug: z.string().min(1).optional(),
  published: z.boolean().optional()
});

export type UpdateArticleInput = z.infer<typeof updateArticleInputSchema>;

// Schema for getting article by slug
export const getArticleBySlugInputSchema = z.object({
  slug: z.string()
});

export type GetArticleBySlugInput = z.infer<typeof getArticleBySlugInputSchema>;

// Schema for getting article by ID
export const getArticleByIdInputSchema = z.object({
  id: z.number()
});

export type GetArticleByIdInput = z.infer<typeof getArticleByIdInputSchema>;

// Schema for listing articles with optional filters
export const listArticlesInputSchema = z.object({
  published: z.boolean().optional(), // Filter by published status
  limit: z.number().int().positive().max(100).default(10), // Limit results
  offset: z.number().int().nonnegative().default(0) // For pagination
});

export type ListArticlesInput = z.infer<typeof listArticlesInputSchema>;