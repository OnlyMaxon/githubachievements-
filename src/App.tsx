import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AchievementCard } from '@/components/AchievementCard'
import { AchievementDetails } from '@/components/AchievementDetails'
import { UserProfileHeader } from '@/components/UserProfileHeader'
import { RepositoryList } from '@/components/RepositoryList'
import { achievements, Achievement, UserData } from '@/lib/achievements'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Trophy, Lock, Target, Folder } from '@phosphor-icons/react'

function App() {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [userData, setUserData] = useKV<UserData | null>('github-user-data', null)
  const [unlockedAchievements, setUnlockedAchievements] = useKV<string[]>('unlocked-achievements', [])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [mainTab, setMainTab] = useState('achievements')

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await window.spark.user()
        if (user && user.login) {
          fetchUserData(user.login)
        }
      } catch (error) {
        console.error('Failed to load current user:', error)
      }
    }
    
    if (!userData) {
      loadCurrentUser()
    }
  }, [])

  const fetchUserData = async (username: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`https://api.github.com/users/${username}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('User not found', {
            description: `The username "${username}" does not exist on GitHub.`
          })
        } else {
          toast.error('Failed to fetch user data', {
            description: 'Please try again later.'
          })
        }
        setIsLoading(false)
        return
      }

      const data = await response.json()
      
      const user: UserData = {
        login: data.login,
        avatarUrl: data.avatar_url,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at
      }

      setUserData(user)
      simulateUnlockedAchievements(user)
      toast.success('Profile loaded!', {
        description: `Viewing achievements for @${username}`
      })
    } catch (error) {
      toast.error('Network error', {
        description: 'Could not connect to GitHub API.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const simulateUnlockedAchievements = (user: UserData) => {
    const unlocked: string[] = []
    
    if (user.publicRepos >= 2) {
      unlocked.push('yolo', 'quickdraw')
    }
    
    if (user.publicRepos >= 5) {
      unlocked.push('open-sourcerer', 'heart-on-sleeve')
    }

    if (user.followers >= 10) {
      unlocked.push('pair-extraordinaire')
    }

    const accountAge = Date.now() - new Date(user.createdAt).getTime()
    const daysOld = accountAge / (1000 * 60 * 60 * 24)
    
    if (daysOld > 365) {
      unlocked.push('pull-shark')
    }

    setUnlockedAchievements(() => unlocked)
  }

  const getAchievementProgress = (achievement: Achievement): number => {
    if (!userData || !unlockedAchievements) return 0
    
    if (unlockedAchievements.includes(achievement.id)) {
      return 100
    }

    switch (achievement.id) {
      case 'pull-shark':
        return Math.min((userData.publicRepos / 2) * 100, 99)
      case 'starstruck':
        return Math.min((userData.followers / 16) * 100, 99)
      case 'open-sourcerer':
        return Math.min((userData.publicRepos / 3) * 100, 99)
      case 'pair-extraordinaire':
        return Math.min((userData.followers / 10) * 100, 99)
      default:
        return userData.publicRepos > 0 ? 25 : 0
    }
  }

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
    setDetailsOpen(true)
  }

  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === 'all') return true
    if (activeTab === 'unlocked') return unlockedAchievements?.includes(achievement.id)
    if (activeTab === 'locked') return !unlockedAchievements?.includes(achievement.id)
    return true
  })

  const unlockedCount = achievements.filter(a => unlockedAchievements?.includes(a.id)).length

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              GitHub Achievements
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your progress and learn how to earn all GitHub profile achievements
            </p>
          </div>

          <UserProfileHeader
            user={userData ?? null}
            unlockedCount={unlockedCount}
            totalCount={achievements.length}
            onSearch={fetchUserData}
            isLoading={isLoading}
          />

          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="achievements" className="gap-2">
                <Trophy className="w-4 h-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="repositories" className="gap-2" disabled={!userData}>
                <Folder className="w-4 h-4" />
                Repositories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="achievements" className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all" className="gap-2">
                    <Trophy className="w-4 h-4" />
                    All ({achievements.length})
                  </TabsTrigger>
                  <TabsTrigger value="unlocked" className="gap-2">
                    <Trophy weight="fill" className="w-4 h-4" />
                    Unlocked ({unlockedCount})
                  </TabsTrigger>
                  <TabsTrigger value="locked" className="gap-2">
                    <Lock className="w-4 h-4" />
                    Locked ({achievements.length - unlockedCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  {filteredAchievements.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <Target className="w-16 h-16 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">No achievements here yet</h3>
                        <p className="text-muted-foreground">
                          {activeTab === 'unlocked' 
                            ? 'Start contributing to unlock achievements!' 
                            : 'Keep working to unlock more achievements!'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAchievements.map(achievement => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          unlocked={unlockedAchievements?.includes(achievement.id) || false}
                          progress={getAchievementProgress(achievement)}
                          onClick={() => handleAchievementClick(achievement)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="repositories" className="mt-6">
              {userData && <RepositoryList username={userData.login} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AchievementDetails
        achievement={selectedAchievement}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        unlocked={selectedAchievement ? unlockedAchievements?.includes(selectedAchievement.id) || false : false}
        progress={selectedAchievement ? getAchievementProgress(selectedAchievement) : 0}
      />
    </div>
  )
}

export default App