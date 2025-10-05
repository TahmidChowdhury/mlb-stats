import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeamHittingStats, getTeamPitchingStats, type TeamStat } from '../services/mlbApi';

type ViewMode = 'simple' | 'advanced';
type StatType = 'hitting' | 'pitching';

export default function TeamStats() {
  console.log('⚾ TeamStats component rendering...');
  
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [statType, setStatType] = useState<StatType>('hitting');
  const [selectedSeason, setSelectedSeason] = useState(2025);

  console.log('📊 TeamStats params:', { viewMode, statType, selectedSeason });

  // Fetch hitting stats
  const { data: hittingData = {}, isLoading: hittingLoading, error: hittingError } = useQuery({
    queryKey: ['teamHittingStats', selectedSeason],
    queryFn: () => {
      console.log('🔄 Fetching team hitting stats...');
      return getTeamHittingStats(selectedSeason, 'R', 'homeRuns', 'desc', 30);
    },
    enabled: statType === 'hitting',
    onSuccess: (data) => {
      console.log('✅ Team hitting data loaded:', data);
    },
    onError: (error) => {
      console.error('❌ Team hitting data fetch failed:', error);
    }
  });

  // Fetch pitching stats
  const { data: pitchingData = {}, isLoading: pitchingLoading, error: pitchingError } = useQuery({
    queryKey: ['teamPitchingStats', selectedSeason],
    queryFn: () => {
      console.log('🔄 Fetching team pitching stats...');
      return getTeamPitchingStats(selectedSeason, 'R', 'earnedRunAverage', 'asc', 30);
    },
    enabled: statType === 'pitching',
    onSuccess: (data) => {
      console.log('✅ Team pitching data loaded:', data);
    },
    onError: (error) => {
      console.error('❌ Team pitching data fetch failed:', error);
    }
  });

  const isLoading = statType === 'hitting' ? hittingLoading : pitchingLoading;
  const error = statType === 'hitting' ? hittingError : pitchingError;
  const data = statType === 'hitting' ? (hittingData as { stats?: TeamStat[] }) : (pitchingData as { stats?: TeamStat[] });

  console.log('📈 TeamStats query state:', { 
    isLoading, 
    error: error?.message, 
    dataLength: data?.stats?.length,
    statType 
  });

  // Get leaders from the data
  const getLeaders = () => {
    if (!data?.stats?.length) {
      console.warn('⚠️ No team stats data for leaders calculation');
      return [];
    }
    
    console.log('🏆 Calculating leaders from', data.stats.length, 'teams');
    const stats = data.stats;
    
    if (statType === 'hitting') {
      // Convert string percentages to numbers for sorting
      const sortedByAvg = [...stats].sort((a, b) => parseFloat(b.avg || '0') - parseFloat(a.avg || '0'));
      const sortedByRuns = [...stats].sort((a, b) => (b.runs || 0) - (a.runs || 0));
      
      return [
        {
          stat: 'Home Runs',
          team: stats[0]?.teamName || 'Loading...',
          value: stats[0]?.homeRuns || '--',
          league: stats[0]?.leagueName || ''
        },
        {
          stat: 'Batting Average',
          team: sortedByAvg[0]?.teamName || 'Loading...',
          value: sortedByAvg[0]?.avg || '--',
          league: sortedByAvg[0]?.leagueName || ''
        },
        {
          stat: 'Most Runs',
          team: sortedByRuns[0]?.teamName || 'Loading...',
          value: sortedByRuns[0]?.runs || '--',
          league: sortedByRuns[0]?.leagueName || ''
        }
      ];
    } else {
      // Pitching stats - with better null/undefined handling
      const sortedByERA = [...stats].sort((a, b) => parseFloat(a.era || '999') - parseFloat(b.era || '999'));
      const sortedByStrikeouts = [...stats].sort((a, b) => (b.strikeOuts || 0) - (a.strikeOuts || 0));
      const sortedByWHIP = [...stats].sort((a, b) => parseFloat(a.whip || '999') - parseFloat(b.whip || '999'));

      return [
        {
          stat: 'Lowest ERA',
          team: sortedByERA[0]?.teamName || 'Loading...',
          value: sortedByERA[0]?.era || '--',
          league: sortedByERA[0]?.leagueName || ''
        },
        {
          stat: 'Most Strikeouts',
          team: sortedByStrikeouts[0]?.teamName || 'Loading...',
          value: sortedByStrikeouts[0]?.strikeOuts || '--',
          league: sortedByStrikeouts[0]?.leagueName || ''
        },
        {
          stat: 'Lowest WHIP',
          team: sortedByWHIP[0]?.teamName || 'Loading...',
          value: sortedByWHIP[0]?.whip || '--',
          league: sortedByWHIP[0]?.leagueName || ''
        }
      ];
    }
  };

  const leaders = getLeaders();
  const availableSeasons = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

  if (isLoading) {
    console.log('⏳ Showing TeamStats loading state');
    return <div className="text-center p-8">Loading team statistics...</div>;
  }
  
  if (error) {
    console.error('💥 Showing TeamStats error state:', error);
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">❌ Error loading team stats</div>
        <pre className="text-xs text-red-500 bg-red-50 p-4 rounded">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }

  console.log('🎯 Rendering TeamStats with data');

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Statistics</h2>
            <p className="text-gray-600">Real-time MLB team performance data</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('simple')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'simple'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Fan View
              </button>
              <button
                onClick={() => setViewMode('advanced')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'advanced'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔬 Analytics
              </button>
            </div>

            {/* Stat Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setStatType('hitting')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statType === 'hitting'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏏 Hitting
              </button>
              <button
                onClick={() => setStatType('pitching')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statType === 'pitching'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚾ Pitching
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
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">League Leaders</h3>
          
          <div className="space-y-3">
            {leaders.map((leader, index) => {
              const colors = ['border-green-500', 'border-blue-500', 'border-purple-500'];
              const textColors = ['text-green-600', 'text-blue-600', 'text-purple-600'];
              
              return (
                <div key={leader.stat} className={`bg-white p-4 rounded-lg shadow border-l-4 ${colors[index]}`}>
                  <div className="text-sm text-gray-600">{leader.stat}</div>
                  <div className="text-xl font-bold text-gray-900">{leader.team}</div>
                  <div className={`text-sm ${textColors[index]} flex items-center justify-between`}>
                    <span>{leader.league}</span>
                    <span className="font-bold text-lg">{leader.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Stats Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {statType === 'hitting' ? '🏏 Team Hitting Stats' : '⚾ Team Pitching Stats'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {viewMode === 'simple' ? 'Essential stats for fans' : 'Advanced analytics for deeper analysis'}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    {viewMode === 'simple' ? (
                      statType === 'hitting' ? (
                        <>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">AVG</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">RBI</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Runs</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ERA</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">WHIP</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SO</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Saves</th>
                        </>
                      )
                    ) : (
                      statType === 'hitting' ? (
                        <>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OPS</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SLG</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OBP</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SB</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">2B</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">H</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">BB</th>
                        </>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.stats?.slice(0, 15).map((team: TeamStat, index: number) => (
                    <tr key={team.teamId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold">
                            {team.teamAbbrev || team.teamName.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                            <div className="text-xs text-gray-500">{team.leagueName}</div>
                          </div>
                        </div>
                      </td>
                      
                      {viewMode === 'simple' ? (
                        statType === 'hitting' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.avg || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                              {team.homeRuns || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.rbi || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.runs || '--'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.era || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.whip || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.strikeOuts || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.saves || '--'}
                            </td>
                          </>
                        )
                      ) : (
                        statType === 'hitting' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.ops || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.slg || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.obp || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.stolenBases || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.doubles || '--'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.wins || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.losses || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.inningsPitched ? parseFloat(team.inningsPitched.toString()).toFixed(1) : '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.hits || '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {team.baseOnBalls || '--'}
                            </td>
                          </>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced View Additional Features */}
      {viewMode === 'advanced' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">Total Teams</div>
                <div className="text-xl font-bold text-gray-900">{data?.stats?.length || 0}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">Season</div>
                <div className="text-xl font-bold text-gray-900">{selectedSeason}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">Data Source</div>
                <div className="text-sm font-medium text-blue-600">MLB Infrastructure</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">Updated</div>
                <div className="text-sm font-medium text-green-600">Real-time</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Available Views</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Regular Season</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Postseason</span>
                <span className="text-sm font-medium">Available</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Home/Away Splits</span>
                <span className="text-sm font-medium">Available</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}