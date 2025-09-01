import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Article, CreateArticleInput, UpdateArticleInput } from '../../../server/src/schema';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  // Form state for creating/editing articles
  const [formData, setFormData] = useState<CreateArticleInput>({
    title: '',
    content: '',
    excerpt: null,
    slug: '',
    published: false
  });

  // Load all articles (published and drafts)
  const loadAllArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getArticles.query({ 
        limit: 50,
        offset: 0 
      });
      setArticles(result);
    } catch (error) {
      console.error('Failed to load articles:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllArticles();
  }, [loadAllArticles]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev: CreateArticleInput) => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingArticle) {
        // Update existing article
        const updateData: UpdateArticleInput = {
          id: editingArticle.id,
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || null,
          slug: formData.slug,
          published: formData.published
        };
        
        const updatedArticle = await trpc.updateArticle.mutate(updateData);
        if (updatedArticle) {
          setArticles((prev: Article[]) =>
            prev.map((article: Article) => 
              article.id === editingArticle.id ? updatedArticle : article
            )
          );
        }
      } else {
        // Create new article
        const newArticle = await trpc.createArticle.mutate(formData);
        if (newArticle) {
          setArticles((prev: Article[]) => [newArticle, ...prev]);
        }
      }
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Failed to save article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      slug: article.slug,
      published: article.published
    });
  };

  const handleDelete = async (articleId: number) => {
    try {
      await trpc.deleteArticle.mutate({ id: articleId });
      setArticles((prev: Article[]) => 
        prev.filter((article: Article) => article.id !== articleId)
      );
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: null,
      slug: '',
      published: false
    });
    setEditingArticle(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const publishedArticles = articles.filter((article: Article) => article.published);
  const draftArticles = articles.filter((article: Article) => !article.published);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="outline" size="sm">
                ← Back to Blog
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🛠️ Admin Panel</h1>
                <p className="text-gray-600 mt-1">Manage your blog articles</p>
              </div>
            </div>
            <Button 
              onClick={loadAllArticles}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">✏️ Write Article</TabsTrigger>
            <TabsTrigger value="published">📰 Published ({publishedArticles.length})</TabsTrigger>
            <TabsTrigger value="drafts">📝 Drafts ({draftArticles.length})</TabsTrigger>
          </TabsList>

          {/* Write/Edit Article Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingArticle ? '✏️ Edit Article' : '✨ Create New Article'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter article title..."
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleTitleChange(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      placeholder="url-friendly-slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateArticleInput) => ({ ...prev, slug: e.target.value }))
                      }
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Will be used in URL: /articles/{formData.slug}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="Brief summary of the article (optional)..."
                      value={formData.excerpt || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateArticleInput) => ({
                          ...prev,
                          excerpt: e.target.value || null
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your article content here..."
                      value={formData.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateArticleInput) => ({ ...prev, content: e.target.value }))
                      }
                      rows={12}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked: boolean) =>
                        setFormData((prev: CreateArticleInput) => ({ ...prev, published: checked }))
                      }
                    />
                    <Label htmlFor="published">
                      {formData.published ? '📰 Publish immediately' : '📝 Save as draft'}
                    </Label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading 
                        ? 'Saving...' 
                        : editingArticle 
                          ? '💾 Update Article' 
                          : '✨ Create Article'
                      }
                    </Button>
                    {editingArticle && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        ❌ Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>

                {/* Stub Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The backend is currently using stub implementations. 
                    Article creation/editing will appear to work but won't persist.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Published Articles Tab */}
          <TabsContent value="published">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Published Articles</h2>
              {publishedArticles.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">📰</div>
                    <p className="text-gray-500">No published articles yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {publishedArticles.map((article: Article) => (
                    <Card key={article.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Published {formatDate(article.created_at)}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Published</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {article.excerpt && (
                          <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(article)}
                          >
                            ✏️ Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                🗑️ Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Article</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{article.title}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(article.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Draft Articles Tab */}
          <TabsContent value="drafts">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Draft Articles</h2>
              {draftArticles.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-500">No draft articles.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {draftArticles.map((article: Article) => (
                    <Card key={article.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Last edited {formatDate(article.updated_at)}
                            </p>
                          </div>
                          <Badge variant="outline">Draft</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {article.excerpt && (
                          <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(article)}
                          >
                            ✏️ Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                🗑️ Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the draft "{article.title}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(article.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}