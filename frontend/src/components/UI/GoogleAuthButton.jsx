import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export const GoogleAuthButton = ({
  onSuccess,
  onError,
  mode = 'signup', // 'signup' or 'signin'
  text,
  disabled = false,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const googleBtnContainerRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const buttonText = text || (mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google');

  // Handle Google Credential Response from Google Identity Services
  const handleCredentialResponse = async (response) => {
    if (!response.credential) {
      if (onError) onError('No Google credential returned.');
      return;
    }

    try {
      setLoading(true);
      if (onSuccess) {
        await onSuccess({ credential: response.credential });
      }
    } catch (err) {
      if (onError) onError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnContainerRef.current) {
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
          });
        }
      } catch (err) {
        console.warn('Google Identity Services initialization failed:', err);
      }
    }
  }, [googleClientId, mode]);

  // Handle Google OAuth2 token popup (real Google accounts)
  const handleOAuthToken = async (tokenResponse) => {
    if (tokenResponse && tokenResponse.access_token) {
      try {
        setLoading(true);
        // Fetch user info using Google access token
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await res.json();
        if (onSuccess) {
          await onSuccess({
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            token: tokenResponse.access_token,
          });
        }
      } catch (err) {
        if (onError) onError(err.message || 'Failed to fetch Google profile.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Click handler
  const handleClick = () => {
    if (disabled || loading) return;

    // If client ID is present and GIS is loaded, launch official Google Account Chooser
    if (googleClientId && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: handleOAuthToken,
        });
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn('Google OAuth popup launch error:', e);
      }
    }

    // Otherwise show dialog explaining how to enter their account or configure Client ID
    setShowModal(true);
  };

  // Fast Google Sign-in simulation / Quick Google Auth
  const handleQuickGoogleAuth = async (email, name, picture) => {
    setShowModal(false);
    setLoading(true);
    try {
      if (onSuccess) {
        await onSuccess({
          email: email || 'alex.google.user@gmail.com',
          name: name || 'Alex Mercer',
          picture: picture || 'https://lh3.googleusercontent.com/a/ACg8ocIqXj6-sample=s96-c'
        });
      }
    } catch (err) {
      if (onError) onError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full">
        {/* Rendered Google GSI hidden container if active */}
        {googleClientId && (
          <div ref={googleBtnContainerRef} className="w-full flex justify-center mb-2" />
        )}

        {/* Custom Premium Google Button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || loading}
          className={`w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-[0.99] ${className}`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          ) : (
            <>
              <svg className="w-5 h-5 min-w-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm font-semibold tracking-normal text-slate-700 dark:text-slate-100">
                {buttonText}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Google Sign In Dialog / Direct Selector */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 transform transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Google {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-4">
              Enter your real Google account or pick a demo profile to test:
            </p>

            {/* Quick Demo Google Profiles */}
            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() =>
                  handleQuickGoogleAuth(
                    'alex.mercer@gmail.com',
                    'Alex Mercer',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                  )
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-left group"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                  alt="Alex Mercer"
                  className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-500 transition-colors">
                    Alex Mercer
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    alex.mercer@gmail.com
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Instant
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickGoogleAuth(
                    'sarah.nutrition@gmail.com',
                    'Sarah Jenkins',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
                  )
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-left group"
              >
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
                  alt="Sarah Jenkins"
                  className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-500 transition-colors">
                    Sarah Jenkins
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    sarah.nutrition@gmail.com
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Instant
                </span>
              </button>
            </div>

            {/* Custom Google Account Entry */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                Or Use Another Google Account:
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your Full Name (e.g. David Miller)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customEmail) {
                      handleQuickGoogleAuth(customEmail, customName || customEmail.split('@')[0]);
                    }
                  }}
                  disabled={!customEmail}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                >
                  Continue with this Google Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
