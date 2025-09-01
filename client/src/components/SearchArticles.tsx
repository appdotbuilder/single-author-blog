import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import type { Article } from '../../../server/src/schema';

interface SearchArticlesProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  isLoading: boolean;
}

export function SearchArticles({ articles, onArticleClick, isLoading }: SearchArticlesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) {
      return articles;
    }
    
    const term = searchTerm.toLowerCase();
    return articles.filter((article: Article) =>
      article.title.toLowerCase().includes(term) ||
      article.content.toLowerCase().includes(term) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(term)) ||
      article.slug.toLowerCase().includes(term)
    );
  }, [articles, searchTerm]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative max-w-md mx-auto">
        <Input
          type="text"
          placeholder="🔍 Search articles..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pr-20"
        />
        {searchTerm && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Search Results Summary */}
      {searchTerm.trim() && (
        <div className="text-center">
          <p className="text-gray-600">
            {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} 
            {filteredArticles.length > 0 && ` for "${searchTerm}"`}
          </p>
        </div>
      )}

      {/* No Results */}
      {searchTerm.trim() && filteredArticles.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles found</h3>
          <p className="text-gray-500 mb-4">
            No articles match your search for "{searchTerm}"
          </p>
          <Button variant="outline" onClick={clearSearch}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Articles Grid */}
      {filteredArticles.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article: Article) => (
            <Card 
              key={article.id} 
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
              onClick={() => onArticleClick(article)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {searchTerm.trim() ? 
                      highlightText(article.title, searchTerm) : 
                      article.title
                    }
                  </CardTitle>
                  {article.published && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                      ✓ Published
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {article.excerpt && (
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {searchTerm.trim() ? 
                      highlightText(article.excerpt, searchTerm) : 
                      article.excerpt
                    }
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>📅 {formatDate(article.created_at)}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    /{searchTerm.trim() ? 
                      highlightText(article.slug, searchTerm) : 
                      article.slug
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}