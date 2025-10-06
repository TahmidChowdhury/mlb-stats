import { useState } from 'react';
import Standings from './components/Standings';
import TeamStats from './components/TeamStats';
import PlayerStats from './components/PlayerStats';
import './App.css'

type TabType = 'standings' | 'teams' | 'players' | 'scores';

function App() {
  console.log('🚀 App component rendering...');
  
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  console.log('📍 Current active tab:', activeTab);

  const tabs = [
    { id: 'standings' as TabType, label: 'Standings', icon: '🏆' },
    { id: 'teams' as TabType, label: 'Team Stats', icon: '⚾' },
    { id: 'players' as TabType, label: 'Player Stats', icon: '👤' },
    { id: 'scores' as TabType, label: 'Live Scores', icon: '📊' }
  ];

  const renderContent = () => {
    console.log('🎯 Rendering content for tab:', activeTab);
    
    try {
      switch (activeTab) {
        case 'standings':
          console.log('✅ Loading Standings component');
          return <Standings />;
        case 'teams':
          console.log('✅ Loading TeamStats component');
          return <TeamStats />;
        case 'players':
          console.log('✅ Loading PlayerStats component');
          return <PlayerStats />;
        case 'scores':
          console.log('✅ Loading Live Scores placeholder');
          return (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Live Scores</h3>
              <p className="text-gray-600">Coming soon! Real-time game updates and scores.</p>
            </div>
          );
        default:
          console.warn('⚠️ Unknown tab, defaulting to standings:', activeTab);
          return <Standings />;
      }
    } catch (error) {
      console.error('❌ Error rendering content:', error);
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-red-900 mb-2">Error Loading Content</h3>
          <p className="text-red-600">There was an error loading the {activeTab} section.</p>
          <pre className="text-xs text-red-500 mt-4 text-left bg-red-100 p-2 rounded">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      );
    }
  };

  console.log('🎨 App component render complete');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="text-3xl sm:text-4xl">⚾</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">MLB Stats Central</h1>
                <p className="text-sm sm:text-base text-gray-600">Real-time baseball statistics and analytics</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
              <span>Data from official MLB APIs</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Live 2025</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('🔄 Tab clicked:', tab.id);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center space-x-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 sm:py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm sm:text-base text-gray-300">
            Built with React + TypeScript • Data from official MLB APIs • 
            <span className="text-blue-400 ml-1">Real-time updates</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
