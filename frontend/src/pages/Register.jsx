import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

// Roles que el backend sabe crear hoy (ver auditoría: registerUser solo
// inserta la subclase de Estudiante o Profesor; cualquier otro rol deja la
// cuenta sin roles asignados y, por lo tanto, inutilizable). Se restringe
// el selector a estos dos para no dejar a nadie registrado sin salida.
const ROLES_SOPORTADOS = [
  { value: 'Estudiante', label: 'Estudiante de Pregrado / Postgrado' },
  { value: 'Profesor', label: 'Profesor / Docente Investigador' },
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    clave: '',
    confirmarClave: '',
    cedula: '',
    telefono: '',
    sexo: 'F',
    calle: '',
    municipio: '',
    ciudad: '',
    rol: 'Estudiante',
    facultad: '',
    escuela: '',
    semestre_actual: '',
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
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.rol === 'Estudiante' && (!formData.facultad || !formData.escuela || !formData.semestre_actual)) {
      setError('Complete facultad, escuela y semestre para continuar como Estudiante.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Mapeo exacto al contrato de POST /users/register (userController.js):
      // el backend espera `password`, no `clave`, y dirección en tres
      // columnas separadas (calle/municipio/ciudad), no un texto libre.
      await register({
        cedula: formData.cedula,
        correo: formData.correo,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        sexo: formData.sexo,
        ciudad: formData.ciudad,
        municipio: formData.municipio,
        calle: formData.calle,
        password: formData.clave,
        rol: formData.rol,
        facultad: formData.rol === 'Estudiante' ? formData.facultad : undefined,
        escuela: formData.rol === 'Estudiante' ? formData.escuela : undefined,
        semestre_actual: formData.rol === 'Estudiante' ? formData.semestre_actual : undefined,
      });
      // El backend deja la cuenta en cuarentena (estado_cuenta = 'suspendida')
      // hasta que un Personal_Administrativo la active: no hay token que
      // guardar ni sesión que abrir todavía, así que NO navegamos a
      // /dashboard — mostramos la confirmación y mandamos a /login.
      setRegistrado(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Error al registrar la cuenta. Verifique los datos e intente de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrado) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-ucab-light via-gray-100 to-gray-200 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-ucab-green/10 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-ucab-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-800">Ficha registrada</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tu cuenta quedó pendiente de aprobación por Secretaría / Personal Administrativo.
            Te avisaremos por correo cuando esté activa y puedas iniciar sesión.
          </p>
          <Button variant="primary" size="lg" className="w-full font-bold mt-6" onClick={() => navigate('/login')}>
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-ucab-light via-gray-100 to-gray-200 p-4 py-10">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
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
                <Input label="CÉDULA DE IDENTIDAD" id="cedula" value={formData.cedula} onChange={handleChange} required placeholder="V-31229670" />
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">SEXO <span className="text-red-500">*</span></label>
                  <select id="sexo" value={formData.sexo} onChange={handleChange} className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green">
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="CORREO ELECTRÓNICO" id="correo" type="email" value={formData.correo} onChange={handleChange} required placeholder="ejemplo@est.ucab.edu.ve" />
                <Input label="TELÉFONO MÓVIL" id="telefono" value={formData.telefono} onChange={handleChange} placeholder="0414-1234567" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="CONTRASEÑA" id="clave" type="password" value={formData.clave} onChange={handleChange} required placeholder="••••••••" />
                <Input label="CONFIRMAR CONTRASEÑA" id="confirmarClave" type="password" value={formData.confirmarClave} onChange={handleChange} required placeholder="••••••••" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="CALLE" id="calle" value={formData.calle} onChange={handleChange} placeholder="Av. Teherán" />
                <Input label="MUNICIPIO" id="municipio" value={formData.municipio} onChange={handleChange} placeholder="Chacao" />
                <Input label="CIUDAD" id="ciudad" value={formData.ciudad} onChange={handleChange} placeholder="Caracas" />
              </div>

              <div className="pt-4">
                <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
                  Continuar a Datos Universitarios →
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Datos Universitarios</h2>
                <p className="text-xs text-gray-500 mt-0.5">Seleccione el rol institucional al que pertenece</p>
              </div>

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
                  {ROLES_SOPORTADOS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Por ahora solo Estudiante y Profesor tienen alta automática soportada (ver nota de auditoría del equipo).
                </p>
              </div>

              {formData.rol === 'Estudiante' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="FACULTAD" id="facultad" value={formData.facultad} onChange={handleChange} required placeholder="Ingeniería" />
                  <Input label="ESCUELA" id="escuela" value={formData.escuela} onChange={handleChange} required placeholder="Informática" />
                  <Input label="SEMESTRE ACTUAL" id="semestre_actual" type="number" min="1" value={formData.semestre_actual} onChange={handleChange} required placeholder="6" />
                </div>
              )}

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