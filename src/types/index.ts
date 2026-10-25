export type DifficultyLevel = 'Mudah' | 'Sedang' | 'Sulit';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export type QuizMode = 'challenge' | 'practice' | 'zen' | 'mistakes';

export interface Category {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultDuration: number; // in seconds
  defaultQuestionsPerSession: number; // max 25
  defaultDifficulty: DifficultyLevel;
  pointsPerQuestion: number;
  order: number;
  isArchived: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  userId: string;
  categoryId: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  duration: number; // in seconds
  difficulty: DifficultyLevel;
  points: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizResultItem {
  questionId: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  explanation: string;
}

export interface QuizHistory {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  score: number;
  maxScore: number;
  accuracy: number; // 0 - 100%
  totalDurationSeconds: number;
  averageTimePerQuestion: number;
  mode: QuizMode;
  completedAt: string;
  items: QuizResultItem[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  streak: number;
  lastActiveDate: string;
  totalPlayed: number;
  totalCorrect: number;
  totalIncorrect: number;
  bestScore: number;
  createdAt: string;
  updatedAt: string;
}

export type ThemePreset = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'black' | 'custom';

export type ColorMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  userId: string;
  themePreset: ThemePreset;
  customColor: string;
  customAccent: string;
  colorMode: ColorMode;
  soundEnabled: boolean;
  soundVolume: number; // 0 - 1
  bgMusicEnabled: boolean;
  animationEnabled: boolean;
  simpleAnimation: boolean;
  instantFeedback: boolean;
  autoNextDelay: number; // seconds, e.g. 1.5
  verticalTimer: boolean;
  confirmExit: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  dailyGoal: number; // target questions per day
  updatedAt: string;
}

export interface AIReviewResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  recommendedDifficulty: string;
  improvedExplanation: string;
}
