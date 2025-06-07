from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import sys
from typing import List, Tuple, Dict, Any, Optional, Set
import time

app = Flask(__name__)
CORS(app)  # Permite requests desde React

# Tipos de celdas (equivalentes a los del frontend)
CELL_TYPES = {
    'NORMAL': 'normal',
    'START': 'start',
    'END': 'end',
    'BLACK_HOLE': 'blackHole',
    'GIANT_STAR': 'giantStar',
    'PORTAL_IN': 'portalIn',
    'PORTAL_OUT': 'portalOut',
    'WORMHOLE_IN': 'wormholeIn',
    'WORMHOLE_OUT': 'wormholeOut',
    'RECHARGE_ZONE': 'rechargeZone',
    'REQUIRED_CHARGE': 'requiredCharge'
}

class UniverseCell:
    def __init__(self, row: int, col: int, cell_type: str = CELL_TYPES['NORMAL'], 
                 energy_cost: int = 1, additional_info: Dict = None):
        self.row = row
        self.col = col
        self.type = cell_type
        self.energy_cost = energy_cost
        self.additional_info = additional_info or {}

class GalacticPathfinder:
    def __init__(self, universe_data: Dict):
        self.universe_data = universe_data
        self.universe = self._create_universe()
        self.start_pos = tuple(universe_data['origen'])
        self.end_pos = tuple(universe_data['destino'])
        self.initial_energy = universe_data['cargaInicial']
        
    def _create_universe(self) -> List[List[UniverseCell]]:
        """Crea la matriz del universo basada en los datos"""
        data = self.universe_data
        filas, columnas = data['matriz']['filas'], data['matriz']['columnas']
        
        # Crear matriz base
        universe = []
        for row in range(filas):
            universe_row = []
            for col in range(columnas):
                energy_cost = data['matrizInicial'][row][col]
                cell = UniverseCell(row, col, CELL_TYPES['NORMAL'], energy_cost)
                universe_row.append(cell)
            universe.append(universe_row)
        
        # Configurar origen y destino
        start_row, start_col = data['origen']
        end_row, end_col = data['destino']
        universe[start_row][start_col].type = CELL_TYPES['START']
        universe[end_row][end_col].type = CELL_TYPES['END']
        
        # Añadir agujeros negros
        for row, col in data['agujerosNegros']:
            if 0 <= row < filas and 0 <= col < columnas:
                universe[row][col].type = CELL_TYPES['BLACK_HOLE']
        
        # Añadir estrellas gigantes
        for row, col in data['estrellasGigantes']:
            if 0 <= row < filas and 0 <= col < columnas:
                universe[row][col].type = CELL_TYPES['GIANT_STAR']
        
        # Añadir portales
        for portal in data['portales']:
            from_row, from_col = portal['desde']
            to_row, to_col = portal['hasta']
            if (0 <= from_row < filas and 0 <= from_col < columnas and 
                0 <= to_row < filas and 0 <= to_col < columnas):
                universe[from_row][from_col].type = CELL_TYPES['PORTAL_IN']
                universe[from_row][from_col].additional_info = {'destination': [to_row, to_col]}
                universe[to_row][to_col].type = CELL_TYPES['PORTAL_OUT']
        
        # Añadir agujeros de gusano
        for wormhole in data['agujerosGusano']:
            in_row, in_col = wormhole['entrada']
            out_row, out_col = wormhole['salida']
            if (0 <= in_row < filas and 0 <= in_col < columnas and 
                0 <= out_row < filas and 0 <= out_col < columnas):
                universe[in_row][in_col].type = CELL_TYPES['WORMHOLE_IN']
                universe[in_row][in_col].additional_info = {
                    'destination': [out_row, out_col],
                    'used': False
                }
                universe[out_row][out_col].type = CELL_TYPES['WORMHOLE_OUT']
        
        # Añadir zonas de recarga
        for row, col, multiplier in data['zonasRecarga']:
            if 0 <= row < filas and 0 <= col < columnas:
                universe[row][col].type = CELL_TYPES['RECHARGE_ZONE']
                universe[row][col].additional_info = {'multiplier': multiplier}
        
        # Añadir celdas con carga requerida
        for cell_info in data['celdasCargaRequerida']:
            row, col = cell_info['coordenada']
            if 0 <= row < filas and 0 <= col < columnas:
                universe[row][col].type = CELL_TYPES['REQUIRED_CHARGE']
                universe[row][col].additional_info = {
                    'requiredCharge': cell_info['cargaGastada']
                }
        
        return universe
    
    def _manhattan_distance(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> int:
        """Calcula la distancia Manhattan entre dos posiciones"""
        return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])
    
    def _get_neighbors(self, row: int, col: int) -> List[Tuple[int, int]]:
        """Obtiene las posiciones vecinas válidas"""
        neighbors = []
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]  # arriba, abajo, izquierda, derecha
        
        for dr, dc in directions:
            new_row, new_col = row + dr, col + dc
            if (0 <= new_row < len(self.universe) and 
                0 <= new_col < len(self.universe[0])):
                neighbors.append((new_row, new_col))
        
        return neighbors
    
    def _can_destroy_black_hole(self, current_pos: Tuple[int, int], 
                               black_hole_pos: Tuple[int, int]) -> bool:
        """Verifica si se puede destruir un agujero negro desde una estrella gigante"""
        curr_row, curr_col = current_pos
        return self.universe[curr_row][curr_col].type == CELL_TYPES['GIANT_STAR']
    
    def find_path(self) -> Tuple[Optional[List[Tuple[int, int]]], Optional[List[int]]]:
        """
        Encuentra el camino usando backtracking optimizado con poda
        Retorna: (path, energy_log) o (None, None) si no hay solución
        """
        max_iterations = len(self.universe) * len(self.universe[0]) * 10
        
        def backtrack(row: int, col: int, energy: int, 
                     visited: Set[Tuple[int, int]], path: List[Tuple[int, int]], 
                     energy_log: List[int], depth: int = 0) -> bool:
            
            # Límite de profundidad para evitar loops infinitos
            if depth > max_iterations:
                return False
            
            current_pos = (row, col)
            
            # Si ya visitamos esta posición, retornar False
            if current_pos in visited:
                return False
            
            current_cell = self.universe[row][col]
            
            # Verificar agujero negro
            if current_cell.type == CELL_TYPES['BLACK_HOLE']:
                # Verificar si podemos destruirlo con una estrella gigante
                if len(path) > 0:
                    last_pos = path[-1]
                    if self._can_destroy_black_hole(last_pos, current_pos):
                        # Continuamos, el agujero negro es destruido
                        pass
                    else:
                        return False
                else:
                    return False
            
            # Verificar carga requerida
            if current_cell.type == CELL_TYPES['REQUIRED_CHARGE']:
                required_charge = current_cell.additional_info.get('requiredCharge', 0)
                if energy < required_charge:
                    return False
            
            # Calcular nueva energía
            new_energy = energy
            
            if current_cell.type == CELL_TYPES['RECHARGE_ZONE']:
                # Zona de recarga multiplica la energía
                multiplier = current_cell.additional_info.get('multiplier', 1)
                new_energy *= multiplier
            else:
                # Gastar energía normal
                new_energy -= current_cell.energy_cost
            
            # Si nos quedamos sin energía, no podemos continuar
            if new_energy <= 0:
                return False
            
            # Añadir posición actual al camino
            path.append(current_pos)
            energy_log.append(new_energy)
            visited.add(current_pos)
            
            # Verificar si llegamos al destino
            if current_pos == self.end_pos:
                return True
            
            # Manejar portales (movimiento obligatorio)
            if current_cell.type == CELL_TYPES['PORTAL_IN']:
                dest = current_cell.additional_info.get('destination')
                if dest:
                    dest_row, dest_col = dest
                    if backtrack(dest_row, dest_col, new_energy, visited.copy(), 
                               path, energy_log, depth + 1):
                        return True
                # Si el portal no lleva a una solución, retroceder
                path.pop()
                energy_log.pop()
                return False
            
            # Manejar agujeros de gusano (movimiento obligatorio, uso único)
            if (current_cell.type == CELL_TYPES['WORMHOLE_IN'] and 
                not current_cell.additional_info.get('used', False)):
                
                dest = current_cell.additional_info.get('destination')
                if dest:
                    # Marcar como usado
                    current_cell.additional_info['used'] = True
                    dest_row, dest_col = dest
                    
                    if backtrack(dest_row, dest_col, new_energy, visited.copy(), 
                               path, energy_log, depth + 1):
                        return True
                    
                    # Si no funciona, desmarcar y retroceder
                    current_cell.additional_info['used'] = False
                
                path.pop()
                energy_log.pop()
                return False
            
            # Explorar vecinos con heurística
            neighbors = self._get_neighbors(row, col)
            
            # Ordenar vecinos por distancia Manhattan al destino + costo de energía
            def neighbor_score(pos):
                n_row, n_col = pos
                distance = self._manhattan_distance(pos, self.end_pos)
                energy_cost = self.universe[n_row][n_col].energy_cost
                return distance + energy_cost * 0.1  # Peso menor al costo de energía
            
            neighbors.sort(key=neighbor_score)
            
            # Explorar cada vecino
            for neighbor_pos in neighbors:
                n_row, n_col = neighbor_pos
                
                # Crear copias para el backtracking
                new_visited = visited.copy()
                
                if backtrack(n_row, n_col, new_energy, new_visited, 
                           path, energy_log, depth + 1):
                    return True
            
            # Si no encontramos solución, retroceder
            path.pop()
            energy_log.pop()
            return False
        
        # Iniciar búsqueda
        start_row, start_col = self.start_pos
        path = []
        energy_log = []
        visited = set()
        
        try:
            if backtrack(start_row, start_col, self.initial_energy, 
                        visited, path, energy_log):
                return path, energy_log
            else:
                return None, None
        except RecursionError:
            print("Error: Máxima recursión alcanzada")
            return None, None
        except Exception as e:
            print(f"Error durante la búsqueda: {e}")
            return None, None

@app.route('/find_path', methods=['POST'])
def find_path():
    """Endpoint para encontrar el camino"""
    try:
        # Obtener datos del request
        universe_data = request.json
        
        if not universe_data:
            return jsonify({'error': 'No se proporcionaron datos'}), 400
        
        # Validar estructura básica
        required_fields = ['matriz', 'origen', 'destino', 'cargaInicial', 'matrizInicial']
        for field in required_fields:
            if field not in universe_data:
                return jsonify({'error': f'Campo requerido faltante: {field}'}), 400
        
        # Crear pathfinder y buscar solución
        pathfinder = GalacticPathfinder(universe_data)
        
        start_time = time.time()
        path, energy_log = pathfinder.find_path()
        end_time = time.time()
        
        if path is not None:
            return jsonify({
                'success': True,
                'path': path,
                'energy_log': energy_log,
                'computation_time': end_time - start_time,
                'steps': len(path)
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No se encontró solución',
                'computation_time': end_time - start_time
            })
    
    except Exception as e:
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de verificación de salud"""
    return jsonify({'status': 'OK', 'message': 'Servidor funcionando correctamente'})

if __name__ == '__main__':
    print("Iniciando servidor de pathfinding...")
    print("Servidor disponible en: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)