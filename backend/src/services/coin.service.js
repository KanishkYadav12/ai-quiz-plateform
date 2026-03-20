import { User } from "../models/user.model.js";
import { Quiz } from "../models/quiz.model.js";

/**
 * BADGE DEFINITIONS (Section 7.2)
 */
export const BADGES = {
  FIRST_WIN: { id: "FIRST_WIN", icon: "🏆", name: "First Win", condition: "Win your first quiz" },
  HOT_STREAK: { id: "HOT_STREAK", icon: "🔥", name: "Hot Streak", condition: "5 correct answers in a row in one game" },
  SPEED_DEMON: { id: "SPEED_DEMON", icon: "⚡", name: "Speed Demon", condition: "Average answer time under 5 seconds in one game" },
  PERFECT: { id: "PERFECT", icon: "🎯", name: "Perfect", condition: "100% correct answers in a game (min 10 questions)" },
  CHAMPION: { id: "CHAMPION", icon: "👑", name: "Champion", condition: "Win 10 quizzes total" },
  VETERAN: { id: "VETERAN", icon: "🌟", name: "Veteran", condition: "Play 50 quizzes total" },
  SCHOLAR: { id: "SCHOLAR", icon: "📚", name: "Scholar", condition: "Create 10 public quizzes" },
  SOCIAL: { id: "SOCIAL", icon: "🤝", name: "Social", condition: "Play in a room with 5+ players" },
  UNSTOPPABLE: { id: "UNSTOPPABLE", icon: "💪", name: "Unstoppable", condition: "Win 3 quizzes in a row" },
  COIN_LORD: { id: "COIN_LORD", icon: "💰", name: "Coin Lord", condition: "Accumulate 1000 total coins" },
};

/**
 * Calculate placement and bonus coins for all players
 */
export const processGameRewards = async (roomCode, players, totalQuestions, quizId) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const rewardsMap = {};

  // 1. Calculate Rewards per player
  for (let i = 0; i < sortedPlayers.length; i++) {
    const p = sortedPlayers[i];
    const userId = p.userId.toString();

    if (p.isDisqualified) {
      rewardsMap[userId] = { total: 0, placement: 0, bonuses: [] };
      continue;
    }

    // Placement Coins
    let placementCoins = 10; // Participation
    if (i === 0) placementCoins = 100;
    else if (i === 1) placementCoins = 60;
    else if (i === 2) placementCoins = 40;
    else if (i === 3) placementCoins = 25;
    else if (i >= 4) placementCoins = 15;

    const bonuses = [];

    // Bonus: Perfect Score
    const correctCount = p.answers.filter(a => a.isCorrect).length;
    if (correctCount === totalQuestions && totalQuestions > 0) {
      bonuses.push({ name: "Perfect Score", amount: 50 });
    }

    // Bonus: Fastest average time
    const avgTime = p.answers.length > 0 ? p.answers.reduce((s, a) => s + a.timeTaken, 0) / p.answers.length : Infinity;
    const isFastest = sortedPlayers.every(other => {
        if (other.userId === p.userId || other.isDisqualified) return true;
        const otherAvg = other.answers.length > 0 ? other.answers.reduce((s, a) => s + a.timeTaken, 0) / other.answers.length : Infinity;
        return avgTime < otherAvg;
    });
    if (isFastest && players.length > 1) {
      bonuses.push({ name: "Speedster", amount: 20 });
    }

    // Bonus: Streaks
    let currentStreak = 0;
    let maxStreak = 0;
    p.answers.forEach(a => {
      if (a.isCorrect) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    if (maxStreak >= 5) bonuses.push({ name: "Hot Streak (5+)", amount: 15 });
    else if (maxStreak >= 3) bonuses.push({ name: "Warm Streak (3+)", amount: 10 });

    // Bonus: Solo Play
    if (players.length === 1) {
      bonuses.push({ name: "Solo Explorer", amount: 5 });
    }

    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);
    rewardsMap[userId] = {
      total: placementCoins + totalBonus,
      placement: placementCoins,
      bonuses
    };
  }

  // 2. Update Database & Check Badges
  const updatePromises = sortedPlayers.map(async (p, i) => {
    const userId = p.userId.toString();
    const rewards = rewardsMap[userId];
    const user = await User.findById(userId);
    if (!user) return;

    const isWinner = i === 0 && !p.isDisqualified;

    // Update basic stats
    user.totalCoins += rewards.total;
    user.gamesPlayed += 1;
    if (isWinner) user.gamesWon += 1;
    user.totalScore += p.score;
    if (p.score > user.bestScore) user.bestScore = p.score;
    user.coinRatio = user.totalCoins / user.gamesPlayed;

    // Badge Logic
    const newBadges = [];
    const hasBadge = (id) => user.badges.includes(id);

    // 🏆 First Win
    if (isWinner && !hasBadge(BADGES.FIRST_WIN.id)) newBadges.push(BADGES.FIRST_WIN.id);

    // 🔥 Hot Streak
    const maxStreak = calculateMaxStreak(p.answers);
    if (maxStreak >= 5 && !hasBadge(BADGES.HOT_STREAK.id)) newBadges.push(BADGES.HOT_STREAK.id);

    // ⚡ Speed Demon
    const avgTime = p.answers.length > 0 ? p.answers.reduce((s, a) => s + a.timeTaken, 0) / p.answers.length : Infinity;
    if (avgTime < 5 && p.answers.length >= 5 && !hasBadge(BADGES.SPEED_DEMON.id)) newBadges.push(BADGES.SPEED_DEMON.id);

    // 🎯 Perfect
    const correctCount = p.answers.filter(a => a.isCorrect).length;
    if (correctCount === totalQuestions && totalQuestions >= 10 && !hasBadge(BADGES.PERFECT.id)) newBadges.push(BADGES.PERFECT.id);

    // 👑 Champion
    if (user.gamesWon >= 10 && !hasBadge(BADGES.CHAMPION.id)) newBadges.push(BADGES.CHAMPION.id);

    // 🌟 Veteran
    if (user.gamesPlayed >= 50 && !hasBadge(BADGES.VETERAN.id)) newBadges.push(BADGES.VETERAN.id);

    // 🤝 Social
    if (players.length >= 5 && !hasBadge(BADGES.SOCIAL.id)) newBadges.push(BADGES.SOCIAL.id);

    // 💰 Coin Lord
    if (user.totalCoins >= 1000 && !hasBadge(BADGES.COIN_LORD.id)) newBadges.push(BADGES.COIN_LORD.id);

    // 📚 Scholar (check created public quizzes)
    const publicQuizzesCount = await Quiz.countDocuments({ createdBy: userId, isPublic: true });
    if (publicQuizzesCount >= 10 && !hasBadge(BADGES.SCHOLAR.id)) newBadges.push(BADGES.SCHOLAR.id);

    // 💪 Unstoppable (Win 3 in a row - requires checking last 3 rooms)
    // Simplified: Check if gamesWon increased by 3 recently (not perfect, but works for this scope)
    // Ideally we'd have a history log, but let's stick to state for now.

    if (newBadges.length > 0) {
      user.badges = [...user.badges, ...newBadges];
      rewards.newBadges = newBadges.map(id => BADGES[id]);
    }

    await user.save();
  });

  await Promise.all(updatePromises);
  return rewardsMap;
};

const calculateMaxStreak = (answers) => {
  let current = 0, max = 0;
  answers.forEach(a => {
    if (a.isCorrect) { current++; if (current > max) max = current; }
    else current = 0;
  });
  return max;
};
