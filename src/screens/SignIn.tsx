import { useState } from 'react'
import { Shield, Eye, EyeOff, Wifi } from 'lucide-react'
import logoImg from '../imports/Artboard_4.png'

interface SignInProps {
  onSignIn: () => void
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [mode, setMode] = useState<'password' | 'pin'>('password')
  const [email, setEmail] = useState('mwebb@hollomanext.com')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'password' && !password) { setError('Enter your password to continue.'); return }
    if (mode === 'pin' && pin.length < 4) { setError('Enter your 4-digit PIN.'); return }
    setError('')
    onSignIn()
  }

  const handlePinKey = (digit: string) => {
    if (digit === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length < 4) setPin(p => p + digit)
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-black">
      {/* Texture strip */}
      <div className="h-1 w-full bg-brand-red" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        {/* Logo card */}
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-lg overflow-hidden p-2">
              <img src={logoImg} alt="Holloman Exterminators" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-white tracking-wide uppercase leading-none">
                Holloman
              </div>
              <div className="font-display text-2xl font-semibold tracking-widest text-brand-red uppercase mt-0.5">
                FieldQuote
              </div>
              <div className="text-steel text-xs mt-1.5 tracking-wider uppercase font-mono">
                Field Sales Platform
              </div>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'password' ? 'bg-brand-red text-white' : 'bg-white/5 text-steel hover:bg-white/10'}`}
            >
              Email / Password
            </button>
            <button
              onClick={() => setMode('pin')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'pin' ? 'bg-brand-red text-white' : 'bg-white/5 text-steel hover:bg-white/10'}`}
            >
              Quick PIN
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'password' ? (
              <>
                <div>
                  <label className="block text-xs text-silver uppercase tracking-wider font-semibold mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all placeholder:text-steel"
                    placeholder="you@hollomanext.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-silver uppercase tracking-wider font-semibold mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 pr-12 text-white text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-white transition-colors p-1">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-brand-red text-xs font-semibold">{error}</p>}
                <button type="submit" className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-display text-xl font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-98 mt-2">
                  Sign In
                </button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm text-silver mb-1">Signing in as</p>
                  <p className="text-white font-semibold">{email}</p>
                  <div className="flex justify-center gap-3 mt-5 mb-6">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? 'bg-brand-red border-brand-red' : 'bg-transparent border-white/30'}`} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['1','2','3','4','5','6','7','8','9','','0','del'].map((k) => (
                    <button
                      key={k}
                      type={k === '' ? 'button' : 'button'}
                      onClick={() => k !== '' && handlePinKey(k)}
                      className={`py-4 rounded-xl font-display text-2xl font-bold transition-all ${
                        k === '' ? 'pointer-events-none opacity-0' :
                        k === 'del' ? 'bg-white/8 text-silver hover:bg-white/15 active:scale-95' :
                        'bg-white/8 text-white hover:bg-white/15 active:scale-95'
                      }`}
                    >
                      {k === 'del' ? '⌫' : k}
                    </button>
                  ))}
                </div>
                {error && <p className="text-brand-red text-xs font-semibold text-center mt-2">{error}</p>}
                <button
                  type="submit"
                  disabled={pin.length < 4}
                  className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-40 text-white font-display text-xl font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all mt-2"
                >
                  Enter
                </button>
              </>
            )}
          </form>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-1.5 text-xs text-steel">
              <Wifi size={13} />
              <span>Connected — Last sync 2 min ago</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-steel">
              <Shield size={13} />
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-steel/50 font-mono">
        v2.4.1 · Holloman Exterminators Internal Use Only
      </div>
    </div>
  )
}
