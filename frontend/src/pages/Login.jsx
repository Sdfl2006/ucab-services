import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function Login() {
  const [correo, setCorreo] = useState('hola@sitioincreible.com');
  const [clave, setClave] = useState('ucab1234');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!correo || !clave) {
      setError('Por favor ingrese su correo y contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(correo, clave);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Ocurrió un error al intentar iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-ucab-light via-gray-100 to-gray-200 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
        {/* Cabecera Verde Institucional UCAB */}
        <div className="bg-ucab-green px-8 py-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-ucab-green-light rounded-full opacity-20 pointer-events-none"></div>
          
          {/* Logo Simulado UCAB-Services */}
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-3 border border-white/20 shadow-inner">
            <svg className="w-8 h-8 text-ucab-yellow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight">UCAB-Services</h1>
          <p className="text-xs text-emerald-100 mt-1 font-medium tracking-wide uppercase">
            Universidad Católica Andrés Bello
          </p>
        </div>

        {/* Formulario de Acceso (Referencia Figura 3 del PDF) */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Accede</h2>
            <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar en la plataforma</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-700 font-medium animate-shake">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="CORREO ELECTRÓNICO"
              id="correo"
              type="email"
              placeholder="ejemplo@est.ucab.edu.ve"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />

            <Input
              label="CONTRASEÑA"
              id="clave"
              type="password"
              placeholder="••••••••••••"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input type="checkbox" defaultChecked className="rounded text-ucab-green focus:ring-ucab-green" />
                <span>Recordar sesión</span>
              </label>
              <a href="#recuperar" onClick={(e) => { e.preventDefault(); alert('Para recuperar su clave acuda al Departamento de TI o Secretaría.'); }} className="font-semibold text-ucab-green hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full font-bold shadow-md hover:shadow-lg"
              >
                Acceder
              </Button>
            </div>
          </form>

          {/* Enlace al Registro */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-600">
            ¿Aún no estás registrado en UCAB-Services?{' '}
            <Link to="/register" className="font-bold text-ucab-green hover:underline">
              Crear una cuenta nueva
            </Link>
          </div>

          {/* Tarjeta de ayuda rápida para los evaluadores / profesores */}
          <div className="mt-6 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-ucab-blue">
              <span>💡 Modo Demostración / Rúbrica:</span>
            </div>
            <p>Puedes hacer clic directamente en <b>Acceder</b> con los datos precargados para entrar al Dashboard como <i>Estudiante (Sede Montalbán)</i>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}