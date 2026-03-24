// =====================
// Data Types
// =====================

export interface Word {
  id: string
  word: string
  phonetic?: string
  type?: string
  meaning?: string
  frequency?: number
  example_sentences?: {
    exam?: string[]
    spoken?: string[]
  }
  example_translations?: string[]
  usage_notes?: string
  common_mistakes?: string
  memory_methods?: string
  mastery: 'unmastered' | 'mastering' | 'mastered'
  last_review_time?: string
}

export interface WordGrade {
  word: string
  grade: string
  semester: string
}

// =====================
// Question Types
// =====================

export interface Question {
  id: string
  year: number
  type: string
  difficulty: string
  question: string
  content: string
  options: string[]
  answer: string
  analysis: string
  tags: string[]
  source: string
  reading_article_id?: string
  correctIndex?: number
}

export interface QuestionFilter {
  year?: number
  type?: string
  difficulty?: string
  tag?: string
}

// Listening Questions
export interface ListeningQuestion {
  id: string
  type: 'short_dialogue' | 'long_dialogue' | 'monologue' | 'dictation'
  topic: string
  audio_text: string
  question: string
  options: string[]
  correct_answer: number
  analysis: string
  difficulty: number
  year: number
  tags: string[]
}

// =====================
// Grammar Types
// =====================

export interface GrammarTopic {
  id: string
  name: string
  icon: string
  color: string
  lessons: GrammarLesson[]
}

export interface GrammarLesson {
  id: string
  title: string
  content: string
  examples: GrammarExample[]
  exercises: GrammarExercise[]
}

export interface GrammarExample {
  sentence: string
  translation: string
  analysis: string
}

export interface GrammarExercise {
  question: string
  options: { [key: string]: string }
  answer: string
  explanation: string
}

// =====================
// User Types
// =====================

export interface UserProfile {
  id: number
  name: string
  avatar: string
  level: number
  exp: number
  
  grade?: string
  school?: string
  target_school?: string
  study_goal?: string
  
  total_study_time: number
  total_questions: number
  correct_rate: number
  streak_days: number
  last_study_date: string
  
  created_at: string
  tags: string[]
  word_tags: { [word: string]: number }
}

// =====================
// Wrong Question Types
// =====================

export interface WrongQuestion {
  id: string
  question_id: string
  question: string
  options: string[]
  your_answer: string
  correct_answer: string
  explanation: string
  type: string
  tags: string[]
  date: string
  reviewed: boolean
  mastery: 'unmastered' | 'mastering' | 'mastered'
  review_count: number
  last_review_time: string
  next_review_date: string
}

// =====================
// Weak Point Types
// =====================

export interface WeakPoint {
  id: string
  tag: string
  error_count: number
  total_count: number
  correct_rate: number
  priority: number
  updated_at: string
}

// =====================
// Learning Record Types
// =====================

export interface LearningRecord {
  id: string
  date: string
  task_type: string
  total_count: number
  correct_count: number
  study_time: number
  exp_gained: number
}

// =====================
// Daily Task Types
// =====================

export interface DailyTask {
  id: string
  date: string
  task_type: 'do_single' | 'do_reading' | 'do_cloze' | 'review_wrong' | 'learn_words' | 'streak'
  target: number
  progress: number
  completed: boolean
  exp_reward: number
}

// =====================
// Diagnosis Types
// =====================

export interface DiagnosisRecord {
  id: string
  date: string
  total_score: number
  listening_score: number
  single_score: number
  cloze_score: number
  reading_score: number
  grammar_score: number
  weak_tags: string[]
  strong_tags: string[]
  suggestions: string[]
  completed: boolean
}

// =====================
export interface QuestionExplanation {
  correctAnswer: string
  explanation: string
  wrongOptionAnalysis: { option: string; whyWrong: string }[]
  knowledgePoint: string
  relatedGrammar?: string
  memoryTip?: string
  similarQuestion?: string
}

export interface WordDetails {
  word: string
  phonetic: string
  definition: string
  partOfSpeech: string
  examples: { sentence: string; translation: string }[]
  memoryTip?: string
  commonMistakes?: string
  collocations?: string[]
}

export interface GrammarExplanation {
  summary: string
  keyRules: string[]
  commonMistakes: string[]
  memoryTips: string[]
  aiExamples: { sentence: string; translation: string; analysis: string }[]
}

// AI Scan Types
// =====================

export interface QuestionAnalysis {
  type: 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'writing' | 'cloze' | 'unknown'
  difficulty: 'easy' | 'medium' | 'hard'
  knowledgePoints: string[]
  analysis: string
  suggestion: string
  relatedFeatures: string[]
}

export interface ScannedQuestion {
  id: string
  questionText: string       // AI extracted question text from image
  imageBase64?: string       // Optional: small base64 thumbnail for display
  analysis: QuestionAnalysis
  source: 'wrong_questions' | 'upload'
  scanDate: string
}

export interface ScannedWord {
  id: string
  word: string
  phonetic?: string
  definition?: string
  example?: string
  mastered: boolean
  scannedAt: string
  source: 'ai_scan' | 'manual'
}

// =====================
// AI Types
// =====================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIServiceConfig {
  provider: 'deepseek' | 'qwen'
  apiKey: string
  baseURL: string
}

// =====================
// Practice Types
// =====================

export interface PracticeResult {
  questionId: string
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  expGained: number
}

export interface PracticeStats {
  total: number
  correct: number
  accuracy: number
}

// =====================
// Constants
// =====================

export const DIFFICULTY_COLORS: { [key: string]: string } = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#F44336'
}

export const QUESTION_TYPES: { [key: string]: string } = {
  single: '单选题',
  reading: '阅读理解',
  cloze: '完形填空',
  dialogue: '情景对话'
}

export const GRADES = [
  '三年级',
  '四年级',
  '五年级',
  '六年级',
  '七年级',
  '八年级',
  '九年级'
]

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] // days

export const EXP_PER_QUESTION = 5
export const EXP_STREAK_BONUS = 3
export const EXP_WRONG_ANSWER = 2
