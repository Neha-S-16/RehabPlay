export type AffectedHand = 'left' | 'right' | 'both';
export type StrokeSeverity = 'mild' | 'moderate' | 'severe';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StrokeDetails {
  affectedHand: AffectedHand;
  severity: StrokeSeverity;
  dateOfStroke: string;
}

export interface TherapyPreference {
  dailyGoalMinutes: number;
  difficulty: DifficultyLevel;
}

export interface UserProfile {
  fullName: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  strokeDetails: StrokeDetails;
  therapyPreference: TherapyPreference;
}

export interface GameSession {
  id: string;
  gameId: 'fruit_catcher' | 'balloon_pop' | 'traffic_signal' | 'finger_match';
  gameName: string;
  date: string;
  score: number;
  accuracy: number; // percentage
  duration: number; // in seconds
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
