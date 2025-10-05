import axios from 'axios';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

export const mlbApi = axios.create({
  baseURL: MLB_API_BASE,
});

// Add request interceptor for logging
mlbApi.interceptors.request.use(
  (config) => {
    console.log('🌐 MLB API Request:', {
      url: config.url,
      params: config.params,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('❌ MLB API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
mlbApi.interceptors.response.use(
  (response) => {
    console.log('✅ MLB API Response:', {
      url: response.config.url,
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ MLB API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export interface TeamRecord {
  team: {
    id: number;
    name: string;
    link: string;
  };
  wins: number;
  losses: number;
  winningPercentage: string;
  gamesBack: string;
  divisionRank: string;
  leagueRank: string;
  wildCardRank?: string;
  runDifferential: number;
  runsScored: number;
  runsAllowed: number;
  clinchIndicator?: string;
  eliminationNumber?: string;
}

export interface Division {
  standingsType: string;
  league: {
    id: number;
    link: string;
  };
  division: {
    id: number;
    link: string;
  };
  teamRecords: TeamRecord[];
}

export interface StandingsResponse {
  records: Division[];
}

export const getStandings = async (leagueId: number = 103, season: number = 2024): Promise<StandingsResponse> => {
  console.log('📊 Fetching standings:', { leagueId, season });
  try {
    const response = await mlbApi.get(`/standings`, {
      params: {
        leagueId,
        season,
        standingsTypes: 'regularSeason'
      }
    });
    console.log('✅ Standings fetch successful');
    return response.data;
  } catch (error) {
    console.error('❌ Standings fetch failed:', error);
    throw error;
  }
};

export const getTeams = async () => {
  const response = await mlbApi.get('/teams');
  return response.data;
};

export const getSchedule = async (date: string = new Date().toISOString().split('T')[0]) => {
  const response = await mlbApi.get('/schedule', {
    params: {
      sportId: 1,
      date
    }
  });
  return response.data;
};

// MLB Infrastructure API (more comprehensive)
const MLB_INFRA_BASE = 'https://bdfed.stitch.mlbinfra.com/bdfed/stats';

export const mlbInfraApi = axios.create({
  baseURL: MLB_INFRA_BASE,
});

// Add request interceptor for infrastructure API
mlbInfraApi.interceptors.request.use(
  (config) => {
    console.log('🏗️ MLB Infrastructure API Request:', {
      url: config.url,
      params: config.params,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('❌ MLB Infrastructure API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for infrastructure API
mlbInfraApi.interceptors.response.use(
  (response) => {
    console.log('✅ MLB Infrastructure API Response:', {
      url: response.config.url,
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
      hasStats: !!response.data?.stats,
      statsCount: response.data?.stats?.length || 0
    });
    return response;
  },
  (error) => {
    console.error('❌ MLB Infrastructure API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// New interfaces for the infrastructure API data endpoints
interface ApiParams {
  [key: string]: string | number | undefined;
}

export interface TeamStat {
  teamId: number;
  teamName: string;
  teamAbbrev: string;
  teamShortName: string;
  shortName: string;
  leagueName: string;
  leagueAbbrev: string;
  year: string;
  type: string;
  rank: number;
  divisionName?: string;
  
  // Hitting stats (using actual API field names)
  gamesPlayed?: number;
  atBats?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  stolenBases?: number;
  caughtStealing?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  avg?: string; // API returns as string like ".251"
  obp?: string; // API returns as string like ".332"
  slg?: string; // API returns as string like ".455"
  ops?: string; // API returns as string like ".787"
  
  // Additional hitting stats
  plateAppearances?: number;
  totalBases?: number;
  leftOnBase?: number;
  sacBunts?: number;
  sacFlies?: number;
  babip?: string;
  groundOutsToAirouts?: string;
  hitByPitch?: number;
  intentionalWalks?: number;
  groundIntoDoublePlay?: number;
  numberOfPitches?: number;
  atBatsPerHomeRun?: string;
  
  // Pitching stats (these will be different field names in pitching API)
  wins?: number;
  losses?: number;
  saves?: number;
  earnedRunAverage?: number;
  era?: string;
  inningsPitched?: number;
  hitsAllowed?: number;
  runsAllowed?: number;
  earnedRuns?: number;
  homeRunsAllowed?: number;
  walksAllowed?: number;
  strikeoutsThrown?: number;
  whip?: string;
  battingAverageAgainst?: string;
  
  // Computed properties for backward compatibility
  battingAverage?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  onBasePlusSlugging?: number;
}

export interface TeamStatsResponse {
  stats: TeamStat[];
  totalSize: number;
}

// Function to get team hitting statistics
export const getTeamHittingStats = async (
  season: number = 2025,
  gameType: string = 'R', // R = Regular Season, P = Postseason
  sortStat: string = 'homeRuns',
  order: 'asc' | 'desc' = 'desc',
  limit: number = 30,
  split?: string // For splits like home/away games
): Promise<TeamStatsResponse> => {
  const params: ApiParams = {
    env: 'prod',
    sportId: 1,
    gameType,
    group: 'hitting',
    order,
    sortStat,
    stats: 'season',
    season,
    limit,
    offset: 0
  };
  
  if (split) {
    params.split = split;
  }
  
  const response = await mlbInfraApi.get('/team', { params });
  return response.data;
};

// Function to get team pitching statistics
export const getTeamPitchingStats = async (
  season: number = 2025,
  gameType: string = 'R',
  sortStat: string = 'earnedRunAverage',
  order: 'asc' | 'desc' = 'asc',
  limit: number = 30,
  split?: string
): Promise<TeamStatsResponse> => {
  const params: ApiParams = {
    env: 'prod',
    sportId: 1,
    gameType,
    group: 'pitching',
    order,
    sortStat,
    stats: 'season',
    season,
    limit,
    offset: 0
  };
  
  if (split) {
    params.split = split;
  }
  
  const response = await mlbInfraApi.get('/team', { params });
  return response.data;
};

// Function to get player statistics 
export const getPlayerStats = async (
  group: 'hitting' | 'pitching' | 'fielding' = 'hitting',
  season: number | string = 2025,
  gameType: string = 'R',
  sortStat: string = 'homeRuns',
  order: 'asc' | 'desc' = 'desc',
  limit: number = 50,
  teamId?: number,
  playerPool: string = 'qualified' // 'all' or 'qualified'
): Promise<PlayerStatsResponse> => {
  const params: ApiParams = {
    env: 'prod',
    sportId: 1,
    gameType,
    group,
    order,
    sortStat,
    stats: season === 'career' ? 'career' : 'season',
    season,
    limit,
    offset: 0,
    playerPool
  };
  
  if (teamId) {
    params.teamId = teamId;
  }
  
  const response = await mlbInfraApi.get('/player', { params });
  return response.data;
};

// Player stats interface (updated to match actual API response)
export interface PlayerStat {
  playerId: number;
  playerName: string;
  playerFullName: string;
  teamId: number;
  teamAbbrev: string;
  teamName: string;
  position?: string;
  positionAbbrev?: string;
  primaryPositionAbbrev?: string;
  age?: number;
  gamesPlayed?: number;
  
  // Hitting stats
  avg?: string;
  homeRuns?: number;
  rbi?: number;
  hits?: number;
  atBats?: number;
  runs?: number;
  doubles?: number;
  triples?: number;
  stolenBases?: number;
  baseOnBalls?: number; // walks for hitting
  strikeouts?: number;
  onBasePercentage?: string;
  sluggingPercentage?: string;
  ops?: string;
  
  // Pitching stats
  era?: string;
  wins?: number;
  losses?: number;
  saves?: number;
  inningsPitched?: string;
  strikeOuts?: number; // strikeouts for pitching
  walksAllowed?: number; // walks allowed for pitching
  hitsAllowed?: number; // hits allowed for pitching
  earnedRuns?: number;
  whip?: string;
  
  // Fielding stats
  fielding?: string;
  errors?: number;
  assists?: number;
  putOuts?: number;
  chances?: number;
  doublePlays?: number;
  triplePlays?: number;
  rangeFactorPerGame?: string;
  rangeFactorPer9Inn?: string;
  innings?: string;
  throwingErrors?: number;
  
  // Catcher-specific stats
  caughtStealing?: number;
  stolenBasePercentage?: string;
  caughtStealingPercentage?: string;
  passedBall?: number;
  catcherERA?: string;
  catchersInterference?: number;
  wildPitches?: number;
  pickoffs?: number;
}

export interface PlayerStatsResponse {
  stats: PlayerStat[];
  totalSize: number;
  playerPool?: string;
}

// Function to get league leaders
export const getLeagueLeaders = async (
  group: 'hitting' | 'pitching' | 'fielding' = 'hitting',
  sortStat: string = 'homeRuns',
  season: number = 2025,
  limit: number = 10
): Promise<PlayerStatsResponse> => {
  return getPlayerStats(
    group,
    season,
    'R', // Regular season
    sortStat,
    group === 'pitching' && (sortStat === 'era' || sortStat === 'whip') ? 'asc' : 'desc',
    limit,
    undefined, // No team filter
    'qualified'
  );
};

// Function to get team roster stats
export const getTeamRosterStats = async (
  teamId: number,
  group: 'hitting' | 'pitching' | 'fielding' = 'hitting',
  season: number = 2025
): Promise<PlayerStatsResponse> => {
  return getPlayerStats(
    group,
    season,
    'R',
    group === 'hitting' ? 'avg' : 'era',
    group === 'hitting' ? 'desc' : 'asc',
    50, // Get all players on team
    teamId,
    'all' // Include all players, not just qualified
  );
};

// Function to get team stats configuration (to understand available options)
export const getTeamStatsConfig = async (contextTeamId: number = 121): Promise<TeamStatsResponse> => {
  const response = await mlbInfraApi.get('', {
    params: {
      view: 'team',
      contextTeamId
    }
  });
  return response.data;
};

// Function to get actual team statistics data
export const getTeamStats = async (
  view: 'team' | 'player' = 'team',
  tab: 'teamHitting' | 'teamPitching' = 'teamHitting',
  season: number = 2025,
  gameType: string = 'R', // R = Regular Season
  leagues: string = '', // Empty = all leagues
  contextTeamId?: number
) => {
  const params: ApiParams = {
    view,
    tab,
    season,
    gameType,
    leagues
  };
  
  if (contextTeamId) {
    params.contextTeamId = contextTeamId;
  }
  
  const response = await mlbInfraApi.get('', { params });
  return response.data;
};

export interface Team {
  id: number;
  name: string;
  abbreviation?: string;
  sport: {
    id: number;
    name: string;
  };
}

export interface TeamsResponse {
  teams: Team[];
}