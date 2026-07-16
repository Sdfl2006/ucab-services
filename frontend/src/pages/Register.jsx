import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function Register() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado completo para cubrir HU-01 (Datos de usuario)
  const [formData, setFormData] = useState({
    nombres: 'Jimena',
    apellidos: 'Martínez',
    correo: 'hola@sitioincreible.com',
    clave: 'ucab1234',
    confirmarClave: 'ucab1234',
    fechaNacimiento: '2004-05-15',
    cedula: 'V-31229670',
    telefono: '0414-1234567',
    direccion: 'Av. Teherán, Montalbán II, Res. Bucare, Piso 4, Caracas',
    sede: 'Montalbán',
    rol: 'Estudiante',
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nombres || !formData.apellidos || !formData.correo || !formData.cedula) {
      setError('Por favor complete todos los campos obligatorios (*).');
      return;
    }
    if (formData.clave !== formData.confirmarClave) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setStep(2); // Avanzar a Datos Universitarios (Figura 1.2 del PDF)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Error al registrar la cuenta. Verifique los datos e intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-ucab-light via-gray-100 to-gray-200 p-4 py-10">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
        {/* Cabecera institucional */}
        <div className="bg-ucab-green px-8 py-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">Registro de Usuario</h1>
            <p className="text-xs text-emerald-100 mt-0.5">Plataforma UCAB-Services</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <span>Paso {step} de 2:</span>
            <span className="text-ucab-yellow">{step === 1 ? 'Datos Personales' : 'Datos Universitarios'}</span>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2 animate-shake">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* WIZARD PASO 1: DATOS PERSONALES (Figura 1.1) */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Crear una cuenta nueva</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  ¿Ya estás registrado?{' '}
                  <Link to="/login" className="text-ucab-green font-bold hover:underline">
                    Accede aquí
                  </Link>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="NOMBRES" id="nombres" value={formData.nombres} onChange={handleChange} required placeholder="Jimena" />
                <Input label="APELLIDOS" id="apellidos" value={formData.apellidos} onChange={handleChange} required placeholder="Martínez" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="CÉDULA DE IDENTIDAD" id="cedula" value={formData.cedula} onChange={handleChange} required placeholder="V-31229670" helperText="Ej: V-12345678 o E-87654321" />
                <Input label="FECHA DE NACIMIENTO" id="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="CORREO ELECTRÓNICO" id="correo" type="email" value={formData.correo} onChange={handleChange} required placeholder="ejemplo@est.ucab.edu.ve" />
                <Input label="TELÉFONO MÓVIL" id="telefono" value={formData.telefono} onChange={handleChange} placeholder="0414-1234567" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="CONTRASEÑA" id="clave" type="password" value={formData.clave} onChange={handleChange} required placeholder="••••••••" />
                <Input label="CONFIRMAR CONTRASEÑA" id="confirmarClave" type="password" value={formData.confirmarClave} onChange={handleChange} required placeholder="••••••••" />
              </div>

              <Input label="DIRECCIÓN DE HABITACIÓN DETALLADA" id="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle, Edificio/Casa, Piso, Municipio, Ciudad" />

              <div className="pt-4">
                <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
                  Continuar a Datos Universitarios →
                </Button>
              </div>
            </form>
          )}

          {/* WIZARD PASO 2: DATOS UNIVERSITARIOS Y SEDE (Figura 1.2) */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Datos Universitarios</h2>
                <p className="text-xs text-gray-500 mt-0.5">Seleccione su sede y el rol institucional al que pertenece</p>
              </div>

              {/* Selector de Sede (Montalbán / Guayana) - Criterio ERE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SEDE UCAB ADSCRITA <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['Montalbán', 'Guayana'].map((sedeOption) => (
                    <div
                      key={sedeOption}
                      onClick={() => setFormData((prev) => ({ ...prev, sede: sedeOption }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center transition-all ${
                        formData.sede === sedeOption
                          ? 'border-ucab-green bg-ucab-green/5 font-bold text-ucab-green shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <svg className="w-6 h-6 mb-1 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">Sede {sedeOption}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selector de Tipo de Miembro (Roles del sistema) */}
              <div>
                <label htmlFor="rol" className="block text-sm font-semibold text-gray-700 mb-1">
                  TIPO DE MIEMBRO DE LA COMUNIDAD <span className="text-red-500">*</span>
                </label>
                <select
                  id="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className="w-full px-3.5 py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green font-medium text-gray-800 cursor-pointer"
                >
                  <option value="Estudiante">Estudiante de Pregrado / Postgrado</option>
                  <option value="Profesor">Profesor / Docente Investigador</option>
                  <option value="Egresado">Egresado UCAB</option>
                  <option value="Personal Administrativo">Personal Administrativo</option>
                  <option value="Becario">Becario UCAB</option>
                  <option value="Preparador">Preparador Académico</option>
                  <option value="Aliado Externo">Aliado Externo / Empresa</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  El sistema habilitará módulos específicos y cálculo de tarifas según este rol institucional (HU-06).
                </p>
              </div>

              {/* Resumen en tarjeta de los datos ingresados en paso 1 */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-1.5 flex justify-between items-center">
                  <span>Resumen de Ficha:</span>
                  <button type="button" onClick={() => setStep(1)} className="text-ucab-green hover:underline">Editar</button>
                </div>
                <p><b>Nombre:</b> {formData.nombres} {formData.apellidos}</p>
                <p><b>Cédula:</b> {formData.cedula} | <b>Teléfono:</b> {formData.telefono}</p>
                <p><b>Correo:</b> {formData.correo}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} className="w-1/3 font-semibold">
                  ← Atrás
                </Button>
                <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-2/3 font-bold">
                  Completar Registro
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}