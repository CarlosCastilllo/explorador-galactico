import React, { useState } from 'react';
import AutomataValidator from './pages/AutomataValidator.js';
import SpaceBrowser from './pages/SpaceBrowser.js';
// Componente placeholder para AutomataValidator


// Componente placeholder para SpaceBrowser


// Componente principal de la aplicación
const App = () => {
  const [currentView, setCurrentView] = useState('home');

  const renderContent = () => {
    switch (currentView) {
      case 'automata':
        return <AutomataValidator />;
      case 'space':
        return <SpaceBrowser />;
      default:
        return (
          <div className="text-center p-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              Bienvenido a AUTOMAT-APPS
            </h1>
            <p className="text-xl text-gray-600 text-lg mb-8">
              Selecciona una opción para comenzar
            </p>
            <div  className="flex justify-center space-x-8">
              <div onClick={() => setCurrentView('automata')} className="bg-blue-100 p-8 rounded-lg cursor-pointer transform transition duration-300 hover:scale-105">
                <h3 className="font-bold text-xl text-blue-800">Validador de Autómatas</h3>
                <p className="text-base text-blue-600">Herramienta para validar autómatas finitos</p>
              </div>
              <div onClick={() => setCurrentView('space')} className="bg-purple-100 p-8 rounded-lg cursor-pointer transform transition duration-300 hover:scale-105">
                <h3 className="font-bold text-xl text-purple-800">Space Browser</h3>
                <p className="text-base text-purple-600">Explorador del espacio exterior</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegación */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">AUTOMAT-APPS</h1>
            </div>
            
            {/* Botones de navegación */}
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Inicio
              </button>
              
              <button
                onClick={() => setCurrentView('automata')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'automata'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Validador de Autómatas
              </button>
              
              <button
                onClick={() => setCurrentView('space')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'space'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Space Browser
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto p-6">
        {renderContent()}
      </main>

      {/* Botón de regreso (cuando no está en home) */}
      {currentView !== 'home' && (
        <div className="fixed bottom-6 left-6">
          <button
            onClick={() => setCurrentView('home')}
            className="bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
};

export default App;