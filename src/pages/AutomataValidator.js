import React, { useState } from 'react';
import { CheckCircle, XCircle, Package, Car } from 'lucide-react';

const AutomataValidator = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [trackingValid, setTrackingValid] = useState(null);
  const [plateValid, setPlateValid] = useState(null);
  const [trackingSteps, setTrackingSteps] = useState([]);
  const [plateSteps, setPlateSteps] = useState([]);

  // Autómata para código de seguimiento logístico internacional
  // Estados: 0=inicial, 1=primera_letra, 2=segunda_letra, 3-11=dígitos, 12=letra_final, 13=aceptado
  const trackingAutomaton = (input) => {
    let state = 0;
    let steps = [];
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const prevState = state;
      
      switch (state) {
        case 0: // Estado inicial - esperando primera letra
          if (/[A-Z]/.test(char)) {
            state = 1;
            steps.push(`Carácter '${char}' en posición ${i+1}: Primera letra válida (A-Z) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba letra mayúscula → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 1: // Esperando segunda letra
          if (/[A-Z]/.test(char)) {
            state = 2;
            steps.push(`Carácter '${char}' en posición ${i+1}: Segunda letra válida (A-Z) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba segunda letra mayúscula → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 2: case 3: case 4: case 5: case 6: case 7: case 8: case 9: case 10: // Esperando dígitos (posiciones 3-11)
          if (/[0-9]/.test(char)) {
            state++;
            steps.push(`Carácter '${char}' en posición ${i+1}: Dígito válido (0-9) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba dígito → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 11: // Esperando letra final (posición 12)
          if (/[A-Z]/.test(char)) {
            state = 12;
            steps.push(`Carácter '${char}' en posición ${i+1}: Letra final válida (A-Z) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba letra final mayúscula → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        default:
          steps.push(`Carácter '${char}' en posición ${i+1}: Error - Carácter extra no permitido → Estado inválido`);
          return { valid: false, steps };
      }
    }
    
    // Verificar si llegamos al estado final correcto
    if (state === 12 && input.length === 12) {
      steps.push(`✓ Autómata completado exitosamente - Código válido`);
      return { valid: true, steps };
    } else {
      steps.push(`✗ Longitud incorrecta o estado final inválido - Se esperaban 12 caracteres, se recibieron ${input.length}`);
      return { valid: false, steps };
    }
  };

  // Autómata para placa vehicular con formato extendido ABC-1234-Q
  // Estados: 0=inicial, 1=primera_letra, 2=segunda_letra, 3=tercera_letra, 4=primer_guion, 
  //         5-8=dígitos, 9=segundo_guion, 10=letra_tipo, 11=aceptado
  const plateAutomaton = (input) => {
    let state = 0;
    let steps = [];
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      switch (state) {
        case 0: // Estado inicial - esperando primera letra
          if (/[A-Z]/.test(char)) {
            state = 1;
            steps.push(`Carácter '${char}' en posición ${i+1}: Primera letra válida (A-Z) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba primera letra mayúscula → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 1: // Esperando segunda letra
          if (/[A-Z]/.test(char)) {
            state = 2;
            steps.push(`Carácter '${char}' en posición ${i+1}: Segunda letra válida (A-Z) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba segunda letra mayúscula → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 2: // Esperando tercera letra
          if (/[A-Z]/.test(char)) {
            state = 3;
            steps.push(`Carácter '${char}' en posición ${i+1}: Tercera letra válida (A-Z) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba tercera letra mayúscula → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 3: // Esperando primer guion
          if (char === '-') {
            state = 4;
            steps.push(`Carácter '${char}' en posición ${i+1}: Primer guion válido → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba guion (-) → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 4: case 5: case 6: case 7: // Esperando dígitos
          if (/[0-9]/.test(char)) {
            state++;
            const digitNum = state - 4;
            steps.push(`Carácter '${char}' en posición ${i+1}: Dígito ${digitNum} válido (0-9) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba dígito → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 8: // Esperando segundo guion
          if (char === '-') {
            state = 9;
            steps.push(`Carácter '${char}' en posición ${i+1}: Segundo guion válido → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba segundo guion (-) → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        case 9: // Esperando letra de tipo de vehículo
          if (/[A-Z]/.test(char)) {
            state = 10;
            steps.push(`Carácter '${char}' en posición ${i+1}: Letra tipo de vehículo válida (A-Z) → Estado ${state}`);
          } else {
            steps.push(`Carácter '${char}' en posición ${i+1}: Error - Se esperaba letra tipo de vehículo → Estado inválido`);
            return { valid: false, steps };
          }
          break;
          
        default:
          steps.push(`Carácter '${char}' en posición ${i+1}: Error - Carácter extra no permitido → Estado inválido`);
          return { valid: false, steps };
      }
    }
    
    // Verificar si llegamos al estado final correcto
    if (state === 10 && input.length === 10) {
      steps.push(`✓ Autómata completado exitosamente - Placa válida`);
      return { valid: true, steps };
    } else {
      steps.push(`✗ Longitud incorrecta o estado final inválido - Se esperaban 10 caracteres, se recibieron ${input.length}`);
      return { valid: false, steps };
    }
  };

  const validateTracking = (value) => {
    const upperValue = value.toUpperCase();
    const result = trackingAutomaton(upperValue);
    setTrackingValid(result.valid);
    setTrackingSteps(result.steps);
  };

  const validatePlate = (value) => {
    const upperValue = value.toUpperCase();
    const result = plateAutomaton(upperValue);
    setPlateValid(result.valid);
    setPlateSteps(result.steps);
  };

  const handleTrackingChange = (e) => {
    const value = e.target.value;
    setTrackingCode(value);
    if (value.length > 0) {
      validateTracking(value);
    } else {
      setTrackingValid(null);
      setTrackingSteps([]);
    }
  };

  const handlePlateChange = (e) => {
    const value = e.target.value;
    setLicensePlate(value);
    if (value.length > 0) {
      validatePlate(value);
    } else {
      setPlateValid(null);
      setPlateSteps([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Validador con Autómatas Finitos
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Campo 1: Código de Seguimiento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">
                Código de Seguimiento Logístico
              </h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
              <p><strong>Formato:</strong> 2 letras + 9 dígitos + 1 letra final</p>
              <p><strong>Ejemplo:</strong> BR123456789Z</p>
              <p><strong>Total:</strong> 12 caracteres</p>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={trackingCode}
                onChange={handleTrackingChange}
                placeholder="Ej: BR123456789Z"
                className={`w-full p-3 border-2 rounded-lg font-mono text-lg ${
                  trackingValid === null ? 'border-gray-300' :
                  trackingValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
                maxLength={15}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {trackingValid === true && <CheckCircle className="text-green-500" size={20} />}
                {trackingValid === false && <XCircle className="text-red-500" size={20} />}
              </div>
            </div>
            
            {trackingSteps.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                <h3 className="font-semibold mb-2 text-gray-800">Proceso del Autómata:</h3>
                <div className="space-y-1">
                  {trackingSteps.map((step, index) => (
                    <div key={index} className={`text-sm p-2 rounded ${
                      step.includes('Error') || step.includes('✗') ? 'bg-red-100 text-red-800' :
                      step.includes('✓') ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campo 2: Placa Vehicular */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Car className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">
                Placa Vehicular Extendida
              </h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
              <p><strong>Formato:</strong> ABC-1234-Q</p>
              <p><strong>Estructura:</strong> 3 letras + guion + 4 dígitos + guion + letra tipo</p>
              <p><strong>Ejemplo:</strong> PQR-1298-M</p>
              <p><strong>Total:</strong> 9 caracteres</p>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={licensePlate}
                onChange={handlePlateChange}
                placeholder="Ej: PQR-1298-M"
                className={`w-full p-3 border-2 rounded-lg font-mono text-lg ${
                  plateValid === null ? 'border-gray-300' :
                  plateValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
                maxLength={12}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {plateValid === true && <CheckCircle className="text-green-500" size={20} />}
                {plateValid === false && <XCircle className="text-red-500" size={20} />}
              </div>
            </div>
            
            {plateSteps.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                <h3 className="font-semibold mb-2 text-gray-800">Proceso del Autómata:</h3>
                <div className="space-y-1">
                  {plateSteps.map((step, index) => (
                    <div key={index} className={`text-sm p-2 rounded ${
                      step.includes('Error') || step.includes('✗') ? 'bg-red-100 text-red-800' :
                      step.includes('✓') ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Estado */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-800">Estado de Validación:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${
              trackingValid === null ? 'bg-gray-200' :
              trackingValid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}>
              <strong>Código de Seguimiento:</strong> {
                trackingValid === null ? 'Sin evaluar' :
                trackingValid ? 'Válido ✓' : 'Inválido ✗'
              }
            </div>
            <div className={`p-3 rounded-lg ${
              plateValid === null ? 'bg-gray-200' :
              plateValid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}>
              <strong>Placa Vehicular:</strong> {
                plateValid === null ? 'Sin evaluar' :
                plateValid ? 'Válida ✓' : 'Inválida ✗'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomataValidator;