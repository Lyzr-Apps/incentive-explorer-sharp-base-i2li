'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { FiAward, FiTarget, FiMap, FiUser, FiChevronRight, FiStar, FiZap, FiTrendingUp, FiCheckCircle, FiXCircle, FiArrowLeft, FiPlay, FiLock, FiBarChart2, FiCompass, FiFlag, FiGift, FiInfo, FiLayers, FiShield } from 'react-icons/fi'
import { HiOutlineLightBulb, HiOutlineSparkles, HiOutlineTrophy, HiOutlineRocketLaunch, HiOutlineBuildingOffice, HiOutlineDocumentText, HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import { BsBuilding, BsLightning, BsStars } from 'react-icons/bs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

// ===== CONSTANTS =====
const INCENTIVE_EXPLORER_AGENT_ID = '699b89f3108f0261e19ab0e3'
const BUSINESS_QUEST_AGENT_ID = '699b89f3108f0261e19ab0e5'
const PROGRESS_ADVISOR_AGENT_ID = '699b89f3ba7d62583e0a4a42'

// ===== TYPES =====
type Screen = 'dashboard' | 'level1' | 'level2' | 'profile'

interface GameState {
  level1Points: number
  level2Points: number
  level1QuestsCompleted: number
  level2StepsCompleted: number
  level1Accuracy: number
  level1Correct: number
  level1Total: number
  level2Choices: string[]
  achievements: string[]
  streak: number
  bestStreak: number
  level1Complete: boolean
  level2Complete: boolean
}

interface Level1Response {
  quest_number?: number
  total_quests?: number
  scenario?: string
  question?: string
  options?: { A?: string; B?: string; C?: string; D?: string }
  feedback?: string | null
  correct_answer?: string | null
  explanation?: string | null
  points_earned?: number
  streak_count?: number
  streak_bonus?: number
  total_points?: number
  achievement_unlocked?: string | null
  is_complete?: boolean
  level_summary?: string | null
}

interface Level2Choice {
  id?: string
  icon?: string
  title?: string
  description?: string
}

interface Level2Response {
  step_number?: number
  total_steps?: number
  step_title?: string
  narrative?: string
  choices?: Level2Choice[]
  feedback?: string | null
  chosen_path?: string | null
  explanation?: string | null
  did_you_know?: string | null
  points_earned?: number
  total_points?: number
  achievement_unlocked?: string | null
  is_complete?: boolean
  adventure_summary?: string | null
}

interface ProfileResponse {
  overall_score?: number
  completion_percentage?: number
  rank?: string
  strengths?: string[]
  knowledge_gaps?: string[]
  recommended_incentives?: { name?: string; description?: string; priority?: string }[]
  next_steps?: { step?: string; reason?: string; priority?: number }[]
  level1_analysis?: { score?: number; accuracy?: number; best_topic?: string; weakest_topic?: string }
  level2_analysis?: { path_taken?: string; business_type?: string; completion?: number; optimal_choices?: number }
  achievements_summary?: { earned?: number; total?: number; recent?: string[] }
  personalized_message?: string
}

// ===== ACHIEVEMENTS =====
const ALL_ACHIEVEMENTS = [
  { id: 'first_quest', name: 'First Steps', description: 'Complete your first trivia quest', icon: FiPlay },
  { id: 'streak_3', name: 'On Fire', description: 'Get 3 correct answers in a row', icon: FiZap },
  { id: 'streak_5', name: 'Unstoppable', description: 'Get 5 correct answers in a row', icon: BsLightning },
  { id: 'level1_half', name: 'Halfway There', description: 'Complete 5 Level 1 quests', icon: FiTarget },
  { id: 'level1_complete', name: 'Incentive Expert', description: 'Complete all Level 1 quests', icon: HiOutlineTrophy },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% accuracy in Level 1', icon: FiStar },
  { id: 'first_step', name: 'Adventure Begins', description: 'Start the Business Quest', icon: FiCompass },
  { id: 'business_structure', name: 'Structured', description: 'Choose your business structure', icon: BsBuilding },
  { id: 'level2_half', name: 'Entrepreneur Rising', description: 'Complete 4 Business Quest steps', icon: FiTrendingUp },
  { id: 'level2_complete', name: 'Business Ready', description: 'Complete the Business Quest', icon: HiOutlineRocketLaunch },
  { id: 'optimal_path', name: 'Optimal Route', description: 'Make all optimal choices in Level 2', icon: FiAward },
  { id: 'both_levels', name: 'Double Agent', description: 'Complete both levels', icon: FiLayers },
  { id: 'profile_generated', name: 'Self Aware', description: 'Generate your readiness profile', icon: FiUser },
  { id: 'points_500', name: 'Point Collector', description: 'Earn 500 total points', icon: FiGift },
  { id: 'points_1000', name: 'High Roller', description: 'Earn 1000 total points', icon: BsStars },
]

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Sarah M.', points: 1250 },
  { rank: 2, name: 'James K.', points: 1100 },
  { rank: 3, name: 'Maria L.', points: 980 },
  { rank: 4, name: 'David R.', points: 850 },
  { rank: 5, name: 'Emily W.', points: 720 },
]

// Sample data for toggle
const SAMPLE_LEVEL1: Level1Response = {
  quest_number: 3,
  total_quests: 10,
  scenario: 'A tech startup founder in Frederick County has just received approval for their business plan and is now looking at available financial incentives. The county offers several programs designed to help new businesses get off the ground.',
  question: 'Which Frederick County incentive program provides tax credits specifically for technology companies that create new jobs?',
  options: {
    A: 'Frederick County Technology Tax Credit Program',
    B: 'Maryland Small Business Innovation Research Grant',
    C: 'Enterprise Zone Tax Credits',
    D: 'Frederick County Business Startup Fund',
  },
  feedback: null,
  correct_answer: null,
  explanation: null,
  points_earned: 0,
  streak_count: 2,
  streak_bonus: 0,
  total_points: 100,
  achievement_unlocked: null,
  is_complete: false,
  level_summary: null,
}

