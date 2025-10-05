import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeagueLeaders, getTeamRosterStats, getPlayerStats, type PlayerStat, type PlayerStatsResponse, getTeams, type TeamsResponse } from '../services/mlbApi';

type StatCategory = 'hitting' | 'pitching' | 'fielding';
type ViewMode = 'leaders' | 'search' | 'team';

export default function PlayerStats() {
  console.log('👤 PlayerStats component rendering...');
  
  const [statCategory, setStatCategory] = useState<StatCategory>('hitting');
  const [viewMode, setViewMode] = useState<ViewMode>('leaders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(2025);
  const [selectedTeam, setSelectedTeam] = useState<number | undefined>(undefined);
  const [playerPool, setPlayerPool] = useState<'qualified' | 'all'>('qualified');

  console.log('📊 PlayerStats params:', { statCategory, viewMode, selectedSeason, selectedTeam, playerPool });

  const availableSeasons = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

  // Fetch teams for the team selector
  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams
  });

  // Fetch league leaders
  const { data: leadersData, isLoading: leadersLoading, error: leadersError } = useQuery({
    queryKey: ['leagueLeaders', statCategory, selectedSeason],
    queryFn: () => {
      console.log('🔄 Fetching league leaders...');
      const sortStat = statCategory === 'hitting' ? 'homeRuns' : 
                      statCategory === 'pitching' ? 'era' : 
                      'fielding';
      return getLeagueLeaders(statCategory, sortStat, selectedSeason, 20);
    },
    enabled: viewMode === 'leaders'
  });

  // Fetch team roster stats
  const { data: rosterData, isLoading: rosterLoading, error: rosterError } = useQuery({
    queryKey: ['teamRoster', selectedTeam, statCategory, selectedSeason],
    queryFn: () => {
      console.log('🔄 Fetching team roster stats...');
      return getTeamRosterStats(selectedTeam!, statCategory, selectedSeason);
    },
    enabled: viewMode === 'team' && !!selectedTeam
  });

  // Fetch player search results
  const { data: searchData, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['playerSearch', statCategory, selectedSeason, playerPool],
    queryFn: () => {
      console.log('🔄 Fetching player search results...');
      const sortStat = statCategory === 'hitting' ? 'avg' : 
                      statCategory === 'pitching' ? 'era' : 
                      'fielding';
      return getPlayerStats(
        statCategory,
        selectedSeason,
        'R',
        sortStat,
        statCategory === 'hitting' ? 'desc' : 
        statCategory === 'pitching' ? 'asc' : 
        'desc',
        100,
        undefined,
        playerPool
      );
    },
    enabled: viewMode === 'search'
  });

  const isLoading = leadersLoading || rosterLoading || searchLoading;
  const error = leadersError || rosterError || searchError;
  const data = viewMode === 'leaders' ? leadersData : viewMode === 'team' ? rosterData : searchData;

  console.log('📈 PlayerStats query state:', { 
    isLoading, 
    error: error?.message, 
    dataLength: (data as PlayerStatsResponse)?.stats?.length,
    viewMode 
  });

  // Filter players based on search term
  const filteredPlayers = (data as PlayerStatsResponse)?.stats?.filter((player: PlayerStat) => 
    !searchTerm || 
    player.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get top performers for quick stats
  const getTopPerformers = () => {
    if (!(data as PlayerStatsResponse)?.stats?.length) return [];
    
    const stats = (data as PlayerStatsResponse).stats;
    if (statCategory === 'hitting') {
      return [
        {
          stat: 'Home Runs',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => (b.homeRuns || 0) - (a.homeRuns || 0))[0],
        },
        {
          stat: 'Batting Average',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => parseFloat(b.avg || '0') - parseFloat(a.avg || '0'))[0],
        },
        {
          stat: 'RBI',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => (b.rbi || 0) - (a.rbi || 0))[0],
        }
      ];
    } else if (statCategory === 'pitching') {
      return [
        {
          stat: 'Lowest ERA',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => parseFloat(a.era || '999') - parseFloat(b.era || '999'))[0],
        },
        {
          stat: 'Most Wins',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => (b.wins || 0) - (a.wins || 0))[0],
        },
        {
          stat: 'Most Saves',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => (b.saves || 0) - (a.saves || 0))[0],
        }
      ];
    } else if (statCategory === 'fielding') {
      return [
        {
          stat: 'Highest Fielding %',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => parseFloat(b.fielding || '0') - parseFloat(a.fielding || '0'))[0],
        },
        {
          stat: 'Most Assists',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => (b.assists || 0) - (a.assists || 0))[0],
        },
        {
          stat: 'Most Putouts',
          player: [...stats].sort((a: PlayerStat, b: PlayerStat) => (b.putOuts || 0) - (a.putOuts || 0))[0],
        }
      ];
    }
    return [];
  };

  const topPerformers = getTopPerformers();

  if (isLoading) {
    console.log('⏳ Showing PlayerStats loading state');
    return <div className="text-center p-8">Loading player statistics...</div>;
  }
  
  if (error) {
    console.error('💥 Showing PlayerStats error state:', error);
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">❌ Error loading player stats</div>
        <pre className="text-xs text-red-500 bg-red-50 p-4 rounded">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }

  console.log('🎯 Rendering PlayerStats with data');

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Player Statistics</h2>
            <p className="text-gray-600">Individual player performance and league leaders</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('leaders')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'leaders'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏆 Leaders
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'search'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔍 Search
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'team'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👥 Team
              </button>
            </div>

            {/* Stat Category Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setStatCategory('hitting')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statCategory === 'hitting'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏏 Hitting
              </button>
              <button
                onClick={() => setStatCategory('pitching')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statCategory === 'pitching'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚾ Pitching
              </button>
              <button
                onClick={() => setStatCategory('fielding')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statCategory === 'fielding'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🥎 Fielding
              </button>
            </div>

            {/* Season Selector */}
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableSeasons.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Controls Row */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {/* Search Input */}
          {(viewMode === 'search' || viewMode === 'team') && (
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Team Selector */}
          {viewMode === 'team' && (teamsData as TeamsResponse)?.teams && (
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(e.target.value ? Number(e.target.value) : undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a team...</option>
              {(teamsData as TeamsResponse).teams
                .filter((team) => team.sport?.id === 1) // MLB only
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
            </select>
          )}

          {/* Player Pool Selector */}
          {viewMode === 'search' && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPlayerPool('qualified')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  playerPool === 'qualified'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Qualified
              </button>
              <button
                onClick={() => setPlayerPool('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  playerPool === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Top Performers Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {viewMode === 'leaders' ? 'Top Performers' : viewMode === 'team' ? 'Team Leaders' : 'Category Leaders'}
          </h3>
          
          <div className="space-y-3">
            {topPerformers.map((performer, index) => {
              const colors = ['border-yellow-500', 'border-green-500', 'border-blue-500'];
              const textColors = ['text-yellow-600', 'text-green-600', 'text-blue-600'];
              
              return (
                <div key={performer.stat} className={`bg-white p-4 rounded-lg shadow border-l-4 ${colors[index]}`}>
                  <div className="text-sm text-gray-600">{performer.stat}</div>
                  <div className="text-lg font-bold text-gray-900">{performer.player?.playerName || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{performer.player?.teamName}</div>
                  <div className={`text-sm ${textColors[index]} font-bold`}>
                    {statCategory === 'hitting' ? (
                      performer.stat === 'Home Runs' ? performer.player?.homeRuns :
                      performer.stat === 'Batting Average' ? performer.player?.avg :
                      performer.player?.rbi
                    ) : statCategory === 'fielding' ? (
                      performer.stat === 'Highest Fielding %' ? performer.player?.fielding :
                      performer.stat === 'Most Assists' ? performer.player?.assists :
                      performer.player?.putOuts
                    ) : (
                      performer.stat === 'Lowest ERA' ? performer.player?.era :
                      performer.stat === 'Most Wins' ? performer.player?.wins :
                      performer.player?.saves
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Stats Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statCategory === 'hitting' ? '🏏 Player Hitting Stats' : 
                     statCategory === 'pitching' ? '⚾ Player Pitching Stats' : 
                     '🥎 Player Fielding Stats'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {viewMode === 'leaders' ? 'League leaders and top performers' :
                     viewMode === 'team' ? `${selectedTeam ? 'Team roster statistics' : 'Select a team to view roster'}` :
                     'Search and filter all players'}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredPlayers.length} players
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    {statCategory === 'hitting' ? (
                      <>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">AVG</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">RBI</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OPS</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SB</th>
                      </>
                    ) : statCategory === 'pitching' ? (
                      <>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ERA</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">WHIP</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SV</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">POS</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">FLD%</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">A</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PO</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">DP</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlayers.map((player: PlayerStat, index: number) => (
                    <tr key={`${player.playerId}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{player.playerName}</div>
                        <div className="text-sm text-gray-500">#{player.playerId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {player.teamAbbrev}
                        </span>
                      </td>
                      {statCategory === 'hitting' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.avg || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.homeRuns || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.rbi || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.ops || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.stolenBases || 0}
                          </td>
                        </>
                      ) : statCategory === 'pitching' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.era || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.wins || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.losses || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.whip || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.saves || 0}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {player.positionAbbrev || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            <span className={`font-medium ${(player.fielding && parseFloat(player.fielding) >= 0.990) ? 'text-green-600' : 'text-gray-900'}`}>
                              {player.fielding || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            <span className={`${(player.errors || 0) === 0 ? 'text-green-600 font-medium' : 'text-red-600'}`}>
                              {player.errors || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.assists || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.putOuts || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {player.doublePlays || 0}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty State */}
            {filteredPlayers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-500">
                  {viewMode === 'team' && !selectedTeam
                    ? 'Please select a team to view roster statistics'
                    : searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'No data available for the selected filters'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Data Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">View Mode</div>
            <div className="text-lg font-bold text-gray-900 capitalize">{viewMode}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Category</div>
            <div className="text-lg font-bold text-gray-900 capitalize">{statCategory}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Season</div>
            <div className="text-lg font-bold text-gray-900">{selectedSeason}</div>
          </div>
        </div>
      </div>
    </div>
  );
}