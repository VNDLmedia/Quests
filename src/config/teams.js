// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Team Categories Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const TEAMS = {
  blue: {
    id: 'blue',
    name: 'Blue Team',
    color: '#3B82F6',
    lightColor: '#60A5FA',
    darkColor: '#2563EB',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    icon: 'water',
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow Team',
    color: '#FBBF24',
    lightColor: '#FCD34D',
    darkColor: '#F59E0B',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    icon: 'sunny',
  },
  green: {
    id: 'green',
    name: 'Green Team',
    color: '#10B981',
    lightColor: '#34D399',
    darkColor: '#059669',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: 'leaf',
  },
  purple: {
    id: 'purple',
    name: 'Purple Team',
    color: '#A855F7',
    lightColor: '#C084FC',
    darkColor: '#9333EA',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    icon: 'sparkles',
  },
};

export const TEAM_LIST = Object.values(TEAMS);

export const getTeamById = (teamId) => {
  return TEAMS[teamId] || TEAMS.blue;
};

export const getTeamColor = (teamId) => {
  return TEAMS[teamId]?.color || TEAMS.blue.color;
};

export default TEAMS;
