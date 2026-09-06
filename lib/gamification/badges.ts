type Badge = {
  name: string;
  threshold: number;
};

type UserStats = {
  totalSolves?: number;
  level?: number;
  streak?: number;
};

export function shouldGrantBadge(badge: Badge, stats: UserStats): boolean {
  switch (badge.name) {
    case "First Blood":
    case "Century Club":
      return (stats.totalSolves ?? 0) >= badge.threshold;
    case "Dedication":
    case "Unstoppable":
    case "Streak Masters":
      return (stats.streak ?? 0) >= badge.threshold;
    case "Level 10":
    case "Level 25":
    case "Rising Star":
    case "Powerhouse":
      return (stats.level ?? 0) >= badge.threshold;
    case "Full Squad":
      return (stats.totalSolves ?? 0) >= badge.threshold;
    case "Centurions":
      return (stats.totalSolves ?? 0) >= badge.threshold;
    default:
      return false;
  }
}
