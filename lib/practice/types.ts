export type PracticeRoom = { id: string; title: string; description: string; created_at: string }
export type PracticeMember = { user_id: string; invited_at: string; last_reminded_at: string | null; display_name: string }
export type PracticeChallenge = {
  id: string; room_id: string; title: string; description: string; category: string; difficulty: string;
  points: number; hint: string | null; explanation: string | null; upload_id: string | null;
  learn_topic_slug: string | null; learn_lesson_slug: string | null; is_active: boolean; created_at: string;
}
export type PracticeAttempt = { id: string; challenge_id: string; user_id: string; is_correct: boolean; created_at: string }
export type PracticeFeedback = { challenge_id: string; user_id: string; message: string; updated_at: string }
export type PracticePublication = { practice_challenge_id: string; ctf_challenge_id: string; published_at: string }
export type PracticeRoomData = {
  room: PracticeRoom; isAdmin: boolean; userId: string; members: PracticeMember[]; challenges: PracticeChallenge[];
  attempts: PracticeAttempt[]; feedback: PracticeFeedback[]; publications: PracticePublication[];
}
export type PracticeChallengeInput = {
  title: string; description: string; category: string; difficulty: string; points: number; flag?: string;
  hint?: string; explanation?: string; upload_id?: string | null; learn_topic_slug?: string; learn_lesson_slug?: string; is_active: boolean;
}
export type PracticeResult = { success: true; id?: string; correct?: boolean; alreadySolved?: boolean } | { error: string }
