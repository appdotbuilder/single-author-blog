import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createArticleInputSchema, 
  updateArticleInputSchema,
  getArticleByIdInputSchema,
  getArticleBySlugInputSchema,
  listArticlesInputSchema
} from './schema';

// Import handlers
import { createArticle } from './handlers/create_article';
import { getArticles } from './handlers/get_articles';
import { getArticleById } from './handlers/get_article_by_id';
import { getArticleBySlug } from './handlers/get_article_by_slug';
import { updateArticle } from './handlers/update_article';
import { deleteArticle } from './handlers/delete_article';
import { getPublishedArticles } from './handlers/get_published_articles';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Article management endpoints
  createArticle: publicProcedure
    .input(createArticleInputSchema)
    .mutation(({ input }) => createArticle(input)),

  updateArticle: publicProcedure
    .input(updateArticleInputSchema)
    .mutation(({ input }) => updateArticle(input)),

  deleteArticle: publicProcedure
    .input(getArticleByIdInputSchema)
    .mutation(({ input }) => deleteArticle(input)),

  // Article retrieval endpoints
  getArticles: publicProcedure
    .input(listArticlesInputSchema)
    .query(({ input }) => getArticles(input)),

  getPublishedArticles: publicProcedure
    .input(listArticlesInputSchema.omit({ published: true }))
    .query(({ input }) => getPublishedArticles(input)),

  getArticleById: publicProcedure
    .input(getArticleByIdInputSchema)
    .query(({ input }) => getArticleById(input)),

  getArticleBySlug: publicProcedure
    .input(getArticleBySlugInputSchema)
    .query(({ input }) => getArticleBySlug(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Blog API server listening at port: ${port}`);
}

start();