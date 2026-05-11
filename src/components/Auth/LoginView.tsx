import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { showToast } from '../UI/ToastContainer';
import { Lang } from '../../data/i18n';

interface LoginViewProps {
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  t: (k: string) => string;
}

export default function LoginView({ lang, onChangeLang, t }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast(lang === 'zh' ? '登入成功！' : 'Login successful!', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (action: 'login' | 'register' | 'reset') => {
    if (!email) return showToast(lang === 'zh' ? '請輸入 Email' : 'Email required', 'error');
    if (action !== 'reset' && !pass) return showToast(lang === 'zh' ? '請輸入密碼' : 'Password required', 'error');
    
    setLoading(true);
    try {
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast(lang === 'zh' ? '登入成功！' : 'Login successful!', 'success');
      } else if (action === 'register') {
        await createUserWithEmailAndPassword(auth, email, pass);
        showToast(lang === 'zh' ? '註冊成功！' : 'Registration successful!', 'success');
      } else if (action === 'reset') {
        await sendPasswordResetEmail(auth, email);
        showToast(lang === 'zh' ? '重設密碼信件已寄出！' : 'Reset email sent!', 'success');
        setLoading(false);
        return;
      }
    } catch (e: any) {
      console.error('Auth Error:', e.code, e.message);
      const msgs: Record<string, string> = {
        'auth/invalid-credential': lang === 'zh' ? '帳號或密碼錯誤' : 'Invalid credentials',
        'auth/invalid-email': lang === 'zh' ? '無效的 Email 格式' : 'Invalid email format',
        'auth/user-disabled': lang === 'zh' ? '此帳號已被停用' : 'User disabled',
        'auth/user-not-found': lang === 'zh' ? '帳號不存在，請先註冊' : 'User not found, please register',
        'auth/wrong-password': lang === 'zh' ? '密碼錯誤' : 'Wrong password',
        'auth/email-already-in-use': lang === 'zh' ? '此 Email 已經被註冊，請直接登入' : 'Email already in use, please login',
        'auth/operation-not-allowed': lang === 'zh' ? '登入服務未啟用' : 'Login provider not enabled',
        'auth/weak-password': lang === 'zh' ? '密碼太弱，請至少輸入 6 位數' : 'Weak password, min 6 chars',
        'auth/too-many-requests': lang === 'zh' ? '嘗試次數過多，帳號已被暫時封鎖。請稍後再試，或使用 Google 登入' : 'Too many attempts. Account temporary locked. Try again later or use Google Login'
      };
      showToast(msgs[e.code] || e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-hex-gold bg-hex-panel overflow-hidden flex items-center justify-center ai-glow shadow-2xl">
          <img src="/icon.png" className="w-full h-full object-cover" alt="App Logo" onError={(e) => { e.currentTarget.parentElement?.classList.add('bg-hex-panel'); e.currentTarget.style.display = 'none'; }} />
          <i className="fa-solid fa-gem text-hex-blue text-4xl absolute z-[-1]"></i>
        </div>
        <h1 className="font-heading text-3xl text-hex-goldlight tracking-wider">英雄聯盟 沖分群組</h1>
        <p className="text-hex-red font-heading text-lg mt-1">（禁屌人）</p>
        <p className="text-gray-400 text-sm mt-2">{t('login_sub')}</p>
      </div>
      <div className="bg-hex-panel lol-border p-8 rounded-lg shadow-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="summoner@nexus.gg" 
              className="w-full bg-[#010A13] border border-hex-gold/30 rounded px-4 py-3 text-white outline-none focus:border-hex-gold transition" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 flex justify-between">
              Password
              <button 
                disabled={loading}
                onClick={() => handleAuth('reset')} 
                className="text-hex-blue hover:text-hex-gold text-xs transition"
              >
                {lang === 'zh' ? '忘記密碼？' : 'Forgot Password?'}
              </button>
            </label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••" 
              onKeyDown={(e) => e.key === 'Enter' && handleAuth('login')}
              className="w-full bg-[#010A13] border border-hex-gold/30 rounded px-4 py-3 text-white outline-none focus:border-hex-gold transition" 
            />
          </div>
          <button 
            disabled={loading}
            onClick={() => handleAuth('login')} 
            className="lol-btn w-full py-3 rounded font-heading tracking-wider text-lg mt-2"
          >
            {loading ? <i className="fa-solid fa-spinner spinner"></i> : 'LOGIN'}
          </button>
          
          <button 
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded border border-gray-700 text-white hover:bg-white/5 transition font-heading flex items-center justify-center gap-2"
          >
            {loading ? <i className="fa-solid fa-spinner spinner"></i> : (
              <>
                <i className="fa-brands fa-google text-hex-blue"></i>
                SIGN IN WITH GOOGLE
              </>
            )}
          </button>

          <button 
            disabled={loading}
            onClick={() => handleAuth('register')} 
            className="w-full py-3 rounded border border-hex-gold text-hex-gold hover:bg-hex-gold/10 font-heading tracking-wider transition"
          >
            REGISTER
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center gap-4 text-xs">
          <button onClick={() => onChangeLang('en')} className={lang === 'en' ? 'text-hex-blue font-bold' : 'text-gray-600 hover:text-gray-400'}>EN</button>
          <span className="text-gray-700">|</span>
          <button onClick={() => onChangeLang('zh')} className={lang === 'zh' ? 'text-hex-blue font-bold' : 'text-gray-600 hover:text-gray-400'}>中文</button>
        </div>
      </div>
    </div>
  );
}