const SAMPLE_LEVEL2: Level2Response = {
  step_number: 2,
  total_steps: 8,
  step_title: 'Choosing Your Business Structure',
  narrative: 'Now that you have your business idea solidified, it is time to decide on a legal structure. This decision will affect your taxes, liability, and how you can raise capital. In Frederick County, the choice of business structure also determines which local incentive programs you qualify for.',
  choices: [
    { id: 'llc', icon: 'building', title: 'Limited Liability Company (LLC)', description: 'Flexible structure with personal liability protection. Popular among small businesses in Frederick County.' },
    { id: 'corp', icon: 'corporate', title: 'S-Corporation', description: 'Offers tax advantages for profitable businesses. Required for some state grant programs.' },
    { id: 'sole', icon: 'person', title: 'Sole Proprietorship', description: 'Simplest structure to set up. Lowest startup costs but unlimited personal liability.' },
  ],
  feedback: null,
  chosen_path: null,
  explanation: null,
  did_you_know: null,
  points_earned: 0,
  total_points: 75,
  achievement_unlocked: null,
  is_complete: false,
  adventure_summary: null,
}

const SAMPLE_PROFILE: ProfileResponse = {
  overall_score: 78,
  completion_percentage: 65,
  rank: 'Rising Entrepreneur',
  strengths: ['Tax credit knowledge', 'Business registration process', 'Understanding of local zoning requirements'],
  knowledge_gaps: ['Federal grant application process', 'Environmental compliance requirements'],
  recommended_incentives: [
    { name: 'Enterprise Zone Tax Credits', description: 'Up to 80% property tax credit for businesses in designated zones', priority: 'High' },
    { name: 'Small Business Innovation Grant', description: 'Grants up to $25,000 for innovative startups', priority: 'Medium' },
  ],
  next_steps: [
    { step: 'Complete Level 2 Business Quest', reason: 'Build practical knowledge of startup steps', priority: 1 },
    { step: 'Review Enterprise Zone map', reason: 'Identify optimal business location', priority: 2 },
  ],
  level1_analysis: { score: 80, accuracy: 75, best_topic: 'Tax Credits', weakest_topic: 'Federal Programs' },
  level2_analysis: { path_taken: 'LLC Route', business_type: 'Technology', completion: 50, optimal_choices: 3 },
  achievements_summary: { earned: 6, total: 15, recent: ['First Steps', 'On Fire', 'Adventure Begins'] },
  personalized_message: 'Great progress so far! You have a solid understanding of local tax incentives. Focus on federal grant programs to round out your knowledge.',
}

// ===== DEFAULT GAME STATE =====
const DEFAULT_GAME_STATE: GameState = {
  level1Points: 0,
  level2Points: 0,
  level1QuestsCompleted: 0,
  level2StepsCompleted: 0,
  level1Accuracy: 0,
  level1Correct: 0,
  level1Total: 0,
  level2Choices: [],
  achievements: [],
  streak: 0,
  bestStreak: 0,
  level1Complete: false,
  level2Complete: false,
}

// ===== HELPER: Parse agent response =====
function parseAgentResponse(data: any): any {
  if (!data) return {}
  let parsed: any = data
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data)
    } catch {
      const jsonMatch = data.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim())
        } catch {
          parsed = data
        }
      } else {
        parsed = data
      }
    }
  }
  return parsed
}

// ===== HELPER: Generate session ID =====
function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

// ===== HELPER: Render markdown =====
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line: string, i: number) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : <React.Fragment key={i}>{part}</React.Fragment>
  )
}

// ===== PROGRESS RING COMPONENT =====
function ProgressRing({ progress, size = 80, strokeWidth = 6, color = 'hsl(262, 83%, 58%)' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(270, 20%, 90%)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{Math.round(progress)}%</span>
    </div>
  )
}

// ===== ANIMATED POINTS COMPONENT =====
function AnimatedPoints({ target }: { target: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (target === 0) { setDisplay(0); return }
    let current = 0
    const step = Math.max(1, Math.floor(target / 30))
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setDisplay(target); clearInterval(timer) }
      else { setDisplay(current) }
    }, 30)
    return () => clearInterval(timer)
  }, [target])
  return <span>{display}</span>
}

// ===== ACHIEVEMENT POPUP COMPONENT =====
function AchievementPopup({ achievement, onClose }: { achievement: string | null; onClose: () => void }) {
  const ach = ALL_ACHIEVEMENTS.find(a => a.id === achievement)
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])
  if (!achievement || !ach) return null
  const IconComp = ach.icon
  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce">
      <Card className="bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-2xl shadow-purple-500/30 border-0 w-72">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <IconComp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs opacity-80">Achievement Unlocked!</p>
            <p className="font-bold text-sm">{ach.name}</p>
            <p className="text-xs opacity-80">{ach.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== FLOATING POINTS ANIMATION =====
function FloatingPoints({ points, visible }: { points: number; visible: boolean }) {
  if (!visible || points <= 0) return null
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-green-500 font-bold text-lg animate-bounce pointer-events-none">
      +{points} pts
    </div>
  )
}

