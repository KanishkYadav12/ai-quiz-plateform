/**
 * Calculates points earned for an answer.
 *
 * Correct answer  → 100 base + time bonus
 * Wrong answer    → 0
 *
 * Time bonus (based on seconds taken):
 *   0–5s  → +50   (total 150)
 *   6–10s → +30   (total 130)
 *   11–20s → +10  (total 110)
 *   >20s  → +0    (total 100)
 */
export const calculateScore = (timeTaken, isCorrect) => {
  if (!isCorrect) return 0;

  let bonus = 0;
  if (timeTaken <= 5) bonus = 50;
  else if (timeTaken <= 10) bonus = 30;
  else if (timeTaken <= 20) bonus = 10;

  return 100 + bonus;
};

/**
 * Sorts a leaderboard array.
 * Primary:   score descending
 * Tiebreaker: average answer time ascending (faster = higher)
 */
export const sortLeaderboard = (players) =>
  [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.averageTime ?? Infinity) - (b.averageTime ?? Infinity);
  });
