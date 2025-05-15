import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, Rocket, Star, ArrowRight, Battery, Zap, X, Circle, Loader } from 'lucide-react';

// Valores constantes para los tipos de celda
const CELL_TYPES = {
  NORMAL: 'normal',
  START: 'start',
  END: 'end',
  BLACK_HOLE: 'blackHole',
  GIANT_STAR: 'giantStar',
  PORTAL_IN: 'portalIn',
  PORTAL_OUT: 'portalOut',
  WORMHOLE_IN: 'wormholeIn',
  WORMHOLE_OUT: 'wormholeOut',
  RECHARGE_ZONE: 'rechargeZone',
  REQUIRED_CHARGE: 'requiredCharge'
};

// Colores para los tipos de celda
const CELL_COLORS = {
  [CELL_TYPES.NORMAL]: 'bg-gray-800',
  [CELL_TYPES.START]: 'bg-green-600',
  [CELL_TYPES.END]: 'bg-red-600',
  [CELL_TYPES.BLACK_HOLE]: 'bg-black',
  [CELL_TYPES.GIANT_STAR]: 'bg-yellow-300',
  [CELL_TYPES.PORTAL_IN]: 'bg-blue-500',
  [CELL_TYPES.PORTAL_OUT]: 'bg-blue-700',
  [CELL_TYPES.WORMHOLE_IN]: 'bg-purple-500',
  [CELL_TYPES.WORMHOLE_OUT]: 'bg-purple-700',
  [CELL_TYPES.RECHARGE_ZONE]: 'bg-green-400',
  [CELL_TYPES.REQUIRED_CHARGE]: 'bg-orange-500',
  'path': 'bg-green-300',
  'current': 'bg-blue-300'
};

// Iconos para los tipos de celda
const CELL_ICONS = {
  [CELL_TYPES.START]: <Rocket size={16} />,
  [CELL_TYPES.END]: <Check size={16} />,
  [CELL_TYPES.BLACK_HOLE]: <Circle size={16} fill="black" />,
  [CELL_TYPES.GIANT_STAR]: <Star size={16} />,
  [CELL_TYPES.PORTAL_IN]: <ArrowRight size={16} />,
  [CELL_TYPES.PORTAL_OUT]: <ArrowRight size={16} />,
  [CELL_TYPES.WORMHOLE_IN]: <ArrowRight size={16} />,
  [CELL_TYPES.WORMHOLE_OUT]: <ArrowRight size={16} />,
  [CELL_TYPES.RECHARGE_ZONE]: <Battery size={16} />,
  [CELL_TYPES.REQUIRED_CHARGE]: <Zap size={16} />
};

