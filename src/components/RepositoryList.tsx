import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, GitFork, Eye, Circle } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  language: string | null
  updated_at: string
  topics: string[]
  private: boolean
}

interface RepositoryListProps {
  username: string
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: 'oklch(0.8 0.15 90)',
  TypeScript: 'oklch(0.6 0.15 250)',
  Python: 'oklch(0.6 0.15 240)',
  Java: 'oklch(0.55 0.2 30)',
  Go: 'oklch(0.7 0.12 200)',
  Rust: 'oklch(0.4 0.1 20)',
  Ruby: 'oklch(0.5 0.2 10)',
  PHP: 'oklch(0.55 0.15 270)',
  C: 'oklch(0.45 0.05 240)',
  'C++': 'oklch(0.5 0.15 340)',
  'C#': 'oklch(0.5 0.15 140)',
  Swift: 'oklch(0.6 0.2 30)',
  Kotlin: 'oklch(0.6 0.2 280)',
  Dart: 'oklch(0.6 0.15 200)',
  HTML: 'oklch(0.6 0.2 20)',
  CSS: 'oklch(0.5 0.15 260)',
  Vue: 'oklch(0.6 0.15 160)',
  React: 'oklch(0.7 0.15 210)'
}

export function RepositoryList({ username }: RepositoryListProps) {
  const [repos, setRepos] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated')

  useEffect(() => {
    if (username) {
      fetchRepositories()
    }
  }, [username])

  const fetchRepositories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=30`
      )

      if (!response.ok) {
        toast.error('Failed to fetch repositories')
        setIsLoading(false)
        return
      }

      const data = await response.json()
      setRepos(data)
    } catch (error) {
      toast.error('Network error', {
        description: 'Could not load repositories'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sortedRepos = [...repos].sort((a, b) => {
    switch (sortBy) {
      case 'stars':
        return b.stargazers_count - a.stargazers_count
      case 'name':
        return a.name.localeCompare(b.name)
      case 'updated':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Updated today'
    if (diffInDays === 1) return 'Updated yesterday'
    if (diffInDays < 7) return `Updated ${diffInDays} days ago`
    if (diffInDays < 30) return `Updated ${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `Updated ${Math.floor(diffInDays / 30)} months ago`
    return `Updated ${Math.floor(diffInDays / 365)} years ago`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No public repositories found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Repositories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {repos.length} public {repos.length === 1 ? 'repository' : 'repositories'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'updated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('updated')}
          >
            Recently Updated
          </Button>
          <Button
            variant={sortBy === 'stars' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('stars')}
          >
            Most Stars
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            Name
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedRepos.map((repo) => (
          <Card
            key={repo.id}
            className="p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-semibold text-primary hover:underline group-hover:text-accent transition-colors"
                    >
                      {repo.name}
                    </a>
                    {repo.private && (
                      <Badge variant="secondary" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {repo.language && (
                  <div className="flex items-center gap-2">
                    <Circle
                      weight="fill"
                      className="w-3 h-3"
                      style={{
                        color: LANGUAGE_COLORS[repo.language] || 'oklch(0.5 0.1 180)'
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{repo.language}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star weight="fill" className="w-4 h-4 text-accent" />
                  <span>{repo.stargazers_count}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <GitFork weight="fill" className="w-4 h-4" />
                  <span>{repo.forks_count}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye weight="fill" className="w-4 h-4" />
                  <span>{repo.watchers_count}</span>
                </div>

                <span className="text-sm text-muted-foreground ml-auto">
                  {formatDate(repo.updated_at)}
                </span>
              </div>

              {repo.topics && repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {repo.topics.slice(0, 5).map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {repo.topics.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{repo.topics.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
