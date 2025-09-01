import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Article } from '../../../server/src/schema';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

export function ArticleDetail({ article, onBack }: ArticleDetailProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string) => {
    // Simple paragraph formatting - split by double newlines
    return content.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              ← Back to Articles
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📝 My Blog</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <CardTitle className="text-3xl md:text-4xl leading-tight">
                  {article.title}
                </CardTitle>
                {article.published && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                    ✓ Published
                  </Badge>
                )}
              </div>
              
              {article.excerpt && (
                <div className="bg-gray-50 border-l-4 border-indigo-500 p-4 rounded">
                  <p className="text-gray-700 text-lg italic">
                    {article.excerpt}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-4">
                <span className="flex items-center gap-1">
                  📅 Published {formatDate(article.created_at)}
                </span>
                {article.updated_at.getTime() !== article.created_at.getTime() && (
                  <span className="flex items-center gap-1">
                    ✏️ Updated {formatDate(article.updated_at)}
                  </span>
                )}
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                  /{article.slug}
                </span>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-8">
              <div className="prose prose-lg max-w-none">
                {formatContent(article.content).map((paragraph: string, index: number) => (
                  <p key={index} className="text-gray-700 leading-relaxed mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-8 text-center">
            <Button onClick={onBack} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              ← Back to All Articles
            </Button>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">
            Built with ❤️ using React, tRPC, and Tailwind CSS
          </p>
          <p className="text-gray-400 text-sm mt-2">
            © 2024 My Blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}