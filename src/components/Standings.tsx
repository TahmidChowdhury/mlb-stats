import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStandings, type Division, type TeamRecord } from '../services/mlbApi';

// Division name mapping
const getDivisionName = (divisionId: number): string => {
  const divisions: Record<number, string> = {
    200: 'AL West',
    201: 'AL East', 
    202: 'AL Central',
    203: 'NL West',
    204: 'NL East',
    205: 'NL Central'
  };
  return divisions[divisionId] || 'Unknown Division';
};

export default function Standings() {
  console.log('🏆 Standings component rendering...');
  
  const currentYear = new Date().getFullYear();
  const [selectedLeague] = useState<number>(103); // AL by default
  const [selectedSeason, setSelectedSeason] = useState<number>(2024); // Default to 2024 since we know it has data

  console.log('📊 Standings params:', { selectedLeague, selectedSeason });

  // Generate season options (last 10 years)
  const seasonOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['standings', selectedLeague, selectedSeason],
    queryFn: async () => {
      try {
        console.log('🔄 Fetching standings data...');
        return await getStandings(selectedLeague, selectedSeason);
      } catch (error) {
        console.error('❌ Standings data fetch failed:', error);
        throw error; // Ensure the error propagates to the `useQuery` error state
      }
    }
  });

  console.log('📈 Query state:', { isLoading, error: error?.message, dataLength: data?.records?.length });

  if (isLoading) {
    console.log('⏳ Showing loading state');
    return <div className="text-center p-8">Loading standings...</div>;
  }
  
  if (error) {
    console.error('💥 Showing error state:', error);
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">❌ Error loading standings</div>
        <pre className="text-xs text-red-500 bg-red-50 p-4 rounded">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }

  if (!data?.records?.length) {
    console.warn('⚠️ No standings data available');
    return (
      <div className="text-center p-8">
        <div className="text-yellow-500 mb-4">⚠️ No standings data available</div>
        <p className="text-gray-600">Try selecting a different league or season.</p>
      </div>
    );
  }

  console.log('🎯 Rendering standings table with', data.records.length, 'divisions');

  // Get the actual season from the data (remove the problematic line)
  const actualSeason = selectedSeason;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">MLB American League Standings</h1>
      
      {/* Season Selector */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <label htmlFor="season-select" className="text-base sm:text-lg font-medium text-gray-700">
            Season:
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          >
            {seasonOptions.map((year) => (
              <option key={year} value={year}>
                {year} {year === currentYear ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
        {actualSeason} Season {actualSeason !== currentYear ? '(Final)' : ''}
      </p>
      
      {data?.records.map((division: Division) => (
        <div key={division.division.id} className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-blue-600">
            {getDivisionName(division.division.id)}
          </h2>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full px-4 sm:px-0">
              <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PCT</th>
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GB</th>
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Runs</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {division.teamRecords.map((teamRecord: TeamRecord, index) => (
                    <tr key={teamRecord.team.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            <div className="sm:hidden">{teamRecord.team.name.split(' ').pop()}</div>
                            <div className="hidden sm:block">{teamRecord.team.name}</div>
                            {teamRecord.clinchIndicator && (
                              <span className="ml-1 sm:ml-2 text-xs bg-green-100 text-green-800 px-1 sm:px-2 py-1 rounded-full">
                                {teamRecord.clinchIndicator === 'y' ? 'Div' : 
                                 teamRecord.clinchIndicator === 'w' ? 'WC' : 
                                 teamRecord.clinchIndicator}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-center">{teamRecord.wins}</td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-center">{teamRecord.losses}</td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-center">
                        <span className="sm:hidden">{(parseFloat(teamRecord.winningPercentage) * 100).toFixed(0)}%</span>
                        <span className="hidden sm:inline">{(parseFloat(teamRecord.winningPercentage) * 100).toFixed(1)}%</span>
                      </td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-center">{teamRecord.gamesBack}</td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 text-center hidden sm:table-cell">
                        {teamRecord.runsScored}-{teamRecord.runsAllowed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}