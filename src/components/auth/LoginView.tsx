import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Bot, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLogin: (password: string) => boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const success = onLogin(password);
      if (!success) {
        setError('Senha incorreta. Tente novamente ou use a senha padrão.');
      }
      setIsLoading(false);
    }, 300);
  };

  const handleUseDefaultPassword = () => {
    const defaultPass = import.meta.env.VITE_ADMIN_PASSWORD || 'itasuper-admin';
    setPassword(defaultPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Background subtle glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">Agente ItaSuper</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
            Painel pessoal de controle do agente de desenvolvimento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha de uso pessoal..."
                className="w-full min-h-[48px] pl-10 pr-12 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3.5 min-h-[48px] flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
                aria-label="Mostrar ou ocultar senha"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-rose-400 text-xs mt-2 flex items-center gap-1.5">
                <span>•</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full min-h-[48px] py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isLoading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={handleUseDefaultPassword}
            className="min-h-[44px] px-3 py-2 text-xs text-zinc-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Preencher senha padrão de teste</span>
          </button>
        </div>
      </div>
    </div>
  );
};