// Componente principal
export default function GalacticExplorer() {
  const [universeData, setUniverseData] = useState(null);
  const [universe, setUniverse] = useState([]);
  const [solution, setSolution] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [status, setStatus] = useState('waiting'); // waiting, solving, solved, noSolution
  const [energyLog, setEnergyLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Ejemplo de JSON para cargar
  const exampleJson = {
    "matriz": { "filas": 10, "columnas": 10 },
    "origen": [0, 0],
    "destino": [9, 9],
    "agujerosNegros": [[3, 5], [2, 2], [8, 8]],
    "estrellasGigantes": [[7, 7], [4, 4], [1, 8]],
    "portales": [{ "desde": [5, 5], "hasta": [8, 2] }],
    "agujerosGusano": [{ "entrada": [1, 1], "salida": [3, 3] }],
    "zonasRecarga": [[4, 6, 2], [5, 8, 3]],
    "celdasCargaRequerida": [{ "coordenada": [6, 6], "cargaGastada": 30 }],
    "cargaInicial": 100,
    "matrizInicial": Array(10).fill().map(() => Array(10).fill().map(() => Math.floor(Math.random() * 10) + 1))
  };

  // Carga el ejemplo JSON
  const loadExampleJson = () => {
    processUniverseData(exampleJson);
  };

  // Procesa el archivo JSON subido
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        processUniverseData(data);
      } catch (error) {
        alert("Error al procesar el archivo JSON");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      alert("Error al leer el archivo");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Procesa los datos del universo y crea la matriz
  const processUniverseData = (data) => {
    setUniverseData(data);
    const { filas, columnas } = data.matriz;
    
    // Crear matriz base con costes de energía
    const newUniverse = Array(filas).fill().map((_, rowIndex) => 
      Array(columnas).fill().map((_, colIndex) => ({
        type: CELL_TYPES.NORMAL,
        row: rowIndex,
        col: colIndex,
        energyCost: data.matrizInicial[rowIndex][colIndex] || 1,
        additionalInfo: {}
      }))
    );

    // Añadir origen y destino
    const [startRow, startCol] = data.origen;
    const [endRow, endCol] = data.destino;
    newUniverse[startRow][startCol].type = CELL_TYPES.START;
    newUniverse[endRow][endCol].type = CELL_TYPES.END;

    // Añadir agujeros negros
    data.agujerosNegros.forEach(([row, col]) => {
      if (row < filas && col < columnas) {
        newUniverse[row][col].type = CELL_TYPES.BLACK_HOLE;
      }
    });

    // Añadir estrellas gigantes
    data.estrellasGigantes.forEach(([row, col]) => {
      if (row < filas && col < columnas) {
        newUniverse[row][col].type = CELL_TYPES.GIANT_STAR;
      }
    });

    // Añadir portales
    data.portales.forEach(portal => {
      const [fromRow, fromCol] = portal.desde;
      const [toRow, toCol] = portal.hasta;
      if (fromRow < filas && fromCol < columnas && toRow < filas && toCol < columnas) {
        newUniverse[fromRow][fromCol].type = CELL_TYPES.PORTAL_IN;
        newUniverse[fromRow][fromCol].additionalInfo = { destination: [toRow, toCol] };
        newUniverse[toRow][toCol].type = CELL_TYPES.PORTAL_OUT;
      }
    });

    // Añadir agujeros de gusano
    data.agujerosGusano.forEach(wormhole => {
      const [inRow, inCol] = wormhole.entrada;
      const [outRow, outCol] = wormhole.salida;
      if (inRow < filas && inCol < columnas && outRow < filas && outCol < columnas) {
        newUniverse[inRow][inCol].type = CELL_TYPES.WORMHOLE_IN;
        newUniverse[inRow][inCol].additionalInfo = { 
          destination: [outRow, outCol],
          used: false 
        };
        newUniverse[outRow][outCol].type = CELL_TYPES.WORMHOLE_OUT;
      }
    });

    // Añadir zonas de recarga
    data.zonasRecarga.forEach(([row, col, multiplier]) => {
      if (row < filas && col < columnas) {
        newUniverse[row][col].type = CELL_TYPES.RECHARGE_ZONE;
        newUniverse[row][col].additionalInfo = { multiplier };
      }
    });

    // Añadir celdas con carga requerida
    data.celdasCargaRequerida.forEach(cell => {
      const [row, col] = cell.coordenada;
      if (row < filas && col < columnas) {
        newUniverse[row][col].type = CELL_TYPES.REQUIRED_CHARGE;
        newUniverse[row][col].additionalInfo = { requiredCharge: cell.cargaGastada };
      }
    });

    setUniverse(newUniverse);
    setSolution([]);
    setCurrentStepIndex(-1);
    setStatus('waiting');
    setEnergyLog([]);
  };

  // Inicia la búsqueda de la solución
  const findSolution = () => {
    if (!universeData) return;

    setStatus('solving');
    setSolution([]);
    setCurrentStepIndex(-1);
    setEnergyLog([]);

    // Copia del universo para no modificar el original
    const universeCopy = JSON.parse(JSON.stringify(universe));
    
    // Posición inicial y carga inicial
    const [startRow, startCol] = universeData.origen;
    const initialEnergy = universeData.cargaInicial;
    
    // Lista para guardar el camino encontrado
    const path = [];
    const energyHistory = [];
    
    // Función de backtracking
    const backtrack = (row, col, energy, visited = new Set()) => {
      // Clave única para la posición actual
      const posKey = `${row},${col}`;
      
      // Si ya visitamos esta celda, retornamos false
      if (visited.has(posKey)) return false;
      
      // Verificamos si es un agujero negro
      if (universeCopy[row][col].type === CELL_TYPES.BLACK_HOLE) return false;
      
      // Verificamos si tenemos suficiente energía para celdas que requieren carga mínima
      if (universeCopy[row][col].type === CELL_TYPES.REQUIRED_CHARGE) {
        const requiredCharge = universeCopy[row][col].additionalInfo.requiredCharge;
        if (energy < requiredCharge) return false;
      }
      
      // Calculamos la nueva energía
      let newEnergy = energy;
      
      // Si es una zona de recarga, multiplicamos la energía
      if (universeCopy[row][col].type === CELL_TYPES.RECHARGE_ZONE) {
        const multiplier = universeCopy[row][col].additionalInfo.multiplier;
        newEnergy *= multiplier;
      } else {
        // Si no es zona de recarga, gastamos energía
        newEnergy -= universeCopy[row][col].energyCost;
      }
      
      // Si nos quedamos sin energía, no podemos continuar
      if (newEnergy <= 0) return false;
      
      // Añadimos la posición actual al camino
      path.push([row, col]);
      energyHistory.push(newEnergy);
      
      // Verificamos si hemos llegado al destino
      const [endRow, endCol] = universeData.destino;
      if (row === endRow && col === endCol) {
        return true;
      }
      
      // Marcamos la celda como visitada
      visited.add(posKey);
      
      // Si es un portal, nos movemos a su destino
      if (universeCopy[row][col].type === CELL_TYPES.PORTAL_IN) {
        const [destRow, destCol] = universeCopy[row][col].additionalInfo.destination;
        if (backtrack(destRow, destCol, newEnergy, visited)) {
          return true;
        }
      }
      
      // Si es un agujero de gusano y no ha sido usado, nos movemos a su salida
      if (universeCopy[row][col].type === CELL_TYPES.WORMHOLE_IN && !universeCopy[row][col].additionalInfo.used) {
        const [destRow, destCol] = universeCopy[row][col].additionalInfo.destination;
        universeCopy[row][col].additionalInfo.used = true; // Marcamos como usado
        if (backtrack(destRow, destCol, newEnergy, visited)) {
          return true;
        }
        universeCopy[row][col].additionalInfo.used = false; // Desmarcamos si no encontramos solución
      }
      
      // Verificamos si hay estrellas gigantes que puedan destruir agujeros negros adyacentes
      if (universeCopy[row][col].type === CELL_TYPES.GIANT_STAR) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // arriba, abajo, izquierda, derecha
        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          
          // Verificar que la nueva posición está dentro de los límites
          if (newRow >= 0 && newRow < universeCopy.length && 
              newCol >= 0 && newCol < universeCopy[0].length) {
            // Si es un agujero negro, lo destruimos temporalmente
            if (universeCopy[newRow][newCol].type === CELL_TYPES.BLACK_HOLE) {
              const originalType = universeCopy[newRow][newCol].type;
              universeCopy[newRow][newCol].type = CELL_TYPES.NORMAL;
              
              // Intentamos continuar por este camino
              if (backtrack(newRow, newCol, newEnergy, new Set(visited))) {
                return true;
              }
              
              // Restauramos el agujero negro si no encontramos solución
              universeCopy[newRow][newCol].type = originalType;
              break; // Solo destruimos un agujero negro
            }
          }
        }
      }
      
      // Movimientos posibles: arriba, abajo, izquierda, derecha
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        // Verificar que la nueva posición está dentro de los límites
        if (newRow >= 0 && newRow < universeCopy.length && 
            newCol >= 0 && newCol < universeCopy[0].length) {
          // Intentamos movernos a la nueva posición
          if (backtrack(newRow, newCol, newEnergy, new Set(visited))) {
            return true;
          }
        }
      }
      
      // Si llegamos aquí, no encontramos solución desde esta posición
      path.pop(); // Quitamos esta posición del camino
      energyHistory.pop(); // Quitamos el registro de energía
      return false;
    };
    
    // Iniciamos el backtracking desde la posición inicial
    const solutionFound = backtrack(startRow, startCol, initialEnergy);
    
    if (solutionFound) {
      setSolution(path);
      setEnergyLog(energyHistory);
      setStatus('solved');
    } else {
      setStatus('noSolution');
    }
  };

  // Avanza un paso en la animación
  const nextStep = () => {
    if (currentStepIndex < solution.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // Retrocede un paso en la animación
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Reinicia la animación
  const resetAnimation = () => {
    setCurrentStepIndex(-1);
  };

  // Renderiza una celda individual
  const renderCell = (cell, rowIndex, colIndex) => {
    let cellClass = `${CELL_COLORS[cell.type]} border border-gray-700 flex items-center justify-center w-8 h-8 text-xs`;
    let icon = CELL_ICONS[cell.type] || null;
    let content = cell.energyCost;
    
    // Si la celda está en la solución y la estamos mostrando
    const isSolutionCell = solution.some(([r, c], index) => 
      r === rowIndex && c === colIndex && index <= currentStepIndex
    );
    
    // Si es la celda actual en la animación
    const isCurrentCell = solution[currentStepIndex] && 
      solution[currentStepIndex][0] === rowIndex && 
      solution[currentStepIndex][1] === colIndex;
    
    if (isCurrentCell) {
      cellClass = `${CELL_COLORS['current']} border border-gray-700 flex items-center justify-center w-8 h-8 text-xs`;
      icon = <Rocket size={16} />;
    } else if (isSolutionCell && currentStepIndex >= 0) {
      cellClass = `${CELL_COLORS['path']} border border-gray-700 flex items-center justify-center w-8 h-8 text-xs`;
    }

    // No mostramos el costo en ciertas celdas especiales
    if (cell.type !== CELL_TYPES.NORMAL && cell.type !== CELL_TYPES.REQUIRED_CHARGE) {
      content = null;
    }

    return (
      <div key={`${rowIndex}-${colIndex}`} className={cellClass}>
        {icon}
        {content}
      </div>
    );
  };

  // Renderiza la matriz del universo
  const renderUniverse = () => {
    return (
      <div className="max-h-96 overflow-auto p-2 bg-gray-900 rounded">
        <div className="grid grid-flow-row auto-rows-max gap-0">
          {universe.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderiza la leyenda
  const renderLegend = () => {
    const legendItems = [
      { type: CELL_TYPES.START, label: 'Origen' },
      { type: CELL_TYPES.END, label: 'Destino' },
      { type: CELL_TYPES.BLACK_HOLE, label: 'Agujero negro' },
      { type: CELL_TYPES.GIANT_STAR, label: 'Estrella gigante' },
      { type: CELL_TYPES.PORTAL_IN, label: 'Portal entrada' },
      { type: CELL_TYPES.PORTAL_OUT, label: 'Portal salida' },
      { type: CELL_TYPES.WORMHOLE_IN, label: 'Agujero de gusano entrada' },
      { type: CELL_TYPES.WORMHOLE_OUT, label: 'Agujero de gusano salida' },
      { type: CELL_TYPES.RECHARGE_ZONE, label: 'Zona de recarga' },
      { type: CELL_TYPES.REQUIRED_CHARGE, label: 'Requiere carga' },
      { type: 'path', label: 'Camino' },
      { type: 'current', label: 'Posición actual' }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
        {legendItems.map(item => (
          <div key={item.type} className="flex items-center space-x-2">
            <div className={`${CELL_COLORS[item.type]} w-4 h-4 rounded`}></div>
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // Renderiza la información de estado y energía
  const renderStatusInfo = () => {
    let statusMessage = '';
    let statusIcon = null;

    switch (status) {
      case 'waiting':
        statusMessage = 'Esperando carga de datos y búsqueda';
        statusIcon = <AlertCircle className="text-yellow-500" size={20} />;
        break;
      case 'solving':
        statusMessage = 'Buscando solución...';
        statusIcon = <Loader className="text-blue-500 animate-spin" size={20} />;
        break;
      case 'solved':
        statusMessage = `¡Solución encontrada! (${solution.length} pasos)`;
        statusIcon = <Check className="text-green-500" size={20} />;
        break;
      case 'noSolution':
        statusMessage = 'No se encontró solución';
        statusIcon = <X className="text-red-500" size={20} />;
        break;
    }

    // Mostrar energía actual si estamos en la animación
    let energyDisplay = null;
    if (status === 'solved' && currentStepIndex >= 0) {
      const currentEnergy = energyLog[currentStepIndex];
      energyDisplay = (
        <div className="flex items-center space-x-2 ml-4">
          <Battery size={20} className="text-green-400" />
          <span>Energía: {currentEnergy}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center mb-4 p-2 bg-gray-800 rounded">
        <div className="flex items-center space-x-2">
          {statusIcon}
          <span>{statusMessage}</span>
        </div>
        {energyDisplay}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Explorador Galáctico</h1>
      
      {/* Panel de control */}
      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Cargar JSON
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
        
        <button
          onClick={loadExampleJson}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Cargar Ejemplo
        </button>
        
        <button
          onClick={findSolution}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          disabled={!universeData || status === 'solving' || isLoading}
        >
          Buscar Solución
        </button>
      </div>
      
      {/* Estado y controles de animación */}
      {renderStatusInfo()}
      
      {status === 'solved' && (
        <div className="flex gap-4 mb-4">
          <button
            onClick={prevStep}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            disabled={currentStepIndex <= 0}
          >
            Paso Anterior
          </button>
          <button
            onClick={nextStep}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            disabled={currentStepIndex >= solution.length - 1}
          >
            Siguiente Paso
          </button>
          <button
            onClick={resetAnimation}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Reiniciar Animación
          </button>
        </div>
      )}
      
      {/* Universo y leyenda */}
      {universe.length > 0 && (
        <>
          {renderUniverse()}
          {renderLegend()}
        </>
      )}
      
      {isLoading && (
        <div className="flex justify-center items-center mt-4">
          <Loader className="animate-spin text-blue-500" size={24} />
          <span className="ml-2">Cargando...</span>
        </div>
      )}
    </div>
  );
}