import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Check,
  Rocket,
  Star,
  ArrowRight,
  Battery,
  Zap,
  X,
  Circle,
  Loader,
} from "lucide-react";

// Valores constantes para los tipos de celda
const CELL_TYPES = {
  NORMAL: "normal",
  START: "start",
  END: "end",
  BLACK_HOLE: "blackHole",
  GIANT_STAR: "giantStar",
  PORTAL_IN: "portalIn",
  PORTAL_OUT: "portalOut",
  WORMHOLE_IN: "wormholeIn",
  WORMHOLE_OUT: "wormholeOut",
  RECHARGE_ZONE: "rechargeZone",
  REQUIRED_CHARGE: "requiredCharge",
};

// Colores para los tipos de celda
const CELL_COLORS = {
  [CELL_TYPES.NORMAL]: "bg-gray-800",
  [CELL_TYPES.START]: "bg-green-600",
  [CELL_TYPES.END]: "bg-red-600",
  [CELL_TYPES.BLACK_HOLE]: "bg-black",
  [CELL_TYPES.GIANT_STAR]: "bg-yellow-300",
  [CELL_TYPES.PORTAL_IN]: "bg-blue-500",
  [CELL_TYPES.PORTAL_OUT]: "bg-blue-700",
  [CELL_TYPES.WORMHOLE_IN]: "bg-purple-500",
  [CELL_TYPES.WORMHOLE_OUT]: "bg-purple-700",
  [CELL_TYPES.RECHARGE_ZONE]: "bg-green-400",
  [CELL_TYPES.REQUIRED_CHARGE]: "bg-orange-500",
  path: "bg-green-300",
  current: "bg-blue-300",
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
  [CELL_TYPES.REQUIRED_CHARGE]: <Zap size={16} />,
};