// ===== LOADING SKELETON FOR GAMEPLAY =====
function GameplaySkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Skeleton className="h-6 w-48 mx-auto" />
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <div className="h-4" />
          <Skeleton className="h-5 w-3/4" />
          <div className="space-y-3 mt-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== ERROR BOUNDARY =====
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ===== MAIN PAGE =====
export default function Page() {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [sampleData, setSampleData] = useState(false)

  // Game state
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE)
  const [gameLoaded, setGameLoaded] = useState(false)

  // Level 1 state
  const [level1Data, setLevel1Data] = useState<Level1Response | null>(null)
  const [level1Loading, setLevel1Loading] = useState(false)
  const [level1Error, setLevel1Error] = useState<string | null>(null)
  const [level1SessionId, setLevel1SessionId] = useState('')
  const [level1Answered, setLevel1Answered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [level1FeedbackData, setLevel1FeedbackData] = useState<Level1Response | null>(null)
  const [showLevel1Summary, setShowLevel1Summary] = useState(false)

  // Level 2 state
  const [level2Data, setLevel2Data] = useState<Level2Response | null>(null)
  const [level2Loading, setLevel2Loading] = useState(false)
  const [level2Error, setLevel2Error] = useState<string | null>(null)
  const [level2SessionId, setLevel2SessionId] = useState('')
  const [level2Answered, setLevel2Answered] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [level2FeedbackData, setLevel2FeedbackData] = useState<Level2Response | null>(null)
  const [showLevel2Summary, setShowLevel2Summary] = useState(false)

  // Profile state
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Achievement popup
  const [achievementPopup, setAchievementPopup] = useState<string | null>(null)

  // Points animation
  const [showPointsAnim, setShowPointsAnim] = useState(false)
  const [lastPointsEarned, setLastPointsEarned] = useState(0)

  // Active agent tracking
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Load game state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('frederick_adventure_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        setGameState({ ...DEFAULT_GAME_STATE, ...parsed })
      }
    } catch {
      // ignore
    }
    setGameLoaded(true)
  }, [])

  // Save game state
  useEffect(() => {
    if (gameLoaded) {
      try {
        localStorage.setItem('frederick_adventure_state', JSON.stringify(gameState))
      } catch {
        // ignore
      }
    }
  }, [gameState, gameLoaded])

  // Helper: add achievement
  const addAchievement = useCallback((id: string) => {
    setGameState(prev => {
      if (prev.achievements.includes(id)) return prev
      setAchievementPopup(id)
      return { ...prev, achievements: [...prev.achievements, id] }
    })
  }, [])

  // Helper: check point-based achievements
  const checkPointAchievements = useCallback((totalPoints: number) => {
    if (totalPoints >= 500) addAchievement('points_500')
    if (totalPoints >= 1000) addAchievement('points_1000')
  }, [addAchievement])

  // Total points
  const totalPoints = gameState.level1Points + gameState.level2Points
  const overallCompletion = ((gameState.level1Complete ? 50 : (gameState.level1QuestsCompleted / 10) * 50) + (gameState.level2Complete ? 50 : (gameState.level2StepsCompleted / 8) * 50))

  // ===== LEVEL 1 FUNCTIONS =====
  const startLevel1 = async () => {
    setCurrentScreen('level1')
    setLevel1Loading(true)
    setLevel1Error(null)
    setLevel1Answered(false)
    setSelectedAnswer(null)
    setLevel1FeedbackData(null)
    setShowLevel1Summary(false)
    const sid = generateSessionId()
    setLevel1SessionId(sid)
    setActiveAgentId(INCENTIVE_EXPLORER_AGENT_ID)

    try {
      const result = await callAIAgent('START_LEVEL_1', INCENTIVE_EXPLORER_AGENT_ID, { user_id: 'player', session_id: sid })
      setActiveAgentId(null)
      if (result.success) {
        const data = parseAgentResponse(result?.response?.result)
        setLevel1Data(data)
        addAchievement('first_quest')
      } else {
        setLevel1Error(result?.error ?? 'Failed to start Level 1')
      }
    } catch (e: any) {
      setLevel1Error(e?.message ?? 'Network error')
      setActiveAgentId(null)
    }
    setLevel1Loading(false)
  }

  const answerLevel1 = async (answer: string) => {
    if (level1Answered) return
    setSelectedAnswer(answer)
    setLevel1Loading(true)
    setLevel1Answered(true)
    setActiveAgentId(INCENTIVE_EXPLORER_AGENT_ID)

    const questNum = level1Data?.quest_number ?? 1
    const msg = `My answer is ${answer}. Quest number: ${questNum}, Current points: ${gameState.level1Points}, Streak: ${gameState.streak}`

    try {
      const result = await callAIAgent(msg, INCENTIVE_EXPLORER_AGENT_ID, { user_id: 'player', session_id: level1SessionId })
      setActiveAgentId(null)
      if (result.success) {
        const data = parseAgentResponse(result?.response?.result)
        setLevel1FeedbackData(data)

        const pointsEarned = data?.points_earned ?? 0
        const streakCount = data?.streak_count ?? 0
        const isCorrect = data?.correct_answer === answer
        const newCorrect = gameState.level1Correct + (isCorrect ? 1 : 0)
        const newTotal = gameState.level1Total + 1

        if (pointsEarned > 0) {
          setLastPointsEarned(pointsEarned)
          setShowPointsAnim(true)
          setTimeout(() => setShowPointsAnim(false), 1500)
        }

        setGameState(prev => {
          const updated = {
            ...prev,
            level1Points: data?.total_points ?? prev.level1Points + pointsEarned,
            level1QuestsCompleted: questNum,
            level1Correct: newCorrect,
            level1Total: newTotal,
            level1Accuracy: newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0,
            streak: streakCount,
            bestStreak: Math.max(prev.bestStreak, streakCount),
          }
          return updated
        })

        if (streakCount >= 3) addAchievement('streak_3')
        if (streakCount >= 5) addAchievement('streak_5')
        if (questNum >= 5) addAchievement('level1_half')

        if (data?.achievement_unlocked) addAchievement(data.achievement_unlocked)

        if (data?.is_complete) {
          setGameState(prev => ({ ...prev, level1Complete: true }))
          addAchievement('level1_complete')
          if (gameState.level1Total + 1 === gameState.level1Correct + (isCorrect ? 1 : 0)) {
            addAchievement('perfect_score')
          }
          if (gameState.level2Complete) addAchievement('both_levels')
          setShowLevel1Summary(true)
        }

        checkPointAchievements((data?.total_points ?? 0) + gameState.level2Points)
      } else {
        setLevel1Error(result?.error ?? 'Failed to submit answer')
        setLevel1Answered(false)
        setSelectedAnswer(null)
      }
    } catch (e: any) {
      setLevel1Error(e?.message ?? 'Network error')
      setLevel1Answered(false)
      setSelectedAnswer(null)
      setActiveAgentId(null)
    }
    setLevel1Loading(false)
  }

  const nextLevel1Quest = async () => {
    setLevel1Loading(true)
    setLevel1Answered(false)
    setSelectedAnswer(null)
    setLevel1FeedbackData(null)
    setActiveAgentId(INCENTIVE_EXPLORER_AGENT_ID)

    const nextQuest = (level1Data?.quest_number ?? 0) + 1
    const msg = `Next quest please. Quest number: ${nextQuest}, Current points: ${gameState.level1Points}, Streak: ${gameState.streak}`

    try {
      const result = await callAIAgent(msg, INCENTIVE_EXPLORER_AGENT_ID, { user_id: 'player', session_id: level1SessionId })
      setActiveAgentId(null)
      if (result.success) {
        const data = parseAgentResponse(result?.response?.result)
        setLevel1Data(data)
      } else {
        setLevel1Error(result?.error ?? 'Failed to load next quest')
      }
    } catch (e: any) {
      setLevel1Error(e?.message ?? 'Network error')
      setActiveAgentId(null)
    }
    setLevel1Loading(false)
  }

  // ===== LEVEL 2 FUNCTIONS =====
  const startLevel2 = async () => {
    setCurrentScreen('level2')
    setLevel2Loading(true)
    setLevel2Error(null)
    setLevel2Answered(false)
    setSelectedChoice(null)
    setLevel2FeedbackData(null)
    setShowLevel2Summary(false)
    const sid = generateSessionId()
    setLevel2SessionId(sid)
    setActiveAgentId(BUSINESS_QUEST_AGENT_ID)

    try {
      const result = await callAIAgent('START_LEVEL_2', BUSINESS_QUEST_AGENT_ID, { user_id: 'player', session_id: sid })
      setActiveAgentId(null)
      if (result.success) {
        const data = parseAgentResponse(result?.response?.result)
        setLevel2Data(data)
        addAchievement('first_step')
      } else {
        setLevel2Error(result?.error ?? 'Failed to start Level 2')
      }
    } catch (e: any) {
      setLevel2Error(e?.message ?? 'Network error')
      setActiveAgentId(null)
    }
    setLevel2Loading(false)
  }

  const chooseLevel2 = async (choiceId: string) => {
    if (level2Answered) return
    setSelectedChoice(choiceId)
    setLevel2Loading(true)
    setLevel2Answered(true)
    setActiveAgentId(BUSINESS_QUEST_AGENT_ID)

    const stepNum = level2Data?.step_number ?? 1
    const choiceTitle = Array.isArray(level2Data?.choices) ? level2Data?.choices?.find(c => c?.id === choiceId)?.title ?? choiceId : choiceId
    const msg = `I choose: ${choiceId} (${choiceTitle}). Step number: ${stepNum}, Current points: ${gameState.level2Points}`

    try {
      const result = await callAIAgent(msg, BUSINESS_QUEST_AGENT_ID, { user_id: 'player', session_id: level2SessionId })
      setActiveAgentId(null)
      if (result.success) {
        const data = parseAgentResponse(result?.response?.result)
        setLevel2FeedbackData(data)

        const pointsEarned = data?.points_earned ?? 0

        if (pointsEarned > 0) {
          setLastPointsEarned(pointsEarned)
          setShowPointsAnim(true)
          setTimeout(() => setShowPointsAnim(false), 1500)
        }

        setGameState(prev => ({
          ...prev,
          level2Points: data?.total_points ?? prev.level2Points + pointsEarned,
          level2StepsCompleted: stepNum,
          level2Choices: [...prev.level2Choices, choiceId],
        }))

        if (stepNum === 2 || choiceId.includes('llc') || choiceId.includes('corp') || choiceId.includes('sole')) {
          addAchievement('business_structure')
        }
        if (stepNum >= 4) addAchievement('level2_half')

        if (data?.achievement_unlocked) addAchievement(data.achievement_unlocked)

        if (data?.is_complete) {
          setGameState(prev => ({ ...prev, level2Complete: true }))
          addAchievement('level2_complete')
          if (gameState.level1Complete) addAchievement('both_levels')
          setShowLevel2Summary(true)
        }

        checkPointAchievements(gameState.level1Points + (data?.total_points ?? 0))
      } else {
        setLevel2Error(result?.error ?? 'Failed to submit choice')
        setLevel2Answered(false)
        setSelectedChoice(null)
      }
    } catch (e: any) {
      setLevel2Error(e?.message ?? 'Network error')
      setLevel2Answered(false)
      setSelectedChoice(null)
      setActiveAgentId(null)
    }
    setLevel2Loading(false)
  }

  const nextLevel2Step = async () => {
    setLevel2Loading(true)
    setLevel2Answered(false)
    setSelectedChoice(null)
    setLevel2FeedbackData(null)
    setActiveAgentId(BUSINESS_QUEST_AGENT_ID)

    const nextStep = (level2Data?.step_number ?? 0) + 1
    const msg = `Continue to next step. Step number: ${nextStep}, Current points: ${gameState.level2Points}`

    try {
      const result = await callAIAgent(msg, BUSINESS_QUEST_AGENT_ID, { user_id: 'player', session_id: level2SessionId })
      setActiveAgentId(null)
      if (result.success) {
        const data = parseAgentResponse(result?.response?.result)
        setLevel2Data(data)
      } else {
        setLevel2Error(result?.error ?? 'Failed to load next step')
      }
    } catch (e: any) {
      setLevel2Error(e?.message ?? 'Network error')
      setActiveAgentId(null)
    }
    setLevel2Loading(false)
  }

  // ===== PROFILE FUNCTIONS =====
  const generateProfile = async () => {
    setProfileLoading(true)
    setProfileError(null)
    setActiveAgentId(PROGRESS_ADVISOR_AGENT_ID)

    const msg = `Generate my business readiness profile. Here is my progress:
Level 1: ${gameState.level1Complete ? 'Completed' : 'In Progress'}, Score: ${gameState.level1Points}, Accuracy: ${gameState.level1Accuracy}%, Correct: ${gameState.level1Correct}/${gameState.level1Total}
Level 2: ${gameState.level2Complete ? 'Completed' : 'In Progress'}, Score: ${gameState.level2Points}, Steps: ${gameState.level2StepsCompleted}/8, Choices: ${gameState.level2Choices.join(', ') || 'None yet'}
Total Achievements: ${gameState.achievements.length}/15
Achievements: ${gameState.achievements.join(', ') || 'None yet'}`

    try {
      const result = await callAIAgent(msg, PROGRESS_ADVISOR_AGENT_ID, { user_id: 'player', session_id: 'profile_' + Date.now() })
      setActiveAgentId(null)
      if (result.success) {
        const data = parseAgentResponse(result?.response?.result)
        setProfileData(data)
        addAchievement('profile_generated')
      } else {
        setProfileError(result?.error ?? 'Failed to generate profile')
      }
    } catch (e: any) {
      setProfileError(e?.message ?? 'Network error')
      setActiveAgentId(null)
    }
    setProfileLoading(false)
  }

  // ===== RENDER: NAV BAR =====
  function NavBar() {
    return (
      <nav className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentScreen('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <FiFlag className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent hidden sm:inline">Frederick Business Adventure</span>
            <span className="font-serif font-bold text-lg tracking-tight bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent sm:hidden">FBA</span>
          </div>

          <div className="flex items-center gap-1">
            {(['dashboard', 'level1', 'level2', 'profile'] as Screen[]).map(screen => {
              const labels: Record<Screen, string> = { dashboard: 'Hub', level1: 'Level 1', level2: 'Level 2', profile: 'Profile' }
              const icons: Record<Screen, React.ReactNode> = { dashboard: <FiCompass className="w-4 h-4" />, level1: <FiTarget className="w-4 h-4" />, level2: <FiMap className="w-4 h-4" />, profile: <FiUser className="w-4 h-4" /> }
              return (
                <button key={screen} onClick={() => setCurrentScreen(screen)} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 ${currentScreen === screen ? 'bg-primary text-primary-foreground shadow-md shadow-purple-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                  {icons[screen]}
                  <span className="hidden md:inline">{labels[screen]}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/10 to-pink-500/10 border border-purple-500/20">
              <FiStar className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-sm"><AnimatedPoints target={totalPoints} /></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Sample</span>
              <Switch checked={sampleData} onCheckedChange={setSampleData} />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // ===== RENDER: DASHBOARD =====
  function DashboardScreen() {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Frederick County Business Adventure Hub</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Master Frederick County business incentives and startup processes through interactive quests and adventures.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level Cards - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Level 1 Card */}
            <Card className="overflow-hidden border-border shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 md:w-48 flex flex-col items-center justify-center text-white">
                  <FiTarget className="w-10 h-10 mb-2" />
                  <span className="text-xs opacity-80 font-medium">LEVEL 1</span>
                  <ProgressRing progress={gameState.level1Complete ? 100 : (gameState.level1QuestsCompleted / 10) * 100} size={70} strokeWidth={5} color="white" />
                </div>
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif font-bold text-xl">Incentive Explorer</h3>
                    {gameState.level1Complete && <Badge className="bg-green-100 text-green-700 border-green-200">Complete</Badge>}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">Test your knowledge of Frederick County business incentives through 10 trivia quests. Earn points, build streaks, and unlock achievements.</p>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><FiStar className="w-4 h-4 text-yellow-500" /> {gameState.level1Points} pts</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><FiZap className="w-4 h-4 text-orange-500" /> Best Streak: {gameState.bestStreak}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><FiBarChart2 className="w-4 h-4 text-blue-500" /> {gameState.level1Accuracy}% accuracy</span>
                  </div>
                  <Button onClick={startLevel1} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/25 transition-all duration-300 group-hover:shadow-purple-500/40">
                    {gameState.level1Complete ? 'Replay Level 1' : gameState.level1QuestsCompleted > 0 ? 'Continue Level 1' : 'Enter Level 1'} <FiChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Level 2 Card */}
            <Card className="overflow-hidden border-border shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 md:w-48 flex flex-col items-center justify-center text-white">
                  <FiMap className="w-10 h-10 mb-2" />
                  <span className="text-xs opacity-80 font-medium">LEVEL 2</span>
                  <ProgressRing progress={gameState.level2Complete ? 100 : (gameState.level2StepsCompleted / 8) * 100} size={70} strokeWidth={5} color="white" />
                </div>
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif font-bold text-xl">Business Quest</h3>
                    {gameState.level2Complete && <Badge className="bg-green-100 text-green-700 border-green-200">Complete</Badge>}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">Navigate a choose-your-own-adventure through Maryland business startup steps. Make strategic decisions and learn real-world processes.</p>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><FiStar className="w-4 h-4 text-yellow-500" /> {gameState.level2Points} pts</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><FiLayers className="w-4 h-4 text-indigo-500" /> {gameState.level2StepsCompleted}/8 steps</span>
                  </div>
                  <Button onClick={startLevel2} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/25 transition-all duration-300 group-hover:shadow-pink-500/40">
                    {gameState.level2Complete ? 'Replay Level 2' : gameState.level2StepsCompleted > 0 ? 'Continue Level 2' : 'Enter Level 2'} <FiChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Player Stats */}
            <Card className="border-border shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><FiBarChart2 className="w-5 h-5 text-purple-500" /> Player Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"><AnimatedPoints target={totalPoints} /></p>
                  <p className="text-xs text-muted-foreground mt-1">Total Points</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold">{gameState.achievements.length}</p>
                    <p className="text-xs text-muted-foreground">Achievements</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold">{Math.round(overallCompletion)}%</p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <FiShield className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">{totalPoints >= 1000 ? 'Master Entrepreneur' : totalPoints >= 500 ? 'Rising Entrepreneur' : totalPoints >= 200 ? 'Aspiring Business Owner' : 'Newcomer'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="border-border shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><HiOutlineTrophy className="w-5 h-5 text-yellow-500" /> Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_LEADERBOARD.map((player) => (
                  <div key={player.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${player.rank === 1 ? 'bg-yellow-100 text-yellow-700' : player.rank === 2 ? 'bg-gray-100 text-gray-600' : player.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-secondary text-muted-foreground'}`}>{player.rank}</span>
                    <span className="flex-1 text-sm font-medium">{player.name}</span>
                    <span className="text-sm text-muted-foreground font-medium">{player.points} pts</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Achievements */}
        {gameState.achievements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><FiAward className="w-4 h-4" /> Recent Achievements</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {gameState.achievements.map(achId => {
                const ach = ALL_ACHIEVEMENTS.find(a => a.id === achId)
                if (!ach) return null
                const IconComp = ach.icon
                return (
                  <div key={achId} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/10 to-pink-500/10 border border-purple-500/20 flex-shrink-0">
                    <IconComp className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium whitespace-nowrap">{ach.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Agent Info */}
        <Card className="border-border shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Powered by AI Agents</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: INCENTIVE_EXPLORER_AGENT_ID, name: 'Incentive Explorer', purpose: 'Trivia quests about Frederick County incentives' },
                { id: BUSINESS_QUEST_AGENT_ID, name: 'Business Quest', purpose: 'Choose-your-own-adventure business scenarios' },
                { id: PROGRESS_ADVISOR_AGENT_ID, name: 'Progress Advisor', purpose: 'Personalized readiness reports and guidance' },
              ].map(agent => (
                <div key={agent.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{agent.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== RENDER: LEVEL 1 =====
  function Level1Screen() {
    const data = sampleData ? SAMPLE_LEVEL1 : level1Data
    const feedback = sampleData ? null : level1FeedbackData
    const loading = sampleData ? false : level1Loading
    const error = sampleData ? null : level1Error
    const answered = sampleData ? false : level1Answered
    const questNum = data?.quest_number ?? 0
    const totalQuests = data?.total_quests ?? 10

    if (loading && !data) return (
      <div>
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground"><FiArrowLeft className="mr-1 w-4 h-4" /> Hub</Button>
            <span className="text-sm text-muted-foreground">Loading...</span>
            <div className="flex items-center gap-2"><FiStar className="w-4 h-4 text-yellow-500" /><span className="text-sm font-bold">{gameState.level1Points}</span></div>
          </div>
        </div>
        <GameplaySkeleton />
      </div>
    )

    if (error) return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <Button variant="ghost" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground mb-4"><FiArrowLeft className="mr-1 w-4 h-4" /> Back to Hub</Button>
        <Card className="border-destructive/50 shadow-lg">
          <CardContent className="p-6 text-center space-y-3">
            <FiXCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={startLevel1} variant="outline">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )

    if (showLevel1Summary) {
      const summaryData = feedback ?? data
      return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <Card className="border-purple-500/30 shadow-xl bg-gradient-to-b from-card to-purple-50/30">
            <CardContent className="p-8 text-center space-y-6">
              <HiOutlineTrophy className="w-16 h-16 text-yellow-500 mx-auto" />
              <h2 className="font-serif font-bold text-2xl">Level 1 Complete!</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-purple-600">{gameState.level1Points}</p>
                  <p className="text-xs text-muted-foreground">Points Earned</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-green-600">{gameState.level1Accuracy}%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-orange-600">{gameState.bestStreak}</p>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                </div>
              </div>
              {summaryData?.level_summary && <div className="text-left">{renderMarkdown(summaryData.level_summary)}</div>}
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setCurrentScreen('dashboard')} variant="outline">Back to Hub</Button>
                <Button onClick={() => { setCurrentScreen('level2'); startLevel2() }} className="bg-gradient-to-r from-pink-500 to-purple-600">Start Level 2 <FiChevronRight className="ml-1 w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (!data) return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <Button variant="ghost" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground"><FiArrowLeft className="mr-1 w-4 h-4" /> Back to Hub</Button>
        <Card className="shadow-lg"><CardContent className="p-8 text-center"><p className="text-muted-foreground">Ready to test your knowledge?</p><Button onClick={startLevel1} className="mt-4 bg-gradient-to-r from-purple-600 to-purple-700"><FiPlay className="mr-2 w-4 h-4" /> Start Level 1</Button></CardContent></Card>
      </div>
    )

    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground"><FiArrowLeft className="mr-1 w-4 h-4" /> Hub</Button>
          <span className="text-sm font-semibold">Quest {questNum}/{totalQuests}</span>
          <div className="flex items-center gap-3">
            {(data?.streak_count ?? gameState.streak) > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                <FiZap className="w-3 h-3" /> {data?.streak_count ?? gameState.streak}
              </div>
            )}
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold">{data?.total_points ?? gameState.level1Points}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={(questNum / totalQuests) * 100} className="h-2" />

        {/* Scenario Card */}
        <Card className="border-l-4 border-l-purple-500 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-2">
              <HiOutlineLightBulb className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">{renderMarkdown(data?.scenario ?? '')}</div>
            </div>

            <Separator />

            <p className="font-semibold text-base">{data?.question ?? ''}</p>

            {/* Options */}
            <div className="space-y-3 relative">
              <FloatingPoints points={lastPointsEarned} visible={showPointsAnim} />
              {data?.options && Object.entries(data.options).map(([key, value]) => {
                if (!value) return null
                const isSelected = selectedAnswer === key
                const hasFeedback = !!feedback
                const isCorrect = feedback?.correct_answer === key
                const isWrong = isSelected && hasFeedback && !isCorrect

                let btnClass = 'w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 '
                if (hasFeedback && isCorrect) {
                  btnClass += 'border-green-500 bg-green-50 text-green-800 shadow-md shadow-green-500/10'
                } else if (isWrong) {
                  btnClass += 'border-red-500 bg-red-50 text-red-800'
                } else if (isSelected) {
                  btnClass += 'border-purple-500 bg-purple-50 shadow-md'
                } else if (answered) {
                  btnClass += 'border-border bg-card opacity-60'
                } else {
                  btnClass += 'border-border bg-card hover:border-purple-400 hover:shadow-md hover:scale-[1.01] cursor-pointer'
                }

                return (
                  <button key={key} className={btnClass} onClick={() => !sampleData && answerLevel1(key)} disabled={answered || loading}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${hasFeedback && isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-purple-500 text-white' : 'bg-secondary text-foreground'}`}>{key}</span>
                    <span className="text-sm flex-1">{value}</span>
                    {hasFeedback && isCorrect && <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                    {isWrong && <FiXCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>

            {loading && answered && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Checking your answer...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Card */}
        {feedback && (
          <Card className={`shadow-lg border-l-4 ${feedback?.correct_answer === selectedAnswer ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                {feedback?.correct_answer === selectedAnswer ? <FiCheckCircle className="w-5 h-5 text-green-600" /> : <FiXCircle className="w-5 h-5 text-red-600" />}
                <span className="font-semibold">{feedback?.correct_answer === selectedAnswer ? 'Correct!' : 'Not Quite'}</span>
                {(feedback?.points_earned ?? 0) > 0 && <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">+{feedback?.points_earned} pts</Badge>}
                {(feedback?.streak_bonus ?? 0) > 0 && <Badge className="bg-orange-100 text-orange-700 border-orange-200">+{feedback?.streak_bonus} streak bonus</Badge>}
              </div>
              {feedback?.feedback && <div className="text-sm">{renderMarkdown(feedback.feedback)}</div>}
              {feedback?.explanation && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><FiInfo className="w-3 h-3" /> Explanation</p>
                  <div className="text-sm">{renderMarkdown(feedback.explanation)}</div>
                </div>
              )}
              {!feedback?.is_complete && (
                <Button onClick={nextLevel1Quest} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-purple-700">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : null}
                  Next Quest <FiChevronRight className="ml-1 w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ===== RENDER: LEVEL 2 =====
  function Level2Screen() {
    const data = sampleData ? SAMPLE_LEVEL2 : level2Data
    const feedback = sampleData ? null : level2FeedbackData
    const loading = sampleData ? false : level2Loading
    const error = sampleData ? null : level2Error
    const answered = sampleData ? false : level2Answered
    const stepNum = data?.step_number ?? 0
    const totalSteps = data?.total_steps ?? 8

    if (loading && !data) return (
      <div>
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground"><FiArrowLeft className="mr-1 w-4 h-4" /> Hub</Button>
            <span className="text-sm text-muted-foreground">Loading...</span>
            <div className="flex items-center gap-2"><FiStar className="w-4 h-4 text-yellow-500" /><span className="text-sm font-bold">{gameState.level2Points}</span></div>
          </div>
        </div>
        <GameplaySkeleton />
      </div>
    )

    if (error) return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <Button variant="ghost" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground mb-4"><FiArrowLeft className="mr-1 w-4 h-4" /> Back to Hub</Button>
        <Card className="border-destructive/50 shadow-lg">
          <CardContent className="p-6 text-center space-y-3">
            <FiXCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={startLevel2} variant="outline">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )

    if (showLevel2Summary) {
      const summaryData = feedback ?? data
      return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <Card className="border-pink-500/30 shadow-xl bg-gradient-to-b from-card to-pink-50/30">
            <CardContent className="p-8 text-center space-y-6">
              <HiOutlineRocketLaunch className="w-16 h-16 text-pink-500 mx-auto" />
              <h2 className="font-serif font-bold text-2xl">Business Quest Complete!</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-purple-600">{gameState.level2Points}</p>
                  <p className="text-xs text-muted-foreground">Points Earned</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-2xl font-bold text-pink-600">{gameState.level2StepsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Steps Completed</p>
                </div>
              </div>
              {summaryData?.adventure_summary && <div className="text-left">{renderMarkdown(summaryData.adventure_summary)}</div>}
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setCurrentScreen('dashboard')} variant="outline">Back to Hub</Button>
                <Button onClick={() => setCurrentScreen('profile')} className="bg-gradient-to-r from-purple-600 to-pink-500">View Profile <FiChevronRight className="ml-1 w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (!data) return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <Button variant="ghost" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground"><FiArrowLeft className="mr-1 w-4 h-4" /> Back to Hub</Button>
        <Card className="shadow-lg"><CardContent className="p-8 text-center"><p className="text-muted-foreground">Ready to start your business adventure?</p><Button onClick={startLevel2} className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600"><FiPlay className="mr-2 w-4 h-4" /> Start Level 2</Button></CardContent></Card>
      </div>
    )

    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground"><FiArrowLeft className="mr-1 w-4 h-4" /> Hub</Button>
          <span className="text-sm font-semibold truncate max-w-[200px]">{data?.step_title ?? `Step ${stepNum}`}</span>
          <div className="flex items-center gap-1">
            <FiStar className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold">{data?.total_points ?? gameState.level2Points}</span>
          </div>
        </div>

        {/* Adventure Map */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepIndex = i + 1
            const isCompleted = stepIndex < stepNum
            const isCurrent = stepIndex === stepNum
            return (
              <React.Fragment key={i}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 animate-pulse' : 'bg-secondary text-muted-foreground'}`}>
                  {isCompleted ? <FiCheckCircle className="w-4 h-4" /> : stepIndex}
                </div>
                {i < totalSteps - 1 && <div className={`h-0.5 flex-1 min-w-[16px] ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />}
              </React.Fragment>
            )
          })}
        </div>

        {/* Narrative Card */}
        <Card className="border-l-4 border-l-pink-500 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg">{data?.step_title ?? ''}</h3>
            <div className="text-sm leading-relaxed">{renderMarkdown(data?.narrative ?? '')}</div>

            {/* Decision Cards */}
            {!answered && Array.isArray(data?.choices) && (
              <div className="space-y-3 relative">
                <FloatingPoints points={lastPointsEarned} visible={showPointsAnim} />
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Choose your path:</p>
                {data.choices.map((choice) => {
                  if (!choice?.id) return null
                  const isSelected = selectedChoice === choice.id
                  return (
                    <button key={choice.id} onClick={() => !sampleData && chooseLevel2(choice.id ?? '')} disabled={answered || loading} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-start gap-4 ${isSelected ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-border bg-card hover:border-pink-400 hover:shadow-md hover:scale-[1.01] cursor-pointer'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-pink-500 text-white' : 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600'}`}>
                        {choice.icon === 'building' ? <BsBuilding className="w-5 h-5" /> : choice.icon === 'corporate' ? <HiOutlineBuildingOffice className="w-5 h-5" /> : choice.icon === 'person' ? <FiUser className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{choice.title ?? ''}</p>
                        <p className="text-xs text-muted-foreground mt-1">{choice.description ?? ''}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {loading && answered && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Processing your choice...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Card */}
        {feedback && (
          <Card className="shadow-lg border-l-4 border-l-indigo-500 bg-indigo-50/20">
            <CardContent className="p-6 space-y-4">
              {feedback?.chosen_path && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">{feedback.chosen_path}</Badge>
                  {(feedback?.points_earned ?? 0) > 0 && <Badge className="bg-green-100 text-green-700 border-green-200">+{feedback?.points_earned} pts</Badge>}
                </div>
              )}
              {feedback?.feedback && <div className="text-sm">{renderMarkdown(feedback.feedback)}</div>}
              {feedback?.explanation && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><FiInfo className="w-3 h-3" /> Why This Matters</p>
                  <div className="text-sm">{renderMarkdown(feedback.explanation)}</div>
                </div>
              )}
              {feedback?.did_you_know && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1"><HiOutlineLightBulb className="w-3 h-3" /> Did You Know?</p>
                  <div className="text-sm text-yellow-800">{renderMarkdown(feedback.did_you_know)}</div>
                </div>
              )}
              {!feedback?.is_complete && (
                <Button onClick={nextLevel2Step} disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : null}
                  Continue Adventure <FiChevronRight className="ml-1 w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ===== RENDER: PROFILE =====
  function ProfileScreen() {
    const data = sampleData ? SAMPLE_PROFILE : profileData
    const loading = sampleData ? false : profileLoading
    const error = sampleData ? null : profileError
    const hasProgress = gameState.level1QuestsCompleted > 0 || gameState.level2StepsCompleted > 0

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setCurrentScreen('dashboard')} className="text-muted-foreground"><FiArrowLeft className="mr-1 w-4 h-4" /> Hub</Button>
            <h2 className="font-serif font-bold text-2xl">Your Profile</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Stats Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-md border-border">
                <CardContent className="p-5 text-center">
                  <FiStar className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"><AnimatedPoints target={totalPoints} /></p>
                  <p className="text-xs text-muted-foreground mt-1">Total Points</p>
                </CardContent>
              </Card>
              <Card className="shadow-md border-border">
                <CardContent className="p-5 text-center">
                  <FiCheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{(gameState.level1Complete ? 1 : 0) + (gameState.level2Complete ? 1 : 0)}/2</p>
                  <p className="text-xs text-muted-foreground mt-1">Levels Completed</p>
                </CardContent>
              </Card>
              <Card className="shadow-md border-border">
                <CardContent className="p-5 text-center">
                  <FiBarChart2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{gameState.level1Accuracy}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Quiz Accuracy</p>
                </CardContent>
              </Card>
              <Card className="shadow-md border-border">
                <CardContent className="p-5 text-center">
                  <FiLayers className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{gameState.level2Choices.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Paths Explored</p>
                </CardContent>
              </Card>
            </div>

            {/* Generate Report CTA */}
            {!hasProgress && !sampleData ? (
              <Card className="shadow-lg border-border">
                <CardContent className="p-6 text-center space-y-3">
                  <FiLock className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Complete a level first to unlock your personalized readiness report!</p>
                  <Button onClick={() => setCurrentScreen('dashboard')} variant="outline">Go to Hub</Button>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={() => !sampleData && generateProfile()} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg shadow-purple-500/25 py-6 text-base">
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Generating Report...</>
                ) : (
                  <><HiOutlineDocumentText className="mr-2 w-5 h-5" /> Generate Readiness Report</>
                )}
              </Button>
            )}

            {error && (
              <Card className="border-destructive/50 shadow-md">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button onClick={generateProfile} variant="outline" size="sm" className="mt-2">Retry</Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Readiness Report */}
          <div className="space-y-6">
            {data ? (
              <Card className="shadow-xl border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><HiOutlineClipboardDocumentList className="w-5 h-5 text-purple-500" /> Business Readiness Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Score Overview */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-600/10 to-pink-500/10">
                    <ProgressRing progress={data?.completion_percentage ?? 0} size={70} strokeWidth={5} />
                    <div>
                      <p className="font-semibold text-lg">{data?.rank ?? 'Unranked'}</p>
                      <p className="text-xs text-muted-foreground">Score: {data?.overall_score ?? 0}/100</p>
                    </div>
                  </div>

                  {/* Personalized Message */}
                  {data?.personalized_message && (
                    <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/50">
                      <div className="text-sm">{renderMarkdown(data.personalized_message)}</div>
                    </div>
                  )}

                  {/* Level Analyses */}
                  {data?.level1_analysis && (
                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><FiTarget className="w-3 h-3" /> Level 1 Analysis</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>Score: <strong>{data.level1_analysis.score ?? '-'}</strong></span>
                        <span>Accuracy: <strong>{data.level1_analysis.accuracy ?? '-'}%</strong></span>
                        <span>Best: <strong>{data.level1_analysis.best_topic ?? '-'}</strong></span>
                        <span>Weakest: <strong>{data.level1_analysis.weakest_topic ?? '-'}</strong></span>
                      </div>
                    </div>
                  )}

                  {data?.level2_analysis && (
                    <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><FiMap className="w-3 h-3" /> Level 2 Analysis</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>Path: <strong>{data.level2_analysis.path_taken ?? '-'}</strong></span>
                        <span>Type: <strong>{data.level2_analysis.business_type ?? '-'}</strong></span>
                        <span>Completion: <strong>{data.level2_analysis.completion ?? '-'}%</strong></span>
                        <span>Optimal: <strong>{data.level2_analysis.optimal_choices ?? '-'}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {Array.isArray(data?.strengths) && data.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><FiCheckCircle className="w-3 h-3 text-green-500" /> Strengths</p>
                      <div className="flex flex-wrap gap-2">
                        {data.strengths.map((s, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 border-green-200">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Knowledge Gaps */}
                  {Array.isArray(data?.knowledge_gaps) && data.knowledge_gaps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><FiInfo className="w-3 h-3 text-orange-500" /> Knowledge Gaps</p>
                      <div className="flex flex-wrap gap-2">
                        {data.knowledge_gaps.map((g, i) => (
                          <Badge key={i} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Incentives */}
                  {Array.isArray(data?.recommended_incentives) && data.recommended_incentives.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><FiGift className="w-3 h-3 text-purple-500" /> Recommended Incentives</p>
                      <div className="space-y-2">
                        {data.recommended_incentives.map((inc, i) => (
                          <div key={i} className="p-3 rounded-lg border border-border bg-card">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{inc?.name ?? ''}</span>
                              {inc?.priority && <Badge variant="outline" className={`text-xs ${inc.priority === 'High' ? 'border-red-300 text-red-600' : inc.priority === 'Medium' ? 'border-yellow-300 text-yellow-700' : 'border-green-300 text-green-600'}`}>{inc.priority}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{inc?.description ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {Array.isArray(data?.next_steps) && data.next_steps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><FiTrendingUp className="w-3 h-3 text-blue-500" /> Next Steps</p>
                      <div className="space-y-2">
                        {data.next_steps.map((ns, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{ns?.priority ?? i + 1}</span>
                            <div>
                              <p className="font-medium text-sm">{ns?.step ?? ''}</p>
                              <p className="text-xs text-muted-foreground">{ns?.reason ?? ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements Summary */}
                  {data?.achievements_summary && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><FiAward className="w-3 h-3" /> Achievements: {data.achievements_summary.earned ?? 0}/{data.achievements_summary.total ?? 15}</p>
                      {Array.isArray(data.achievements_summary.recent) && data.achievements_summary.recent.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {data.achievements_summary.recent.map((r, i) => <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>)}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : loading ? (
              <Card className="shadow-lg border-border">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-border">
                <CardContent className="p-8 text-center">
                  <HiOutlineSparkles className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Click "Generate Readiness Report" to get your personalized business readiness analysis.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Achievement Grid */}
        <div>
          <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2"><FiAward className="w-5 h-5 text-purple-500" /> All Achievements ({gameState.achievements.length}/{ALL_ACHIEVEMENTS.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {ALL_ACHIEVEMENTS.map(ach => {
              const earned = gameState.achievements.includes(ach.id)
              const IconComp = ach.icon
              return (
                <div key={ach.id} className={`p-4 rounded-xl text-center transition-all duration-300 ${earned ? 'bg-gradient-to-b from-purple-50 to-pink-50 border-2 border-purple-400 shadow-md shadow-purple-500/10' : 'bg-secondary/30 border-2 border-transparent opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${earned ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {earned ? <IconComp className="w-5 h-5" /> : <FiLock className="w-4 h-4" />}
                  </div>
                  <p className={`text-xs font-semibold ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <NavBar />
        <AchievementPopup achievement={achievementPopup} onClose={() => setAchievementPopup(null)} />

        <ScrollArea className="h-[calc(100vh-64px)]">
          {currentScreen === 'dashboard' && <DashboardScreen />}
          {currentScreen === 'level1' && <Level1Screen />}
          {currentScreen === 'level2' && <Level2Screen />}
          {currentScreen === 'profile' && <ProfileScreen />}
        </ScrollArea>
      </div>
    </ErrorBoundary>
  )
}
