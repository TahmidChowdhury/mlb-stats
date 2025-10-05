import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSchedule } from '../services/mlbApi';

type DateFilter = 'today' | 'yesterday' | 'tomorrow';

export default function LiveScores() {
  const [selectedDate, setSelectedDate] = useState<DateFilter>('today');
  
  const getDateString = (filter: DateFilter): string => {
    const today = new Date();
    switch (filter) {
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }
      case 'tomorrow': {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      default:
        return today.toISOString().split('T')[0];
    }
  };

  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ['schedule', selectedDate],
    queryFn: () => getSchedule(getDateString(selectedDate)),
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });

  console.log('Schedule data:', scheduleData); // Debug log

  const formatDate = (filter: DateFilter): string => {
    const date = new Date();
    switch (filter) {
      case 'yesterday':
        date.setDate(date.getDate() - 1);
        break;
      case 'tomorrow':
        date.setDate(date.getDate() + 1);
        break;
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const mockGames = [
    {
      id: 1,
      status: 'Final',
      inning: '9th',
      homeTeam: 'Yankees',
      awayTeam: 'Red Sox',
      homeScore: 7,
      awayScore: 4,
      time: '7:05 PM ET'
    },
    {
      id: 2,
      status: 'Live',
      inning: 'Top 6th',
      homeTeam: 'Dodgers',
      awayTeam: 'Giants',
      homeScore: 3,
      awayScore: 5,
      time: 'Live'
    },
    {
      id: 3,
      status: 'Scheduled',
      inning: '',
      homeTeam: 'Astros',
      awayTeam: 'Angels',
      homeScore: 0,
      awayScore: 0,
      time: '8:10 PM ET'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Scores & Schedule</h2>
            <p className="text-gray-600">Real-time game updates and upcoming matchups</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Date Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedDate('yesterday')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDate === 'yesterday'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setSelectedDate('today')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDate === 'today'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate('tomorrow')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDate === 'tomorrow'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tomorrow
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Auto-refresh: 30s
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-lg font-medium text-gray-700">
          {formatDate(selectedDate)}
        </div>
      </div>

      {/* Live Games Alert */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <span className="font-medium">Live Games in Progress</span>
          </div>
          <div className="text-sm opacity-90">
            Updates every 30 seconds
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className="text-center p-8">Loading games...</div>
      ) : error ? (
        <div className="text-center p-8 text-red-500">Error loading schedule</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockGames.map((game) => (
            <div key={game.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Game Status Header */}
              <div className={`px-4 py-2 text-center text-white font-medium ${
                game.status === 'Live' ? 'bg-red-500' :
                game.status === 'Final' ? 'bg-gray-600' :
                'bg-blue-500'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  {game.status === 'Live' && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                  <span>{game.status}</span>
                  {game.inning && <span>• {game.inning}</span>}
                </div>
              </div>

              {/* Game Content */}
              <div className="p-4">
                {/* Away Team */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <span className="font-medium text-gray-900">{game.awayTeam}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {game.status !== 'Scheduled' ? game.awayScore : ''}
                  </div>
                </div>

                {/* VS or @ */}
                <div className="text-center text-gray-400 text-sm mb-3">
                  @
                </div>

                {/* Home Team */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <span className="font-medium text-gray-900">{game.homeTeam}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {game.status !== 'Scheduled' ? game.homeScore : ''}
                  </div>
                </div>

                {/* Game Time/Status */}
                <div className="text-center text-sm text-gray-600 border-t pt-3">
                  {game.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">🎮</div>
          <div className="text-2xl font-bold text-gray-900">
            {mockGames.length}
          </div>
          <div className="text-sm text-gray-600">Games Today</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">🔴</div>
          <div className="text-2xl font-bold text-red-600">
            {mockGames.filter(g => g.status === 'Live').length}
          </div>
          <div className="text-sm text-gray-600">Live Now</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-gray-600">
            {mockGames.filter(g => g.status === 'Final').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <div className="text-2xl font-bold text-blue-600">
            {mockGames.filter(g => g.status === 'Scheduled').length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
      </div>

      {/* Scoreboard Legend */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scoreboard Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Live games with real-time updates</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-600 rounded"></div>
            <span>Final scores and completed games</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Scheduled games with start times</span>
          </div>
        </div>
      </div>
    </div>
  );
}