// Componente principal
export default function GalacticExplorer() {
  const [universeData, setUniverseData] = useState(null);
  const [universe, setUniverse] = useState([]);
  const [solution, setSolution] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [status, setStatus] = useState("waiting"); // waiting, solving, solved, noSolution
  const [energyLog, setEnergyLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const fileInputRef = useRef(null);
  const autoPlayIntervalRef = useRef(null);

  // Ejemplo de JSON para cargar
  const exampleJson = {
    matriz: { filas: 10, columnas: 10 },
    origen: [0, 0],
    destino: [9, 9],
    agujerosNegros: [
      [3, 5],
      [2, 2],
      [8, 8],
    ],
    estrellasGigantes: [
      [7, 7],
      [4, 4],
      [1, 8],
    ],
    portales: [{ desde: [5, 5], hasta: [8, 2] }],
    agujerosGusano: [{ entrada: [1, 1], salida: [3, 3] }],
    zonasRecarga: [
      [4, 6, 2],
      [5, 8, 3],
    ],
    celdasCargaRequerida: [{ coordenada: [6, 6], cargaGastada: 30 }],
    cargaInicial: 100,
    matrizInicial: Array(10)
      .fill()
      .map(() =>
        Array(10)
          .fill()
          .map(() => Math.floor(Math.random() * 10) + 1)
      ),
  };

  // Carga el ejemplo JSON
  const loadExampleJson = () => {
    processUniverseData(exampleJson);
  };

  // Procesa el archivo JSON subido
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Por favor, selecciona un archivo JSON");
      return;
    }

    if (!file.name.endsWith(".json")) {
      alert("El archivo debe tener extensión .json");
      return;
    }

    setIsLoading(true);
    setStatus("waiting");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validar la estructura del JSON
        if (!data.matriz || !data.origen || !data.destino) {
          throw new Error("El archivo JSON no tiene la estructura correcta");
        }

        processUniverseData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al procesar el archivo JSON:", error);
        alert("Error al procesar el archivo JSON: " + error.message);
        setIsLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("Error al leer el archivo:", error);
      alert("Error al leer el archivo: " + error.message);
      setIsLoading(false);
    };

    try {
      reader.readAsText(file);
    } catch (error) {
      console.error("Error al iniciar la lectura del archivo:", error);
      alert("Error al iniciar la lectura del archivo: " + error.message);
      setIsLoading(false);
    }
  };

  // Procesa los datos del universo y crea la matriz
  const processUniverseData = (data) => {
    setUniverseData(data);
    const { filas, columnas } = data.matriz;

    // Crear matriz base con costes de energía
    const newUniverse = Array(filas)
      .fill()
      .map((_, rowIndex) =>
        Array(columnas)
          .fill()
          .map((_, colIndex) => ({
            type: CELL_TYPES.NORMAL,
            row: rowIndex,
            col: colIndex,
            energyCost: data.matrizInicial[rowIndex][colIndex] || 1,
            additionalInfo: {},
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
    data.portales.forEach((portal) => {
      const [fromRow, fromCol] = portal.desde;
      const [toRow, toCol] = portal.hasta;
      if (
        fromRow < filas &&
        fromCol < columnas &&
        toRow < filas &&
        toCol < columnas
      ) {
        newUniverse[fromRow][fromCol].type = CELL_TYPES.PORTAL_IN;
        newUniverse[fromRow][fromCol].additionalInfo = {
          destination: [toRow, toCol],
        };
        newUniverse[toRow][toCol].type = CELL_TYPES.PORTAL_OUT;
      }
    });

    // Añadir agujeros de gusano
    data.agujerosGusano.forEach((wormhole) => {
      const [inRow, inCol] = wormhole.entrada;
      const [outRow, outCol] = wormhole.salida;
      if (
        inRow < filas &&
        inCol < columnas &&
        outRow < filas &&
        outCol < columnas
      ) {
        newUniverse[inRow][inCol].type = CELL_TYPES.WORMHOLE_IN;
        newUniverse[inRow][inCol].additionalInfo = {
          destination: [outRow, outCol],
          used: false,
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
    data.celdasCargaRequerida.forEach((cell) => {
      const [row, col] = cell.coordenada;
      if (row < filas && col < columnas) {
        newUniverse[row][col].type = CELL_TYPES.REQUIRED_CHARGE;
        newUniverse[row][col].additionalInfo = {
          requiredCharge: cell.cargaGastada,
        };
      }
    });

    setUniverse(newUniverse);
    setSolution([]);
    setCurrentStepIndex(-1);
    setStatus("waiting");
    setEnergyLog([]);
  };

  // Inicia la búsqueda de la solución
  // Reemplaza la función findSolution() existente
  const findSolution = async () => {
  if (!universeData) return;

  setStatus('solving');
  setSolution([]);
  setCurrentStepIndex(-1);
  setEnergyLog([]);

  try {
    const response = await fetch('http://localhost:5000/find_path', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(universeData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      setSolution(result.path);
      setEnergyLog(result.energy_log);
      setStatus('solved');
      console.log(`Solución encontrada en ${result.computation_time.toFixed(3)} segundos`);
    } else {
      setStatus('noSolution');
      console.log('No se encontró solución');
    }

  } catch (error) {
    console.error('Error al comunicarse con el backend:', error);
    setStatus('noSolution');
    // Mostrar mensaje de error al usuario
    alert('Error al comunicarse con el servidor. Asegúrate de que el backend esté ejecutándose en el puerto 5000.');
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

  // Función para iniciar la animación automática
  const startAutoPlay = () => {
    if (!isAutoPlaying && currentStepIndex < solution.length - 1) {
      setIsAutoPlaying(true);
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          if (prevIndex >= solution.length - 1) {
            clearInterval(autoPlayIntervalRef.current);
            setIsAutoPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 500); // Intervalo de 500ms entre cada paso
    }
  };

  // Función para detener la animación automática
  const stopAutoPlay = () => {
    if (isAutoPlaying) {
      clearInterval(autoPlayIntervalRef.current);
      setIsAutoPlaying(false);
    }
  };

  // Limpiar el intervalo cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, []);

  // Detener la animación automática cuando se reinicia
  const resetAnimation = () => {
    stopAutoPlay();
    setCurrentStepIndex(-1);
  };

  // Renderiza una celda individual
  const renderCell = (cell, rowIndex, colIndex) => {
    let cellClass = `${CELL_COLORS[cell.type]} border border-gray-700 flex items-center justify-center w-8 h-8 text-xs`;
    let icon = CELL_ICONS[cell.type] || null;
    let content = cell.energyCost;

    // Si la celda está en la solución y la estamos mostrando
    const isSolutionCell = solution.some(
      ([r, c], index) =>
        r === rowIndex && c === colIndex && index <= currentStepIndex
    );

    // Si es la celda actual en la animación
    const isCurrentCell =
      solution[currentStepIndex] &&
      solution[currentStepIndex][0] === rowIndex &&
      solution[currentStepIndex][1] === colIndex;

    if (isCurrentCell) {
      cellClass = `${CELL_COLORS["current"]} border border-gray-700 flex items-center justify-center w-8 h-8 text-xs`;
      icon = <Rocket size={16} />;
    } else if (isSolutionCell && currentStepIndex >= 0) {
      cellClass = `${CELL_COLORS["path"]} border border-gray-700 flex items-center justify-center w-8 h-8 text-xs`;
    }

    // No mostramos el costo en ciertas celdas especiales
    if (
      cell.type !== CELL_TYPES.NORMAL &&
      cell.type !== CELL_TYPES.REQUIRED_CHARGE
    ) {
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
              {row.map((cell, colIndex) =>
                renderCell(cell, rowIndex, colIndex)
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderiza la leyenda
  const renderLegend = () => {
    const legendItems = [
      { type: CELL_TYPES.START, label: "Origen" },
      { type: CELL_TYPES.END, label: "Destino" },
      { type: CELL_TYPES.BLACK_HOLE, label: "Agujero negro" },
      { type: CELL_TYPES.GIANT_STAR, label: "Estrella gigante" },
      { type: CELL_TYPES.PORTAL_IN, label: "Portal entrada" },
      { type: CELL_TYPES.PORTAL_OUT, label: "Portal salida" },
      { type: CELL_TYPES.WORMHOLE_IN, label: "Agujero de gusano entrada" },
      { type: CELL_TYPES.WORMHOLE_OUT, label: "Agujero de gusano salida" },
      { type: CELL_TYPES.RECHARGE_ZONE, label: "Zona de recarga" },
      { type: CELL_TYPES.REQUIRED_CHARGE, label: "Requiere carga" },
      { type: "path", label: "Camino" },
      { type: "current", label: "Posición actual" },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4 text-gray-300">
        {legendItems.map((item) => (
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
    let statusMessage = "";
    let statusIcon = null;

    switch (status) {
      case "waiting":
        statusMessage = "Esperando carga de datos y búsqueda";
        statusIcon = <AlertCircle className="text-yellow-500" size={20} />;
        break;
      case "solving":
        statusMessage = "Buscando solución...";
        statusIcon = (
          <Loader className="text-blue-500 animate-spin" size={20} />
        );
        break;
      case "solved":
        statusMessage = `¡Solución encontrada! (${solution.length} pasos)`;
        statusIcon = <Check className="text-green-500" size={20} />;
        break;
      case "noSolution":
        statusMessage = "No se encontró solución";
        statusIcon = <X className="text-red-500" size={20} />;
        break;
    }

    // Mostrar energía actual si estamos en la animación
    let energyDisplay = null;
    if (status === "solved" && currentStepIndex >= 0) {
      const currentEnergy = energyLog[currentStepIndex];
      energyDisplay = (
        <div className="flex items-center space-x-2 ml-4">
          <Battery size={20} className="text-green-400" />
          <span>Energía: {currentEnergy}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center mb-4 p-2 bg-gray-800 rounded text-white">
        <div className="flex items-center space-x-2">
          {statusIcon}
          <span>{statusMessage}</span>
        </div>
        {energyDisplay}
      </div>
    );
  };

  // Función para generar un mapa aleatorio
  const generateRandomMap = () => {
    const filas = 10;
    const columnas = 10;

    const randomCoord = () => [
      Math.floor(Math.random() * filas),
      Math.floor(Math.random() * columnas),
    ];

    const isCoordTaken = (coord, takenCoords) => {
      return takenCoords.some(([x, y]) => x === coord[0] && y === coord[1]);
    };

    const getRandomUniqueCoord = (takenCoords) => {
      let coord;
      do {
        coord = randomCoord();
      } while (isCoordTaken(coord, takenCoords));
      return coord;
    };

    // Coordenadas ocupadas
    const takenCoords = [];

    // Generar origen y destino
    const origen = [0, 0];
    const destino = [filas - 1, columnas - 1];
    takenCoords.push(origen, destino);

    // Generar agujeros negros (3-5)
    const numAgujerosNegros = Math.floor(Math.random() * 3) + 3;
    const agujerosNegros = [];
    for (let i = 0; i < numAgujerosNegros; i++) {
      const coord = getRandomUniqueCoord(takenCoords);
      agujerosNegros.push(coord);
      takenCoords.push(coord);
    }

    // Generar estrellas gigantes (2-4)
    const numEstrellasGigantes = Math.floor(Math.random() * 3) + 2;
    const estrellasGigantes = [];
    for (let i = 0; i < numEstrellasGigantes; i++) {
      const coord = getRandomUniqueCoord(takenCoords);
      estrellasGigantes.push(coord);
      takenCoords.push(coord);
    }

    // Generar portales (1-2 pares)
    const numPortales = Math.floor(Math.random() * 2) + 1;
    const portales = [];
    for (let i = 0; i < numPortales; i++) {
      const desde = getRandomUniqueCoord(takenCoords);
      const hasta = getRandomUniqueCoord(takenCoords);
      portales.push({ desde, hasta });
      takenCoords.push(desde, hasta);
    }

    // Generar agujeros de gusano (1-2 pares)
    const numGusanos = Math.floor(Math.random() * 2) + 1;
    const agujerosGusano = [];
    for (let i = 0; i < numGusanos; i++) {
      const entrada = getRandomUniqueCoord(takenCoords);
      const salida = getRandomUniqueCoord(takenCoords);
      agujerosGusano.push({ entrada, salida });
      takenCoords.push(entrada, salida);
    }

    // Generar zonas de recarga (2-4)
    const numZonasRecarga = Math.floor(Math.random() * 3) + 2;
    const zonasRecarga = [];
    for (let i = 0; i < numZonasRecarga; i++) {
      const coord = getRandomUniqueCoord(takenCoords);
      const multiplier = Math.floor(Math.random() * 3) + 1;
      zonasRecarga.push([...coord, multiplier]);
      takenCoords.push(coord);
    }

    // Generar matriz de costes de energía
    const matrizInicial = Array(filas)
      .fill()
      .map(() =>
        Array(columnas)
          .fill()
          .map(() => Math.floor(Math.random() * 10) + 1)
      );

    const randomMap = {
      matriz: { filas, columnas },
      origen,
      destino,
      agujerosNegros,
      estrellasGigantes,
      portales,
      agujerosGusano,
      zonasRecarga,
      celdasCargaRequerida: [],
      cargaInicial: 50,
      matrizInicial,
    };

    processUniverseData(randomMap);
    setStatus("waiting");
    setSolution([]);
    setCurrentStepIndex(-1);
    setEnergyLog([]);
  };

  return (
    <div className="container mx-auto p-4 bg-gray-900 text-white min-h-screen">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Cargar JSON
          </button>
          <button
            onClick={loadExampleJson}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Cargar Ejemplo
          </button>
          <button
            onClick={generateRandomMap}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Generar Mapa Aleatorio
          </button>
          {universe.length > 0 && (
            <button
              onClick={findSolution}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              disabled={status === "solving"}
            >
              Buscar Solución
            </button>
          )}
        </div>

        {/* Estado y controles de animación */}
        {renderStatusInfo()}

        {status === "solved" && (
          <div className="flex gap-4 mb-4">
            <button
              onClick={prevStep}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded"
              disabled={currentStepIndex <= 0 || isAutoPlaying}
            >
              Paso Anterior
            </button>
            <button
              onClick={nextStep}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded"
              disabled={
                currentStepIndex >= solution.length - 1 || isAutoPlaying
              }
            >
              Siguiente Paso
            </button>
            <button
              onClick={resetAnimation}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Reiniciar Animación
            </button>
            <button
              onClick={isAutoPlaying ? stopAutoPlay : startAutoPlay}
              className={`${isAutoPlaying ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white px-4 py-2 rounded`}
              disabled={currentStepIndex >= solution.length - 1}
            >
              {isAutoPlaying ? "Detener Auto" : "Reproducir Auto"}
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
          <div className="flex justify-center items-center mt-4 text-white">
            <Loader className="animate-spin text-blue-500" size={24} />
            <span className="ml-2">Cargando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
