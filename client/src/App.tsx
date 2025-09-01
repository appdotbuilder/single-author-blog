import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Article } from '../../server/src/schema';
import { ArticleDetail } from '@/components/ArticleDetail';
import { AdminPanel } from '@/components/AdminPanel';
import { SearchArticles } from '@/components/SearchArticles';

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'list' | 'detail' | 'admin'>('list');

  // Load published articles for public blog view
  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Using getPublishedArticles for public blog display
      const result = await trpc.getPublishedArticles.query({ 
        limit: 20,
        offset: 0 
      });
      setArticles(result);
    } catch (error) {
      console.error('Failed to load articles:', error);
      // Since backend is using stubs, we'll show a message about this
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    setView('list');
  };

  const handleAdminClick = () => {
    setView('admin');
  };

  const handleBackFromAdmin = () => {
    setView('list');
    // Refresh articles when coming back from admin
    loadArticles();
  };



  if (view === 'detail' && selectedArticle) {
    return (
      <ArticleDetail 
        article={selectedArticle} 
        onBack={handleBackToList}
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminPanel onBack={handleBackFromAdmin} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📝 My Blog</h1>
              <p className="text-gray-600 mt-1">Thoughts, stories, and ideas</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAdminClick}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                🛠️ Admin Panel
              </Button>
              <Button 
                onClick={loadArticles}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading articles...</p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Articles Published Yet</h2>
            <p className="text-gray-500 mb-6">
              The blog is ready, but no articles have been published yet.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The backend is currently using stub implementations. 
                In a real application, published articles would appear here automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">Latest Articles</h2>
              <p className="text-gray-600 mt-2">
                {articles.length} article{articles.length !== 1 ? 's' : ''} published
              </p>
            </div>

            <SearchArticles 
              articles={articles}
              onArticleClick={handleArticleClick}
              isLoading={isLoading}
            />
          </div>
        )}
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

export default App;