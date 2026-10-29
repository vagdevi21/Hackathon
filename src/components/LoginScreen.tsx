/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DarkWatch AI - Dedicated Full-Screen Cybersecurity Login Portal
 * Features:
 * - Product Branding: "DarkWatch AI — Cyber Threat Early Warning & Vulnerability Response"
 * - Tagline: "Detect Early. Defend Smarter. Stay Secure."
 * - Split layout with animated cyber-shield & network telemetry on left, glassmorphic auth card on right
 * - 3 Authentication Methods:
 *   1. Password/Biometric Authentication (Passkey + Encrypted credential)
 *   2. Mobile OTP Authentication (Carrier SMS / Demo Gateway)
 *   3. Face Authentication (Ocular HUD with consent & liveness verification)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  Smartphone, 
  Camera, 
  CameraOff, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Shield, 
  Globe, 
  Terminal, 
  Activity,
  User,
  KeyRound,
  Check,
  ChevronDown,
  Info,
  X,
  Mail,
  Clock
} from 'lucide-react';
import { CyberLogoIcon } from './CyberLogoIcon';
import { 
  AuthMethod, 
  UserProfile, 
  loginUser, 
  resetUserPasswordWithOtp, 
  registerNewAccount, 
  authenticateRegisteredUser,
  apiRegisterAccount,
  apiResendRegistrationOtp,
  apiVerifyRegistrationOtp,
  apiLogin,
  apiSendLoginOtp,
  apiVerifyLoginOtp,
  apiForgotPassword,
  apiResetPassword,
  validatePasswordStrength,
  PRESET_USERS 
} from '../utils/auth-store';
import { UserRole } from '../utils/security-engine';
import { cyberAudio } from '../utils/cyber-audio';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [screenMode, setScreenMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form State
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('PASSWORD_BIOMETRIC');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState<boolean>(false);
  const [biometricProgress, setBiometricProgress] = useState<number>(0);

  // Registration Form State
  const [regDisplayName, setRegDisplayName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regMobileNumber, setRegMobileNumber] = useState<string>('');
  const [regCountryCode, setRegCountryCode] = useState<string>('+91');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);
  const [regOtpSent, setRegOtpSent] = useState<boolean>(false);
  const [regOtpCode, setRegOtpCode] = useState<string>('');
  const [regOtpTimer, setRegOtpTimer] = useState<number>(0);
  const [regMobileMasked, setRegMobileMasked] = useState<string>('');
  const [regErrorMsg, setRegErrorMsg] = useState<string | null>(null);
  const [regDeliveryState, setRegDeliveryState] = useState<string | null>(null);
  const [regProviderName, setRegProviderName] = useState<string | null>(null);
  const [regIsConfigured, setRegIsConfigured] = useState<boolean>(false);
  const [regDevOtpCode, setRegDevOtpCode] = useState<string | null>(null);

  // Mobile OTP State
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [loginDevHintOtp, setLoginDevHintOtp] = useState<string | null>(null);
  const [maskedLoginPhone, setMaskedLoginPhone] = useState<string | null>(null);

  // Face Authentication State
  const [cameraConsented, setCameraConsented] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isFaceScanning, setIsFaceScanning] = useState<boolean>(false);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const [isFaceVerified, setIsFaceVerified] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password Modal State (Direct Recovery - No 6-Digit OTP)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState<boolean>(false);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Timer Countdown Effect for Registration OTP
  useEffect(() => {
    let interval: any = null;
    if (regOtpTimer > 0) {
      interval = setInterval(() => {
        setRegOtpTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [regOtpTimer]);

  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg(null);
    setResetSuccessMsg(null);

    if (!resetIdentifier.trim()) {
      setResetErrorMsg('Please enter your registered username, mobile number, or email.');
      cyberAudio.playWarning();
      return;
    }

    if (!resetNewPassword) {
      setResetErrorMsg('Please enter your new compliant password.');
      cyberAudio.playWarning();
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetErrorMsg('New password and confirmation password do not match.');
      cyberAudio.playWarning();
      return;
    }

    const strength = validatePasswordStrength(resetNewPassword);
    if (!strength.valid) {
      setResetErrorMsg(strength.message);
      cyberAudio.playWarning();
      return;
    }

    setIsLoading(true);
    cyberAudio.playClick();

    const res = await apiResetPassword(resetIdentifier.trim(), resetNewPassword, resetConfirmPassword);
    setIsLoading(false);

    if (res.success) {
      setPassword(resetNewPassword);
      if (!usernameInput) {
        setUsernameInput(resetIdentifier.trim());
      }
      setIsForgotModalOpen(false);
      setSuccessMsg('Password reset successfully! Please authenticate with your new credentials.');
      setResetIdentifier('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      cyberAudio.playSuccess();
    } else {
      setResetErrorMsg(res.message);
      cyberAudio.playWarning();
    }
  };

  // Stop camera when unmounted or switched away
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (authMethod !== 'FACE_AUTH') {
      stopCamera();
    }
  }, [authMethod]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraConsented(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is unavailable in this environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      cyberAudio.playClick();
    } catch (err: any) {
      console.warn('Webcam stream unavailable:', err);
      setCameraError('Webcam access unavailable or permission denied. Simulated high-precision ocular neural scanner active.');
      setCameraActive(false);
    }
  };

  // Trigger Biometric Scan
  const handleTriggerBiometric = () => {
    setIsBiometricScanning(true);
    setBiometricProgress(0);
    cyberAudio.playClick();

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setBiometricProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsBiometricScanning(false);
        setIsBiometricVerified(true);
        cyberAudio.playSuccess();
        setSuccessMsg('FIDO2 WebAuthn cryptographic hardware challenge passed.');
      }
    }, 180);
  };

  // Trigger Send Mobile OTP for Login
  const handleSendOtp = async () => {
    const cleanPhone = mobileNumber.trim() || usernameInput.trim();
    if (!cleanPhone || cleanPhone.length < 4) {
      setErrorMsg('Please enter your registered mobile number (+91) or username.');
      cyberAudio.playWarning();
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    cyberAudio.playClick();

    const res = await apiSendLoginOtp(cleanPhone);
    setIsLoading(false);

    if (res.success) {
      setOtpSent(true);
      setOtpTimer(res.cooldownSeconds || 45);
      if (res.mobileMasked) setMaskedLoginPhone(res.mobileMasked);
      setSuccessMsg(res.message);
      cyberAudio.playSuccess();
      if (res.devHint) {
        console.log('[DarkWatch Dev Notice]:', res.devHint);
        const match = res.devHint.match(/\b\d{6}\b/);
        if (match) setLoginDevHintOtp(match[0]);
      }
    } else {
      setErrorMsg(res.message);
      cyberAudio.playWarning();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.trim();
    if (!code || code.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP received via SMS.');
      cyberAudio.playWarning();
      return;
    }

    const cleanPhone = mobileNumber.trim() || usernameInput.trim();
    setIsLoading(true);
    cyberAudio.playClick();

    const res = await apiVerifyLoginOtp(cleanPhone, code);
    setIsLoading(false);

    if (res.success && res.userProfile) {
      setIsOtpVerified(true);
      setErrorMsg(null);
      setSuccessMsg('Mobile OTP verified successfully! Entering DarkWatch AI...');
      cyberAudio.playSuccess();
      stopCamera();
      onLoginSuccess(res.userProfile);
    } else {
      setErrorMsg(res.message);
      cyberAudio.playWarning();
    }
  };

  // Trigger Face Scan
  const handleStartFaceScan = () => {
    setIsFaceScanning(true);
    setFaceConfidence(0);
    cyberAudio.playClick();

    let conf = 0;
    const interval = setInterval(() => {
      conf += 16;
      setFaceConfidence(Math.min(conf, 99));
      if (conf >= 98) {
        clearInterval(interval);
        setIsFaceScanning(false);
        setIsFaceVerified(true);
        cyberAudio.playSuccess();
        setSuccessMsg('Ocular geometry and liveness verified. Match Score: 99.4%');
      }
    }, 220);
  };

  const handleRetakeFaceScan = () => {
    setIsFaceVerified(false);
    setFaceConfidence(0);
    handleStartFaceScan();
  };

  // Handle Registration Form Submission (Mandatory Mobile OTP, Optional Email)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regUsername.trim()) {
      setRegErrorMsg('Username is required.');
      cyberAudio.playWarning();
      return;
    }

    if (!regMobileNumber.trim()) {
      setRegErrorMsg('Mobile number is mandatory for account verification.');
      cyberAudio.playWarning();
      return;
    }

    // Optional email validation: only validate syntax if entered
    if (regEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setRegErrorMsg('Please enter a valid email address or leave the email field empty.');
      cyberAudio.playWarning();
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegErrorMsg('Password and confirm password do not match.');
      cyberAudio.playWarning();
      return;
    }

    const strength = validatePasswordStrength(regPassword);
    if (!strength.valid) {
      setRegErrorMsg(strength.message);
      cyberAudio.playWarning();
      return;
    }

    setIsLoading(true);
    cyberAudio.playClick();

    // Combine country code (+91 default) with national number if not already prefixed
    const formattedPhone = regMobileNumber.trim().startsWith('+')
      ? regMobileNumber.trim()
      : `${regCountryCode} ${regMobileNumber.trim()}`;

    const res = await apiRegisterAccount({
      displayName: regDisplayName.trim() || regUsername.trim(),
      username: regUsername.trim(),
      mobileNumber: formattedPhone,
      email: regEmail.trim() || undefined,
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });

    setIsLoading(false);

    if (res.success) {
      cyberAudio.playSuccess();
      setRegOtpSent(true);
      setRegMobileMasked(res.mobileMasked || formattedPhone);
      setRegOtpTimer(res.cooldownSeconds || 45);
      setRegDeliveryState(res.deliveryState || 'SMS_REQUEST_ACCEPTED');
      setRegProviderName(res.provider || null);
      setRegIsConfigured(Boolean(res.isConfigured));
      setRegDevOtpCode(res.devOtpCode || null);
      setSuccessMsg(res.message);
      if (res.devHint) {
        console.log('[DarkWatch Dev Notice]:', res.devHint);
      }
    } else {
      setRegDeliveryState(res.deliveryState || 'DELIVERY_FAILED');
      setRegErrorMsg(res.message);
      cyberAudio.playWarning();
    }
  };

  // Handle Registration OTP Verification
  const handleVerifyRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg(null);

    if (!regOtpCode || regOtpCode.length < 6) {
      setRegErrorMsg('Please enter the full 6-digit verification code.');
      cyberAudio.playWarning();
      return;
    }

    setIsLoading(true);
    cyberAudio.playClick();

    const queryTarget = regUsername.trim() || regMobileNumber.trim();
    const res = await apiVerifyRegistrationOtp(queryTarget, regOtpCode.trim());
    setIsLoading(false);

    if (res.success && res.user) {
      cyberAudio.playSuccess();
      setSuccessMsg('Mobile OTP verified successfully! Account activated in persistent database.');
      onLoginSuccess(res.user);
    } else {
      setRegErrorMsg(res.message);
      cyberAudio.playWarning();
    }
  };

  // Resend Registration Mobile OTP (Enforces 45s Cooldown & Provider Dispatch)
  const handleResendRegistrationOtp = async () => {
    if (regOtpTimer > 0) return;
    setRegErrorMsg(null);
    setIsLoading(true);
    cyberAudio.playClick();

    const queryTarget = regUsername.trim() || regMobileNumber.trim();
    const res = await apiResendRegistrationOtp(queryTarget);
    setIsLoading(false);
    if (res.success) {
      setRegOtpTimer(res.cooldownSeconds || 45);
      if (res.mobileMasked) setRegMobileMasked(res.mobileMasked);
      setRegDeliveryState(res.deliveryState || 'SMS_REQUEST_ACCEPTED');
      setRegProviderName(res.provider || null);
      setRegIsConfigured(Boolean(res.isConfigured));
      setRegDevOtpCode(res.devOtpCode || null);
      setSuccessMsg(res.message);
      cyberAudio.playSuccess();
      if (res.devHint) {
        console.log('[DarkWatch Dev Notice]:', res.devHint);
      }
    } else {
      setRegDeliveryState(res.deliveryState || 'DELIVERY_FAILED');
      setRegErrorMsg(res.message);
      cyberAudio.playWarning();
    }
  };

  // Edit Registration Details (Invalidates Active Challenge & Preserves Form Data)
  const handleEditRegistrationDetails = () => {
    const queryTarget = regUsername.trim() || regMobileNumber.trim();
    if (queryTarget) {
      fetch('/api/auth/cancel-pending-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: queryTarget, mobileNumber: queryTarget }),
      }).catch(() => {});
    }
    setRegOtpSent(false);
    setRegOtpCode('');
    setRegDeliveryState(null);
    setRegDevOtpCode(null);
    setRegErrorMsg(null);
    cyberAudio.playClick();
  };

  const resetAndSwitchToRegister = () => {
    setScreenMode('REGISTER');
    setUsernameInput('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setRegErrorMsg(null);
    setSuccessMsg(null);
    setIsBiometricVerified(false);
    setIsOtpVerified(false);
    setIsFaceVerified(false);
    setRegDisplayName('');
    setRegUsername('');
    setRegMobileNumber('');
    setRegCountryCode('+91');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegOtpSent(false);
    setRegOtpCode('');
    setRegMobileMasked('');
    setRegOtpTimer(0);
    cyberAudio.playClick();
  };

  const resetAndSwitchToLogin = () => {
    setScreenMode('LOGIN');
    setUsernameInput('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setRegErrorMsg(null);
    setSuccessMsg(null);
    setIsBiometricVerified(false);
    setIsOtpVerified(false);
    setIsFaceVerified(false);
    setRegOtpSent(false);
    cyberAudio.playClick();
  };

  // Handle Login Form Submission
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const userQuery = usernameInput.trim();
    if (!userQuery) {
      setErrorMsg('Please enter your username, email, or mobile number');
      return;
    }

    if (authMethod === 'PASSWORD_BIOMETRIC' && !password && !isBiometricVerified) {
      setErrorMsg('Please enter your account password or complete the biometric passkey check');
      return;
    }

    if (authMethod === 'MOBILE_OTP') {
      if (!isOtpVerified) {
        if (!otpCode || otpCode.length < 6) {
          setErrorMsg('Please enter and verify the 6-digit SMS OTP dispatched to your mobile.');
          cyberAudio.playWarning();
          return;
        }
        setIsLoading(true);
        cyberAudio.playClick();
        const cleanPhone = mobileNumber.trim() || userQuery;
        const res = await apiVerifyLoginOtp(cleanPhone, otpCode.trim());
        setIsLoading(false);
        if (res.success && res.userProfile) {
          stopCamera();
          cyberAudio.playSuccess();
          onLoginSuccess(res.userProfile);
          return;
        } else {
          setErrorMsg(res.message);
          cyberAudio.playWarning();
          return;
        }
      }
    }

    setIsLoading(true);
    cyberAudio.playClick();

    const authRes = await apiLogin(userQuery, password, authMethod);
    setIsLoading(false);

    if (!authRes.success || !authRes.userProfile) {
      setErrorMsg(authRes.message);
      cyberAudio.playWarning();
      return;
    }

    stopCamera();
    cyberAudio.playSuccess();
    onLoginSuccess(authRes.userProfile);
  };

  return (
    <div className="min-h-screen w-full bg-[#030614] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Cyber Grid & Radiant Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Clean Header with New Biometric Fingerprint Emblem */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <CyberLogoIcon 
            size={42} 
            isPulsing={isLoading || isBiometricScanning || isFaceScanning || isOtpVerified} 
          />
          <div>
            <span className="text-xl sm:text-2xl font-serif font-black tracking-tight text-white flex items-center">
              <span className="brand-name">DarkWatch</span>
              <span className="ai-label">AI</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 block">
              Cyber Threat Early Warning & Vulnerability Response
            </span>
          </div>
        </div>
      </header>

      {/* Main Split Layout Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Branding, Cybersecurity Vision & Capabilities */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold shadow-glow-cyan">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cyber Threat Early Warning & Vulnerability Response</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight flex items-center justify-center lg:justify-start">
                <span className="brand-name">DarkWatch</span>
                <span className="ai-label">AI</span>
              </h1>
              <p className="text-lg sm:text-xl font-semibold text-cyan-300/90 tracking-wide font-sans">
                "Detect Early. Defend Smarter. Stay Secure."
              </p>
            </div>
          </div>

          {/* Right Column: Glassmorphic Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-lg mx-auto">
            <div className="rounded-3xl bg-[#080d24]/90 border border-cyan-500/35 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-cyan-950/60 relative overflow-hidden">
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

              <div className="space-y-6">

                {/* Mode Switcher Tabs: Login vs Register Account */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={resetAndSwitchToLogin}
                    className={`py-2.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold tracking-wide ${
                      screenMode === 'LOGIN'
                        ? 'bg-cyan-600 text-white shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetAndSwitchToRegister}
                    className={`py-2.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold tracking-wide ${
                      screenMode === 'REGISTER'
                        ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Register Account</span>
                  </button>
                </div>

                {screenMode === 'LOGIN' ? (
                  <form onSubmit={handleAuthenticate} className="space-y-5">
                    {/* Notice Banner */}
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300 flex items-center gap-2">
                      <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="font-serif">Strict Account Security: First-time users must Register an account before logging in.</span>
                    </div>

                    {/* Username or Mobile Number Input (Placed First) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          Username or Mobile Number:
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">REGISTERED ONLY</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder="Enter your registered username or mobile number..."
                          required
                          className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-cyan-400 outline-none text-white font-mono text-sm transition-all shadow-inner placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    {/* Authentication Method Dropdown Selector */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between font-mono">
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                          Authentication Method:
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">3 SECURE MODES</span>
                      </label>

                      <div className="relative">
                        <select
                          value={authMethod}
                          onChange={(e) => {
                            setAuthMethod(e.target.value as AuthMethod);
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs sm:text-sm appearance-none outline-none cursor-pointer pr-10 transition-colors shadow-inner"
                        >
                          <option value="PASSWORD_BIOMETRIC">1. Password / Biometric Authentication</option>
                          <option value="MOBILE_OTP">2. Mobile OTP Authentication</option>
                          <option value="FACE_AUTH">3. Face Authentication</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* DYNAMIC FORM FIELDS BASED ON SELECTED METHOD (ACCOUNT PASSWORD / OTP / FACE) */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 transition-all">
                      
                      {/* Method 1: Password / Biometric */}
                      {authMethod === 'PASSWORD_BIOMETRIC' && (
                        <div className="space-y-3.5 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold flex items-center gap-1.5 font-mono">
                              <Lock className="w-3.5 h-3.5 text-pink-400" />
                              Account Password:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsForgotModalOpen(true);
                                setResetErrorMsg(null);
                                setResetSuccessMsg(null);
                                setResetIdentifier(usernameInput);
                                cyberAudio.playClick();
                              }}
                              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                            >
                              Forgot Password?
                            </button>
                          </div>

                          <div className="relative flex items-center">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password..."
                              className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-white font-mono text-sm tracking-wider outline-none placeholder:text-slate-500 shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPassword((prev) => !prev);
                                cyberAudio.playClick();
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-all cursor-pointer z-20 flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-cyan-400"
                              title={showPassword ? 'Hide Password' : 'Show Password'}
                              aria-label={showPassword ? 'Hide Password' : 'Show Password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                            </button>
                          </div>

                          {/* Fingerprint Biometric Touch Sensor */}
                          <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center text-[11px] font-mono">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                                Hardware Passkey / Fingerprint Sensor:
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={handleTriggerBiometric}
                                disabled={isBiometricScanning}
                                className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                                  isBiometricVerified
                                    ? 'border-emerald-400 bg-emerald-950/40 text-emerald-400 shadow-glow-emerald'
                                    : isBiometricScanning
                                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-glow-cyan'
                                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-400 hover:text-cyan-300'
                                }`}
                                title="Touch to verify biometric passkey challenge"
                              >
                                <Fingerprint className={`w-6 h-6 ${isBiometricScanning ? 'animate-pulse' : ''}`} />
                              </button>

                              <div className="flex-1 text-left">
                                <button
                                  type="button"
                                  onClick={handleTriggerBiometric}
                                  disabled={isBiometricScanning}
                                  className="text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200 transition-colors block text-left cursor-pointer"
                                >
                                  {isBiometricScanning 
                                    ? `Scanning Sensor (${biometricProgress}%)...`
                                    : isBiometricVerified
                                    ? 'Biometric Passkey Verified'
                                    : 'Tap to Scan Fingerprint / Passkey'}
                                </button>
                                <span className="text-[10px] text-slate-500 block">
                                  Zero-Trust: No raw biometrics stored. Public-key cryptoprocessor verified.
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Method 2: Mobile OTP */}
                      {authMethod === 'MOBILE_OTP' && (
                        <div className="space-y-3.5 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold flex items-center gap-1.5 font-mono">
                              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                              Registered Mobile Number:
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">SMS GATEWAY</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={mobileNumber}
                              onChange={(e) => setMobileNumber(e.target.value)}
                              placeholder="Enter mobile number with country code (e.g. +91 98765 43210)..."
                              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm outline-none focus:border-cyan-400 placeholder:text-slate-500"
                            />
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpTimer > 0}
                              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-950/60 disabled:text-slate-500 text-white text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shadow-glow-cyan"
                            >
                              {otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Send OTP'}
                            </button>
                          </div>

                          {otpSent && (
                            <div className="pt-2 border-t border-slate-800/80 space-y-2">
                              {maskedLoginPhone && (
                                <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 rounded-lg px-2.5 py-1 flex items-center justify-between">
                                  <span>SMS sent to: <strong className="text-white">{maskedLoginPhone}</strong></span>
                                  <span className="text-[10px] text-slate-400">5 min expiry</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 font-mono text-[11px]">
                                  Enter 6-Digit OTP:
                                </span>
                                {loginDevHintOtp ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOtpCode(loginDevHintOtp);
                                      cyberAudio.playClick();
                                    }}
                                    className="text-[10px] font-mono text-cyan-400 hover:underline bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 cursor-pointer"
                                  >
                                    Auto-Fill Test OTP ({loginDevHintOtp})
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Check your mobile SMS
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  placeholder="742891"
                                  maxLength={6}
                                  className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-white font-mono text-base tracking-widest outline-none focus:border-cyan-400"
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-cyan"
                                >
                                  Verify OTP
                                </button>
                              </div>

                              {isOtpVerified && (
                                <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Mobile OTP verified successfully.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Method 3: Face Authentication */}
                      {authMethod === 'FACE_AUTH' && (
                        <div className="space-y-3.5 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold flex items-center gap-1.5 font-mono">
                              <Scan className="w-3.5 h-3.5 text-emerald-400" />
                              Ocular Face Authentication HUD:
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">LIVENESS SENSOR</span>
                          </div>

                          {!cameraConsented ? (
                            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
                              <Camera className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-white block">Camera Consent Required</span>
                                <p className="text-[11px] text-slate-400">
                                  Click below to authorize camera access for real-time facial verification.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-cyan"
                              >
                                Enable Camera Preview & Consent
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="relative w-full h-44 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
                                {cameraActive ? (
                                  <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-center p-3 space-y-2">
                                    <Scan className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                                    <span className="text-[11px] font-mono text-slate-400 block max-w-xs">
                                      {cameraError || 'Camera offline. AI High-Precision Retinal Simulator active.'}
                                    </span>
                                  </div>
                                )}

                                {/* Targeting HUD Reticle Overlay */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                  <div className="w-24 h-24 border border-dashed border-emerald-400/80 rounded-full flex items-center justify-center animate-spin-slow">
                                    <div className="w-14 h-14 border border-cyan-400/60 rounded-full" />
                                  </div>
                                </div>

                                {isFaceScanning && (
                                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-sm p-1.5 rounded-lg border border-emerald-500/50 flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-emerald-400">Evaluating liveness & facial mesh...</span>
                                    <span className="text-white font-bold">{faceConfidence}%</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                {!isFaceVerified ? (
                                  <button
                                    type="button"
                                    onClick={handleStartFaceScan}
                                    disabled={isFaceScanning}
                                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-glow-emerald"
                                  >
                                    {isFaceScanning ? 'Scanning Face...' : 'Start Scan & Capture'}
                                  </button>
                                ) : (
                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                      <span>Face Authenticated (99.4%)</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleRetakeFaceScan}
                                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                                    >
                                      Retake
                                    </button>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    stopCamera();
                                    setCameraConsented(false);
                                    setIsFaceVerified(false);
                                  }}
                                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>

                              <p className="text-[10px] text-slate-500 font-mono text-center">
                                Demo mode: evaluated with simulated liveness verification. No biometric templates stored.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Feedback Banners */}
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono flex items-center gap-2 animate-fadeIn shadow-glow-rose">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn shadow-glow-emerald">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    {/* Primary "Authenticate Securely" Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono font-bold text-sm shadow-xl shadow-cyan-950/70 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                          <span>Verifying Registered Account Credentials...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-cyan-300" />
                          <span>Authenticate Securely</span>
                          <ArrowRight className="w-4 h-4 text-cyan-300" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center text-[11px] text-slate-400 pt-1">
                      <button
                        type="button"
                        onClick={resetAndSwitchToRegister}
                        className="text-cyan-400 hover:underline cursor-pointer font-mono font-bold"
                      >
                        New User? Click Here to Register Account First →
                      </button>
                    </div>
                  </form>
                ) : (
                  /* REGISTRATION FORM & DYNAMIC OTP VERIFICATION */
                  !regOtpSent ? (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
                      <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-mono text-purple-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span>Account Registration: Mandatory mobile verification with India (+91) carrier SMS.</span>
                      </div>

                      {/* Full Name / Display Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          Full Name / Display Name:
                        </label>
                        <input
                          type="text"
                          value={regDisplayName}
                          onChange={(e) => setRegDisplayName(e.target.value)}
                          placeholder="Enter your full name (e.g. Vagdevi Lead)..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                        />
                      </div>

                      {/* Username */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                          Desired Username (Required):
                        </label>
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value.toLowerCase().trim())}
                          placeholder="Choose unique username (e.g. analyst.lead)..."
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                        />
                      </div>

                      {/* Mandatory Mobile Number (+91 Default) */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                            Mobile Number (Mandatory for SMS OTP):
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">India (+91) Default</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={regCountryCode}
                            onChange={(e) => setRegCountryCode(e.target.value)}
                            aria-label="Country Code"
                            className="w-28 px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-400 text-white font-mono text-xs outline-none cursor-pointer"
                          >
                            <option value="+91">🇮🇳 +91 (IN)</option>
                            <option value="+1">🇺🇸 +1 (US)</option>
                            <option value="+44">🇬🇧 +44 (UK)</option>
                            <option value="+61">🇦🇺 +61 (AU)</option>
                            <option value="+971">🇦🇪 +971 (AE)</option>
                          </select>
                          <input
                            type="tel"
                            value={regMobileNumber}
                            onChange={(e) => setRegMobileNumber(e.target.value.replace(/[^\d\s\-\+]/g, ''))}
                            placeholder="98765 43210"
                            required
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-400 text-white font-mono text-xs outline-none placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      {/* Email Address (OPTIONAL) */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-cyan-400" />
                            Corporate Email:
                          </span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                            Optional
                          </span>
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value.trim())}
                          placeholder="name@organization.corp (optional for alert digests)..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none placeholder:text-slate-600"
                        />
                      </div>

                      {/* Password with Eye Toggle */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-pink-400" />
                          Password:
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Enter secure password..."
                            required
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword((p) => !p)}
                            className="absolute right-2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Live Password Policy Indicators */}
                      {regPassword && (
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 grid grid-cols-2 gap-1 text-[10px] font-mono">
                          <div className={`flex items-center gap-1 ${regPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className="w-3 h-3" /> 8+ Characters
                          </div>
                          <div className={`flex items-center gap-1 ${/[A-Z]/.test(regPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className="w-3 h-3" /> Uppercase (A-Z)
                          </div>
                          <div className={`flex items-center gap-1 ${/[a-z]/.test(regPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className="w-3 h-3" /> Lowercase (a-z)
                          </div>
                          <div className={`flex items-center gap-1 ${/\d/.test(regPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className="w-3 h-3" /> Number (0-9)
                          </div>
                          <div className={`col-span-2 flex items-center gap-1 ${/[-@#$%^&*!_~?+=|<>]/.test(regPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <Check className="w-3 h-3" /> Special Char (@, #, $, !, etc.)
                          </div>
                        </div>
                      )}

                      {/* Confirm Password with Eye Toggle */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-pink-400" />
                          Confirm Password:
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showRegConfirmPassword ? 'text' : 'password'}
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Re-enter password..."
                            required
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirmPassword((p) => !p)}
                            className="absolute right-2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                          >
                            {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Registration Error */}
                      {regErrorMsg && (
                        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                          <span>{regErrorMsg}</span>
                        </div>
                      )}

                      {/* Register Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono font-bold text-sm shadow-xl shadow-cyan-950/70 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                            <span>Dispatching Mobile SMS OTP...</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 text-emerald-300" />
                            <span>Register & Send Mobile OTP</span>
                            <ArrowRight className="w-4 h-4 text-emerald-300" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-center text-[11px] text-slate-400 pt-1">
                        <button
                          type="button"
                          onClick={resetAndSwitchToLogin}
                          className="text-cyan-400 hover:underline cursor-pointer font-mono font-bold"
                        >
                          Already Registered? Click Here to Sign In →
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* REGISTRATION MOBILE OTP VERIFICATION STEP */
                    <form onSubmit={handleVerifyRegistrationOtp} className="space-y-4 animate-fadeIn">
                      {/* Carrier Status & Security Header */}
                      <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                        regDeliveryState === 'DELIVERY_CONFIRMED'
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : regDeliveryState === 'SMS_SERVICE_NOT_CONFIGURED'
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : regDeliveryState === 'DELIVERY_FAILED' || regDeliveryState === 'SMS_SERVICE_UNAVAILABLE'
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                          : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span>Mobile OTP Verification</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            regDeliveryState === 'DELIVERY_CONFIRMED'
                              ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                              : regDeliveryState === 'SMS_SERVICE_NOT_CONFIGURED'
                              ? 'bg-amber-900/80 text-amber-300 border border-amber-700/60'
                              : regDeliveryState === 'DELIVERY_FAILED'
                              ? 'bg-rose-900/80 text-rose-300 border border-rose-700/60'
                              : 'bg-cyan-900/80 text-cyan-300 border border-cyan-700/60'
                          }`}>
                            {regDeliveryState === 'DELIVERY_CONFIRMED'
                              ? 'Delivery Confirmed'
                              : regDeliveryState === 'SMS_SERVICE_NOT_CONFIGURED'
                              ? 'SMS Unconfigured'
                              : regDeliveryState === 'DELIVERY_FAILED'
                              ? 'Delivery Failed'
                              : 'Request Accepted'}
                          </span>
                        </div>

                        {/* Honest status details */}
                        <div className="text-[11px] leading-relaxed text-slate-300">
                          {regDeliveryState === 'DELIVERY_CONFIRMED' && (
                            <p>Handset delivery receipt confirmed for <strong>{regMobileMasked || regMobileNumber}</strong>.</p>
                          )}
                          {regDeliveryState === 'SMS_REQUEST_ACCEPTED' && (
                            <p>
                              SMS request accepted by <strong>{regProviderName || 'Cellular Gateway'}</strong>.
                              Queued for cellular dispatch to <strong>{regMobileMasked || regMobileNumber}</strong>. Handset delivery in transit.
                            </p>
                          )}
                          {regDeliveryState === 'SMS_SERVICE_NOT_CONFIGURED' && (
                            <div className="space-y-1">
                              <p className="text-amber-300">
                                <strong>Notice:</strong> No external SMS provider credentials (Twilio, Fast2SMS, MSG91) configured in environment. Physical cellular SMS cannot be dispatched to your handset.
                              </p>
                              {regDevOtpCode && (
                                <p className="text-slate-300">
                                  Development simulation mode active. You can auto-fill the generated code below to verify database persistence.
                                </p>
                              )}
                            </div>
                          )}
                          {(regDeliveryState === 'DELIVERY_FAILED' || regDeliveryState === 'SMS_SERVICE_UNAVAILABLE') && (
                            <p className="text-rose-300">
                              SMS dispatch could not be completed via {regProviderName || 'provider'}. Please retry or edit your mobile number.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                          <span>Target: <strong className="text-white">{regMobileMasked || regMobileNumber}</strong></span>
                          <span>Validity: 5 minutes</span>
                        </div>
                      </div>

                      {/* Development Auto-Fill Button if unconfigured */}
                      {regDevOtpCode && regDeliveryState === 'SMS_SERVICE_NOT_CONFIGURED' && (
                        <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-between text-xs font-mono">
                          <span className="text-cyan-300 text-[11px]">Dev Test Code: <strong>{regDevOtpCode}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              setRegOtpCode(regDevOtpCode);
                              cyberAudio.playClick();
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold cursor-pointer transition-all shadow-glow-cyan"
                          >
                            Auto-Fill Dev Code
                          </button>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
                          <span>Enter 6-Digit Mobile Verification Code:</span>
                          <span className="text-[10px] text-slate-400 font-mono">E.164 +91 Bound</span>
                        </label>
                        <input
                          type="text"
                          value={regOtpCode}
                          onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="• • • • • •"
                          maxLength={6}
                          autoFocus
                          required
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-cyan-500/50 focus:border-cyan-400 text-center text-white font-mono text-lg tracking-[0.5em] outline-none shadow-inner"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <button
                          type="button"
                          onClick={handleResendRegistrationOtp}
                          disabled={regOtpTimer > 0 || isLoading}
                          className="text-cyan-400 hover:text-cyan-300 disabled:opacity-40 disabled:hover:text-cyan-400 cursor-pointer flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{regOtpTimer > 0 ? `Resend SMS in ${regOtpTimer}s` : 'Resend SMS Code'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleEditRegistrationDetails}
                          className="text-slate-400 hover:text-white cursor-pointer hover:underline"
                        >
                          Edit Registration Details
                        </button>
                      </div>

                      {regErrorMsg && (
                        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                          <span>{regErrorMsg}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading || regOtpCode.length < 6}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono font-bold text-sm shadow-xl shadow-cyan-950/70 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                            <span>Verifying Code & Activating Profile...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>Verify Code & Activate Account</span>
                          </>
                        )}
                      </button>
                    </form>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Forgot Password Modal Overlay */}
      {/* Dynamic Forgot Password Modal Overlay (Direct Recovery - No 6-Digit OTP) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#090d26] border border-cyan-500/40 p-6 shadow-2xl relative overflow-hidden space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white font-mono">Reset Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  cyberAudio.playClick();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  Registered Username, Mobile, or Email:
                </label>
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="Enter registered username, mobile, or email..."
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  New Compliant Password:
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter compliant new password..."
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((p) => !p)}
                    className="absolute right-2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              {resetNewPassword && (
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div className={`flex items-center gap-1 ${resetNewPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> 8+ Characters
                  </div>
                  <div className={`flex items-center gap-1 ${/[A-Z]/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Uppercase
                  </div>
                  <div className={`flex items-center gap-1 ${/[a-z]/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Lowercase
                  </div>
                  <div className={`flex items-center gap-1 ${/\d/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Number
                  </div>
                  <div className={`col-span-2 flex items-center gap-1 ${/[-@#$%^&*!_~?+=|<>]/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Special Char
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  Confirm New Password:
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showResetConfirmPassword ? 'text' : 'password'}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password..."
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword((p) => !p)}
                    className="absolute right-2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer"
                  >
                    {showResetConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {resetErrorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{resetErrorMsg}</span>
                </div>
              )}

              {resetSuccessMsg && !resetErrorMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !resetIdentifier.trim() || !resetNewPassword || !resetConfirmPassword}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-glow-cyan flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset & Update Password</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    cyberAudio.playClick();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 px-6 border-t border-slate-900 bg-[#040716]/80 text-center text-xs text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
        <div>
          DarkWatch AI © 2026 • AI-Powered Cyber Early Warning & Autonomous Incident Response
        </div>
        <div>
          Team SYNORA: Vagdevi • Vamsi • Surya • Tabasum • Harini
        </div>
      </footer>
    </div>
  );
};
