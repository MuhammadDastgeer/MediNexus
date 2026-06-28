import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  LogIn, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  BookOpen, 
  Clock, 
  Lock, 
  HeartPulse, 
  CheckCircle2, 
  FileText, 
  ChevronRight,
  UserCheck,
  Shield,
  Briefcase,
  X,
  Plus,
  Compass,
  ArrowUpRight,
  BadgeAlert,
  Sliders,
  DollarSign,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Doctor, Patient, Staff, Bill, Appointment } from '../types';

interface LandingPageViewProps {
  doctors: Doctor[];
  blogPosts: any[];
  patients: Patient[];
  staffList: Staff[];
  bills: Bill[];
  appointments: Appointment[];
  hospitalSettings: Record<string, string>;
  onNavigateToAdmin: () => void;
  onAddEnquiry: (name: string, phone: string, query: string) => void;
  loggedInUser: { role: 'patient' | 'doctor' | 'staff'; data: any; isAiUser?: boolean } | null;
  setLoggedInUser: (user: { role: 'patient' | 'doctor' | 'staff'; data: any; isAiUser?: boolean } | null) => void;
  onNavigate: (view: any) => void;
  onSignupPatient: (patientInput: any) => Promise<void>;
}

export default function LandingPageView({
  doctors,
  blogPosts,
  patients,
  staffList,
  bills,
  appointments,
  hospitalSettings,
  onNavigateToAdmin,
  onAddEnquiry,
  loggedInUser,
  setLoggedInUser,
  onNavigate,
  onSignupPatient
}: LandingPageViewProps) {
  // Tabs: 'home' | 'about' | 'doctor' | 'blog' | 'contact'
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'doctor' | 'blog' | 'contact'>('home');
  
  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAiLoginMode, setIsAiLoginMode] = useState(false);
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor' | 'staff'>('patient');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup states
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupGender, setSignupGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [signupDob, setSignupDob] = useState('');
  const [signupBloodGroup, setSignupBloodGroup] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [alsoRegisterAsPatient, setAlsoRegisterAsPatient] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // New states for show/hide password toggle
  const [showPassword, setShowPassword] = useState(false);

  // New states for Forgot Password screen (without email verification)
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Password override dictionary in memory so they can reset and log in immediately
  const [passwordOverrides, setPasswordOverrides] = useState<Record<string, string>>({});

  // Inquiry/Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactQuery, setContactQuery] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Dynamic Consultation Estimator State
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<'any' | 'male' | 'female'>('any');
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [estimatedDoctors, setEstimatedDoctors] = useState<Doctor[]>([]);

  const getSafePathname = (): string => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        return window.location.pathname || '/';
      }
    } catch (e) {
      console.warn("Could not access window.location.pathname:", e);
    }
    return '/';
  };

  // Open the Login modal and sync the route path with the selected credential role
  const openLoginModal = (role: 'patient' | 'doctor' | 'staff' = 'patient', isAiLogin: boolean = false) => {
    setLoginRole(role);
    setIsAiLoginMode(isAiLogin);
    setLoginError('');
    setShowLoginModal(true);
    setShowSignupModal(false);
    setIsForgotMode(false);
    setForgotEmail('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotSuccessMessage('');
    setForgotError('');
    setShowPassword(false);

    try {
      if (isAiLogin) {
        window.history.pushState(null, '', '/login');
      } else if (role === 'patient') {
        window.history.pushState(null, '', '/patient/login');
      } else if (role === 'doctor') {
        window.history.pushState(null, '', '/doctor/login');
      } else if (role === 'staff') {
        window.history.pushState(null, '', '/login/staff');
      }
    } catch (e) {
      console.warn("history.pushState is restricted:", e);
    }
  };

  // Open the Signup modal and sync the route path
  const openSignupModal = () => {
    setShowSignupModal(true);
    setShowLoginModal(false);
    setIsAiLoginMode(true);
    setAlsoRegisterAsPatient(false);
    setSignupError('');
    setSignupSuccess('');
    try {
      window.history.pushState(null, '', '/signup');
    } catch (e) {
      console.warn("history.pushState is restricted:", e);
    }
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    try {
      const currentTabPath = activeTab === 'home' ? '' : activeTab;
      window.history.pushState(null, '', `/${currentTabPath}`);
    } catch (e) {
      console.warn("history.pushState is restricted:", e);
    }
  };

  // Safe tab selection/routing updates for login roles inside modal
  const handleRoleChange = (role: 'patient' | 'doctor' | 'staff') => {
    setLoginRole(role);
    setLoginError('');
    setIsForgotMode(false);
    setForgotEmail('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotSuccessMessage('');
    setForgotError('');
    setShowPassword(false);

    try {
      if (role === 'patient') {
        window.history.pushState(null, '', '/login');
      } else if (role === 'doctor') {
        window.history.pushState(null, '', '/doctor/login');
      } else if (role === 'staff') {
        window.history.pushState(null, '', '/login/staff');
      }
    } catch (e) {
      console.warn("history.pushState is restricted:", e);
    }
  };

  // Closes the modal and returns the URL route cleanly to the current active tab
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setIsForgotMode(false);
    setForgotEmail('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotSuccessMessage('');
    setForgotError('');
    setShowPassword(false);

    try {
      const currentTabPath = activeTab === 'home' ? '' : activeTab;
      window.history.pushState(null, '', `/${currentTabPath}`);
    } catch (e) {
      console.warn("history.pushState is restricted:", e);
    }
  };

  // Sync URL routing pathname and query mapping (including deep linking /patient/login, /doctor/login, /login/staff)
  useEffect(() => {
    const handleUrlRouting = () => {
      try {
        const path = getSafePathname().toLowerCase().replace(/^\/+/g, '').replace(/\/+$/g, '');
        
        if (path === 'login') {
          setActiveTab('home');
          setIsAiLoginMode(true);
          setLoginRole('patient');
          setShowLoginModal(true);
          setShowSignupModal(false);
        } else if (path === 'patient/login' || path === 'patient-login') {
          setActiveTab('home');
          setIsAiLoginMode(false);
          setLoginRole('patient');
          setShowLoginModal(true);
          setShowSignupModal(false);
        } else if (path === 'doctor/login' || path === 'doctor-login') {
          setActiveTab('home');
          setLoginRole('doctor');
          setShowLoginModal(true);
          setShowSignupModal(false);
        } else if (path === 'login/staff' || path === 'login-staff') {
          setActiveTab('home');
          setLoginRole('staff');
          setShowLoginModal(true);
          setShowSignupModal(false);
        } else if (path === 'signup') {
          setActiveTab('home');
          setShowSignupModal(true);
          setShowLoginModal(false);
        } else if (path === 'about') {
          setActiveTab('about');
          setShowLoginModal(false);
          setShowSignupModal(false);
        } else if (path === 'doctor' || path === 'doctors') {
          setActiveTab('doctor');
          setShowLoginModal(false);
          setShowSignupModal(false);
        } else if (path === 'blog' || path === 'blogs') {
          setActiveTab('blog');
          setShowLoginModal(false);
          setShowSignupModal(false);
        } else if (path === 'contact') {
          setActiveTab('contact');
          setShowLoginModal(false);
          setShowSignupModal(false);
        } else {
          setActiveTab('home');
          // Do not force showLoginModal off if we are already in login/signup paths, but if they navigated to home manually, close it.
          if (path !== 'patient/login' && path !== 'doctor/login' && path !== 'login/staff' && path !== 'login' && path !== 'signup') {
            setShowLoginModal(false);
            setShowSignupModal(false);
          }
        }
      } catch (e) {
        console.warn("Could not read current path for routing:", e);
      }
    };

    handleUrlRouting();
    try {
      window.addEventListener('popstate', handleUrlRouting);
    } catch (e) {
      console.warn("Could not add popstate listener:", e);
    }
    return () => {
      try {
        window.removeEventListener('popstate', handleUrlRouting);
      } catch (e) {
        console.warn("Could not remove popstate listener:", e);
      }
    };
  }, [activeTab]);

  // Update Dynamic Estimator when specialization changes
  useEffect(() => {
    if (!selectedSpec) {
      setEstimatedFee(null);
      setEstimatedDoctors([]);
      return;
    }
    const filtered = doctors.filter(d => d.specialization?.toLowerCase() === selectedSpec.toLowerCase());
    setEstimatedDoctors(filtered);
    if (filtered.length > 0) {
      const avgFee = Math.round(filtered.reduce((sum, d) => sum + Number(d.consultationFee || 50), 0) / filtered.length);
      setEstimatedFee(avgFee);
    } else {
      setEstimatedFee(50); // Fallback standard
    }
  }, [selectedSpec, doctors]);

  const changeTab = (tab: 'home' | 'about' | 'doctor' | 'blog' | 'contact') => {
    setActiveTab(tab);
    try {
      window.history.pushState(null, '', `/${tab === 'home' ? '' : tab}`);
    } catch (e) {
      console.warn("history.pushState is restricted:", e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both email address and your password.');
      return;
    }

    const inputEmailNormalized = loginEmail.trim().toLowerCase();

    if (isAiLoginMode) {
      try {
        const response = await fetch('/api/ai-assistant/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inputEmailNormalized, password: loginPassword }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setLoggedInUser({ role: result.role, data: result.data, isAiUser: true });
          setLoginEmail('');
          setLoginPassword('');
          closeLoginModal();
          onNavigate('ai-assistant');
        } else {
          setLoginError(result.error || 'Login failed. Please check credentials.');
        }
      } catch (err: any) {
        setLoginError('Server error occurred during login. Please try again.');
      }
      return;
    }

    if (loginRole === 'patient') {
      const patient = patients.find(p => p.email?.toLowerCase() === inputEmailNormalized);
      if (patient) {
        const expectedPassword = passwordOverrides[inputEmailNormalized] || patient.password;
        if (expectedPassword === loginPassword) {
          setLoggedInUser({ role: 'patient', data: patient });
          setLoginEmail('');
          setLoginPassword('');
          closeLoginModal();
          onNavigate('dashboard');
        } else {
          setLoginError('Invalid Patient record access key / password.');
        }
      } else {
        setLoginError('No matching patient profile found for this email address.');
      }
    } else if (loginRole === 'doctor') {
      const doctor = doctors.find(d => d.email?.toLowerCase() === inputEmailNormalized);
      if (doctor) {
        const expectedPassword = passwordOverrides[inputEmailNormalized] || doctor.password;
        if (expectedPassword === loginPassword) {
          setLoggedInUser({ role: 'doctor', data: doctor });
          setLoginEmail('');
          setLoginPassword('');
          closeLoginModal();
          onNavigate('dashboard');
        } else {
          setLoginError('Invalid Doctor profile password.');
        }
      } else {
        setLoginError('No matching medical clinician profile found with this email.');
      }
    } else if (loginRole === 'staff') {
      const staff = staffList.find(s => s.email?.toLowerCase() === inputEmailNormalized);
      if (staff) {
        const expectedPassword = passwordOverrides[inputEmailNormalized] || staff.password;
        if (expectedPassword === loginPassword) {
          setLoggedInUser({ role: 'staff', data: staff });
          setLoginEmail('');
          setLoginPassword('');
          closeLoginModal();
          onNavigate('dashboard');
        } else {
          setLoginError('Invalid Administrator/Staff credential password.');
        }
      } else {
        setLoginError('No matching staff ledger coordinate found.');
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim() || !signupPhone.trim()) {
      setSignupError('Please fill in Name, Email, Password, and Phone Number.');
      return;
    }

    const emailNormalized = signupEmail.trim().toLowerCase();

    if (isAiLoginMode) {
      try {
        const response = await fetch('/api/ai-assistant/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: signupName.trim(),
            email: emailNormalized,
            password: signupPassword,
            phone: signupPhone.trim(),
            age: Number(signupAge) || 25,
            gender: signupGender,
            dob: signupDob || null,
            bloodGroup: signupBloodGroup || null,
            address: signupAddress.trim() || null,
            alsoRegisterAsPatient: alsoRegisterAsPatient
          })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setSignupSuccess('AI Assistant Portal Account created successfully! Auto-logging in...');
          setLoggedInUser({ role: 'patient', data: result.user, isAiUser: true });
          
          if (alsoRegisterAsPatient && onSignupPatient) {
            onSignupPatient({
              id: result.user.id,
              name: result.user.name,
              age: result.user.age,
              gender: result.user.gender,
              phone: result.user.phone,
              email: result.user.email,
              password: result.user.password,
              dob: result.user.dob,
              bloodGroup: result.user.bloodGroup,
              address: result.user.address,
              status: 'Active'
            });
          }

          setTimeout(() => {
            setShowSignupModal(false);
            onNavigate('ai-assistant');
          }, 1500);
        } else {
          setSignupError(result.error || 'Registration failed.');
        }
      } catch (err: any) {
        setSignupError('Server error occurred during signup. Please try again.');
      }
      return;
    }

    // Check if email already exists
    const emailExists = patients.some(p => p.email?.toLowerCase() === emailNormalized) ||
                        doctors.some(d => d.email?.toLowerCase() === emailNormalized) ||
                        staffList.some(s => s.email?.toLowerCase() === emailNormalized);

    if (emailExists) {
      setSignupError('This email is already registered. Please login instead.');
      return;
    }

    const newPatientId = `pat-${Date.now().toString().slice(-4)}`;
    const newPat: Patient = {
      id: newPatientId,
      name: signupName.trim(),
      email: emailNormalized,
      password: signupPassword,
      phone: signupPhone.trim(),
      age: Number(signupAge) || 25,
      gender: signupGender,
      dob: signupDob || undefined,
      bloodGroup: signupBloodGroup || undefined,
      address: signupAddress.trim() || undefined,
      status: 'New',
      registeredAt: new Date().toISOString()
    };

    try {
      await onSignupPatient(newPat);
      setSignupSuccess('Account created successfully! Auto-logging in and redirecting...');
      setLoggedInUser({ role: 'patient', data: newPat });

      setTimeout(() => {
        setShowSignupModal(false);
        onNavigate('ai-assistant');
      }, 1500);

    } catch (err: any) {
      setSignupError(err?.message || 'An error occurred during sign up. Please try again.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccessMessage('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    if (!forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      setForgotError('Please fill in both password fields.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New password and confirm password fields do not match.');
      return;
    }

    const emailNorm = forgotEmail.trim().toLowerCase();

    // Verify account exists based on currently active loginRole
    let accountFound = false;
    if (loginRole === 'patient') {
      accountFound = patients.some(p => p.email?.toLowerCase() === emailNorm);
    } else if (loginRole === 'doctor') {
      accountFound = doctors.some(d => d.email?.toLowerCase() === emailNorm);
    } else if (loginRole === 'staff') {
      accountFound = staffList.some(s => s.email?.toLowerCase() === emailNorm);
    }

    if (!accountFound) {
      setForgotError(`No registered ${loginRole} account found matching the email address: ${forgotEmail}`);
      return;
    }

    // Overriding the password
    setPasswordOverrides(prev => ({
      ...prev,
      [emailNorm]: forgotNewPassword
    }));

    setForgotSuccessMessage(`Verification complete. Your ${loginRole} password has been updated successfully!`);
    
    // Clear forgot inputs after success wait
    setTimeout(() => {
      setIsForgotMode(false);
      // Populate login input for a smooth flow transition
      setLoginEmail(forgotEmail);
      setForgotEmail('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotSuccessMessage('');
    }, 2500);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactQuery.trim()) {
      return;
    }
    onAddEnquiry(contactName, contactPhone, contactQuery);
    setContactSuccess(true);
    setContactName('');
    setContactPhone('');
    setContactQuery('');
    setTimeout(() => setContactSuccess(false), 6000);
  };

  // Extract variables with defaults
  const instName = hospitalSettings.hospitalName || 'Hope Care Medical Complex';
  const instWebsite = hospitalSettings.website || 'www.hopecaremedical.com';
  const instAddress = hospitalSettings.address || '742 Cyber Linkage Blvd, North Sector Area';
  const instPhone = hospitalSettings.phone || '+1 (555) 309-8472';
  const instEmail = hospitalSettings.email || 'care@hopecaremedical.com';
  const instTimezone = hospitalSettings.timezone || 'UTC+05:30 / Asia-Kolkata';
  const instReg = hospitalSettings.regNo || 'MED-CL-9482-SYS';

  // Extract unique specializations list for consultation estimator dropdown
  const specializations = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));

  // Calculate live numbers
  const liveAdmittedCount = patients.filter(p => p.wardId).length;
  const liveOverdueAppts = appointments.filter(a => a.status === 'Overdue').length;
  const processedBillsCount = bills.filter(b => b.status === 'Paid').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-emerald-500 selection:text-white" id="public-landing-root">
      
      {/* 1. TOP BRANDING INFOBAR */}
      <div className="bg-slate-900 text-slate-300 px-6 py-2 text-xs flex flex-wrap items-center justify-between border-b border-slate-800 gap-2 font-mono" id="top-branding-bar">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Live Systems Online
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">Reg: {instReg}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync: {instTimezone}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-semibold">{instPhone}</span>
        </div>
      </div>

      {/* 2. STICKY GLASSMORPHIC NAVBAR */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-6 py-4 flex items-center justify-between shadow-xs" id="landing-navbar">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => changeTab('home')}>
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/10 transition-transform group-hover:scale-105 duration-300">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight block leading-tight">{instName}</span>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Accredited Clinical Complex</span>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/40" id="nav-tabs-wrapper">
          {(['home', 'about', 'doctor', 'blog', 'contact'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
              } capitalize`}
              id={`tab-btn-${tab}`}
            >
              {tab === 'doctor' ? 'Clinical Specialists' : tab === 'blog' ? 'Health Blogs' : tab === 'contact' ? 'Support Desk' : tab}
            </button>
          ))}
          <button
            onClick={() => {
              if (loggedInUser) {
                onNavigate('ai-assistant');
              } else {
                openLoginModal('patient', true);
              }
            }}
            className="px-4.5 py-2 rounded-xl text-xs font-extrabold transition-all bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs hover:from-emerald-600 hover:to-teal-700 flex items-center gap-1.5 active:scale-95 cursor-pointer ml-1"
            id="landing-ai-assistant-tab"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2" id="nav-actions">
          {loggedInUser ? (
            <div className="flex items-center gap-2">
              <div className="bg-emerald-50/80 border border-emerald-100/60 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-900 capitalize">
                  {loggedInUser.role}: {loggedInUser.data?.name}
                </span>
              </div>
              <button 
                onClick={() => setLoggedInUser(null)}
                className="text-xs text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl font-bold transition-all border border-rose-100 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openLoginModal('patient', true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                id="ai-login-btn"
              >
                <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>AI Assistant Login</span>
              </button>

              <button
                onClick={() => openLoginModal('patient', false)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                id="main-login-btn"
              >
                <LogIn className="w-4 h-4 text-slate-600" />
                <span>Clinical Portal Login</span>
              </button>

              <button
                onClick={() => openSignupModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#007f6e] border border-emerald-150 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                id="main-signup-btn"
              >
                <Plus className="w-4 h-4 text-[#007f6e]" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          <button
            onClick={onNavigateToAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition-all ml-1 active:scale-95"
            id="to-admin-dashboard-btn"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>
              {loggedInUser
                ? (loggedInUser.role === 'patient'
                    ? "Patient Console"
                    : loggedInUser.role === 'doctor'
                      ? "Doctor Console"
                      : "Staff Console")
                : "Admin Console"}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10" id="landing-main-content">
        
        {/* If a user is logged in, prioritize showing their personalized Portal Workspace */}
        {loggedInUser && (
          <div className="mb-12 bg-white border border-emerald-100 rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-200/30 relative overflow-hidden animate-slide-up" id="user-portal-workspace">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <UserCheck className="w-56 h-56 text-emerald-600" />
            </div>

            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full">
                  <Shield className="w-3 h-3" /> Secure Personal Portal
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2 capitalize">
                  Welcome Back, {loggedInUser.data.name}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Authorized Patient Ledger & Consultation Records Tracker</p>
              </div>
              <button
                onClick={() => setLoggedInUser(null)}
                className="text-xs text-rose-500 font-bold hover:bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 transition-all"
              >
                Disconnect Session
              </button>
            </div>

            {/* Portal Specific View based on loggedInUser role */}
            {loggedInUser.role === 'patient' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Patient Info Card */}
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" /> Demographic Profile
                    </h3>
                    <div className="space-y-3.5 text-xs text-slate-650">
                      <p className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Ledger Patient ID</span>
                        <span className="font-mono text-slate-800 font-bold">{loggedInUser.data.id}</span>
                      </p>
                      <p className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Ages / Gender Type</span>
                        <span className="text-slate-800 font-bold">{loggedInUser.data.age} Yrs / {loggedInUser.data.gender}</span>
                      </p>
                      <p className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Blood Class Badge</span>
                        <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{loggedInUser.data.bloodGroup || 'O+'}</span>
                      </p>
                      <p className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Mobile Hotline</span>
                        <span className="text-slate-800 font-bold">{loggedInUser.data.phone}</span>
                      </p>
                      <p className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Official Email</span>
                        <span className="text-slate-800 font-bold text-right break-all max-w-[150px]">{loggedInUser.data.email || 'N/A'}</span>
                      </p>
                      <p className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Billing Address</span>
                        <span className="text-slate-800 text-right truncate max-w-[150px] font-semibold" title={loggedInUser.data.address}>{loggedInUser.data.address || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/50">
                    <p className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold">IPD Admitted:</span>
                      {loggedInUser.data.wardId ? (
                        <span className="bg-amber-100 text-amber-850 px-2.5 py-1 rounded-lg font-extrabold text-[10px]">
                          Ward: {loggedInUser.data.wardId} (Bed {loggedInUser.data.bedNumber})
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold bg-slate-200/60 px-2.5 py-0.5 rounded-lg text-[10px]">Outpatient Base</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 2. Appointments Log */}
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" /> Prescheduled Appointments
                    </h3>
                    
                    {appointments.filter(a => a.patientName?.toLowerCase() === loggedInUser.data.name?.toLowerCase()).length === 0 ? (
                      <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center text-slate-400 text-xs">
                        No active consultation appointments registered under your profile name.
                      </div>
                    ) : (
                      <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                        {appointments
                          .filter(a => a.patientName?.toLowerCase() === loggedInUser.data.name?.toLowerCase())
                          .map((appt) => (
                            <div key={appt.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-xs">
                              <div>
                                <p className="text-xs font-bold text-slate-900">Dr. {appt.doctorName}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{appt.specialization}</p>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-semibold font-mono">
                                  <span>📅 {appt.date}</span>
                                  <span>•</span>
                                  <span>⏰ {appt.time}</span>
                                </div>
                              </div>
                              <div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase ${
                                  appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                  appt.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                                  appt.status === 'Overdue' ? 'bg-amber-100 text-amber-800' :
                                  'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {appt.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Patient Bills */}
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" /> Itemized Billing Statements & Invoices
                    </h3>
                    {bills.filter(b => b.patientName?.toLowerCase() === loggedInUser.data.name?.toLowerCase()).length === 0 ? (
                      <div className="bg-white border border-slate-100 p-6 rounded-2xl text-center text-slate-400 text-xs text-medium">
                        No unpaid or paid hospital ledger invoices are currently billed to you.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[180px] pr-1">
                        {bills
                          .filter(b => b.patientName?.toLowerCase() === loggedInUser.data.name?.toLowerCase())
                          .map((bill) => (
                            <div key={bill.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-xs">
                              <div>
                                <p className="text-xs font-extrabold text-slate-700">{bill.id}</p>
                                <p className="text-[10px] text-slate-450 mt-1">Released: {bill.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-slate-900">${Number(bill.amount).toLocaleString()}</p>
                                <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {bill.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {loggedInUser.role === 'doctor' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Card */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Professional Credentials
                  </h3>
                  <div className="space-y-3 text-xs text-slate-650">
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Standard Specialization</span>
                      <span className="text-slate-900 font-bold">{loggedInUser.data.specialization}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Assigned Department</span>
                      <span className="text-slate-800 font-semibold">{loggedInUser.data.department || 'Outpatients'}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Total Practice Tenure</span>
                      <span className="text-slate-800 font-bold">{loggedInUser.data.experience || '5'} Years</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Clinical Medical Reg No</span>
                      <span className="text-slate-800 font-mono font-bold">{loggedInUser.data.medicalRegNo || 'REG-8592'}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Base Consultant Fee</span>
                      <span className="text-slate-900 font-extrabold">${loggedInUser.data.consultationFee || '50'}</span>
                    </p>
                    <p className="flex justify-between pb-1">
                      <span className="text-slate-400">Current Roster Status</span>
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-extrabold text-[10px]">
                        {loggedInUser.data.status || 'Active Duty'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Patient Consultations list */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 lg:col-span-2">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" /> Scheduled Patient Consultations
                  </h3>

                  {appointments.filter(a => a.doctorName?.toLowerCase() === loggedInUser.data.name?.toLowerCase()).length === 0 ? (
                    <div className="bg-white border border-slate-100 p-10 rounded-2xl text-center text-slate-400 text-xs">
                      No active patient consultations are on queue for you at this hour.
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[280px]">
                      {appointments
                        .filter(a => a.doctorName?.toLowerCase() === loggedInUser.data.name?.toLowerCase())
                        .map((appt) => (
                          <div key={appt.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-xs">
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">{appt.patientName}</p>
                              <p className="text-[10px] text-slate-400 mt-1">Calendar Slot: {appt.date} • {appt.time}</p>
                            </div>
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-slate-150 text-slate-700 rounded-lg border border-slate-200">
                              {appt.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {loggedInUser.role === 'staff' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Bio */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" /> Active Service Contract
                  </h3>
                  <div className="space-y-3 text-xs text-slate-650">
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Assigned Facility Role</span>
                      <span className="text-slate-900 font-bold">{loggedInUser.data.role}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Operating Department</span>
                      <span className="text-slate-800 font-semibold">{loggedInUser.data.department}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Contract Integrity</span>
                      <span className="bg-emerald-150 text-emerald-900 border border-emerald-250 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">{loggedInUser.data.status}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Registered Phone</span>
                      <span className="text-slate-800 font-mono font-bold">{loggedInUser.data.phone || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between pb-1">
                      <span className="text-slate-400">Onboarding Calendar</span>
                      <span className="text-slate-500 font-mono font-bold">{loggedInUser.data.joinDate || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Payroll Details card */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 lg:col-span-2">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" /> Sensitive Bank & Payroll Ledger
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-650 bg-white p-5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Contract Base Salary</span>
                      <span className="text-xl font-black text-slate-905">${Number(loggedInUser.data.monthlySalary || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">/mo</span></span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Bank Provider</span>
                      <span className="text-xs font-bold text-slate-800">{loggedInUser.data.bankName || 'Provident Credit Bank'}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Account Number</span>
                      <span className="text-xs font-mono font-bold text-slate-800">{loggedInUser.data.bankAccountNo || '•••• •••• ••••'}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Reg TAX Identifier</span>
                      <span className="text-xs font-mono font-extrabold text-slate-700">{loggedInUser.data.panNo || 'TAX-9482-AD'}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Provident Account</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">{loggedInUser.data.pfAccountNo || 'PF-0925-ST'}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">UAN Identifier</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">{loggedInUser.data.pfUan || 'UAN-38194'}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-12" id="home-view-container">
            
            {/* Elegant Hero Section */}
            <section className="bg-slate-900 rounded-3xl p-6 md:p-10 lg:p-14 text-white relative overflow-hidden shadow-xl" id="hero-section">
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center relative z-10">
                <div className="lg:col-span-3 space-y-6">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wider uppercase rounded-full border border-emerald-500/20">
                    <Shield className="w-3.5 h-3.5" /> Healthcare Standards Redefined
                  </span>
                  
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                    Advanced Medical Care. <br />
                    <span className="text-emerald-400">Simpler Process.</span>
                  </h1>
                  
                  <p className="text-slate-400 text-xs sm:text-sm lg:text-base leading-relaxed font-medium">
                    Welcome to <span className="text-emerald-300 font-bold">{instName}</span>, your premier medical center. We coordinate dynamic specialist bookings, secure electronic charts, 24/7 inpatient ward allotments, and advanced medicine trackers into one single ecosystem.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={() => {
                        if (loggedInUser) {
                          onNavigate('ai-assistant');
                        } else {
                          openLoginModal('patient', true);
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg shadow-teal-500/25 transition-all text-xs flex items-center gap-2 active:scale-95 duration-200 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                      <span>AI Medical Assistant (Text/Voice/File)</span>
                    </button>
                    <button
                      onClick={() => changeTab('doctor')}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700/60 font-extrabold rounded-xl transition-all text-xs flex items-center gap-2 active:scale-95 duration-200 cursor-pointer"
                    >
                      <span>Consult With Expert Doctors</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => changeTab('contact')}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700/60 font-extrabold rounded-xl transition-all text-xs active:scale-95 duration-200 cursor-pointer"
                    >
                      Request Support Helpdesk
                    </button>
                  </div>
                </div>

                {/* ADVANCED CLINICAL ESTIMATOR CONCIERGE AT THE HERO PAGE */}
                <div className="lg:col-span-2 bg-slate-850/90 border border-slate-750 p-6 rounded-3xl shadow-2xl relative overflow-hidden" id="hero-concierge-card">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Compass className="w-36 h-36 text-emerald-400" />
                  </div>
                  
                  <div className="border-b border-slate-750/70 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-400">Clinical Tools</span>
                      <h3 className="text-xs font-extrabold text-white mt-1">Fee & Specialist Calculator</h3>
                    </div>
                    <Sliders className="w-4 h-4 text-slate-400" />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal mb-4 font-medium">
                    Select a core clinical specialization to dynamically parse doctors on call and estimate baseline outpatient consultation charges.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 block">Select Specialization Area</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs font-medium"
                        value={selectedSpec}
                        onChange={(e) => setSelectedSpec(e.target.value)}
                      >
                        <option value="">-- Choose One Speciality --</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold tracking-wider uppercase text-slate-400 block font-sans">Practitioner Gender Preference</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['any', 'male', 'female'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setSelectedGender(g)}
                            className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                              selectedGender === g 
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' 
                                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedSpec && (
                      <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl relative animate-fade-in mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Charges</span>
                          <span className="text-lg font-black text-emerald-400">${estimatedFee}*</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal font-sans">
                          *Based on {estimatedDoctors.length} verified clinical officers on duty. Exact charges may update at the billing registry counter.
                        </p>
                        
                        {estimatedDoctors.length > 0 ? (
                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[9px] text-emerald-400 font-mono tracking-wider block uppercase mb-1.5">Direct Enlisted Clinicians</span>
                            <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                              {estimatedDoctors.map(doc => (
                                <div key={doc.id} className="flex justify-between items-center text-[10px] text-slate-300">
                                  <span className="font-semibold">Dr. {doc.name}</span>
                                  <span className="bg-slate-800 text-slate-400 font-mono text-[9px] px-1.5 py-0.5 rounded">Fee: ${doc.consultationFee}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9px] text-rose-400 font-bold pt-1">No doctor profiles configured under this label presently.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Quick Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6" id="stats-section">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-xs flex items-center gap-4 transition-all hover:translate-y-[-2px]">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <UserCheck className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-slate-900 leading-tight">{doctors.length || '15'} Experts</span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Clinical Officers</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-xs flex items-center gap-4 transition-all hover:translate-y-[-2px]">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-slate-900 leading-tight">{patients.length || '120'} Patients</span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Verified Records</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-xs flex items-center gap-4 transition-all hover:translate-y-[-2px]">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <BookOpen className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-slate-900 leading-tight">{blogPosts.length || '8'} Articles</span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Medical Advisory</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-xs flex items-center gap-4 transition-all hover:translate-y-[-2px]">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <HeartPulse className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-slate-900 leading-tight">{liveAdmittedCount} Admitted</span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">IPD Ward Beds Occupied</span>
                </div>
              </div>
            </section>

            {/* HIGHLY PROFESSIONAL STRUCTURAL INFORMATION BENTO */}
            <section className="space-y-6" id="bento-cards-hospital">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-extrabold text-emerald-600 tracking-wider font-mono">OPERATIONAL METRICS</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Our Operational Presence</h2>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-normal">
                  Registered clinical data centers, electronic support routing pathways, and synchronized hospital system configurations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Official Coordinates */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <MapPin className="w-5 h-5 text-slate-800" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">Registered Address Coordinates</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      {instAddress}
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                    <span>HQ Precinct</span>
                    <span>Geo-Loc Verified</span>
                  </div>
                </div>

                {/* Card 2: Digital Channels */}
                <div className="bg-emerald-600 outline-emerald-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-700/10 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-250">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Digital Contact Channels</h3>
                    <div className="space-y-2 text-xs text-emerald-100 font-bold font-mono">
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                        <span>{instEmail}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                        <span>{instPhone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                        <span className="underline">{instWebsite}</span>
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-emerald-500/40 pt-4 flex items-center justify-between text-[11px] font-mono text-emerald-100 uppercase">
                    <span>Support Desk Line</span>
                    <span>24 Hour Intake</span>
                  </div>
                </div>

                {/* Card 3: Clinical System Timezone */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-700" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">Hospital Timezone & Calendar</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      This medical scheduling registry strictly runs on: <br />
                      <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2.5 py-1 rounded-lg inline-block mt-2 text-[10px]">
                        {instTimezone}
                      </span>
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                    <span>Precision Sync</span>
                    <span>Automated GMT</span>
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

        {/* 2. ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="space-y-8 animate-fade-in" id="about-view-container">
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wider uppercase rounded-full">
                Global Healthcare Vision
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Our Core Mission & Values</h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                Explore how {instName} delivers pristine medical records management, active digital inpatient ward assignments, and continuous quality circles.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center bg-white p-6 lg:p-10 rounded-3xl border border-slate-200/60 shadow-sm">
              <div className="lg:col-span-3 space-y-5">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest font-mono">Continuous Quality Circle</span>
                <h3 className="text-lg lg:text-xl font-bold text-slate-950 leading-tight">Empowering Clinical Teams. Advancing Patient Outcomes with absolute precision.</h3>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our comprehensive, full-stack hospital workspace coordinates workflow operations across all critical segments (Outpatient consults, Billing registry, Ward Bed mappings, and Medicine supplies). By managing transparent medical profiles, we prevent system fatigue and deliver pristine patient care logs.
                </p>

                <div className="space-y-3 pt-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Real-time Doctor Availability Synchronization & Roster Ledger</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Secure Medical Records Protected under Triple encrypted sign-ins</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Transparent Invoicing, ledger histories and supplier trackers</span>
                  </div>
                </div>
              </div>

              {/* Blueprint Layout representation */}
              <div className="lg:col-span-2 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 grid grid-cols-2 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-150 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Advanced IPD Wards</h4>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">Live bed mapper systems and occupancy checkers.</p>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-150 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Corporate Finance</h4>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">Unbiased audits, receipting, and transaction indices.</p>
                </div>

                <div className="bg-emerald-600 p-4.5 rounded-xl text-white flex flex-col justify-between shadow-md shadow-emerald-600/10">
                  <h4 className="text-xs font-bold text-white">Clinician Console</h4>
                  <p className="text-[10px] text-emerald-100 mt-2 leading-relaxed">Direct credentials mapping and live consult list.</p>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-150 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Supply Chain Ledger</h4>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">Real-time pharmacy supplies, suppliers, and PO logs.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. DOCTOR TAB */}
        {activeTab === 'doctor' && (
          <div className="space-y-8 animate-fade-in" id="doctors-view-container">
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wider uppercase rounded-full">
                Clinical Experts
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Our Dedicated Medical Officers</h2>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-normal">
                Any modifications to the doctor records inside the Admin Console will refresh here coordinates in real-time. Contact our desk for credentials setup.
              </p>
            </div>

            {doctors.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-250/50 shadow-xs text-center max-w-md mx-auto space-y-4">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-xs font-bold text-slate-700">No Specialists Configured</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">
                  Please boot the Admin console of your hospital and add a doctor record. Once saved, their detailed public profile card will instantiate here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="doctors-cards-grid">
                {doctors.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 group" id={`doc-card-${doc.id}`}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">Dr. {doc.name}</h3>
                          <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block mt-1.5 border border-emerald-100">
                            {doc.specialization}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                          doc.status === 'On Duty' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-150 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'On Duty' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {doc.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-550">
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Specialization Area</span>
                          <span className="font-bold text-slate-800 text-right">{doc.specialization || 'Clinical medicine'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Qualification Background</span>
                          <span className="font-bold text-slate-800 text-right line-clamp-1">{doc.qualification || 'MBBS, DNB, MRCP'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Total Practice Tenure</span>
                          <span className="font-bold text-slate-800">{doc.experience || '4+'} Years</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Assigned Ward Sector</span>
                          <span className="font-bold text-slate-800">{doc.department || 'General Admission'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Standard Consultation Fee</span>
                          <span className="font-extrabold text-emerald-700">${doc.consultationFee || '50'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Index No: {doc.id}</span>
                      <span className="font-semibold text-slate-600">{doc.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. BLOG TAB */}
        {activeTab === 'blog' && (
          <div className="space-y-8 animate-fade-in" id="blogs-view-container">
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wider uppercase rounded-full">
                Knowledge Hub
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Medical Advisories</h2>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-normal">
                Clinical observations, health tips, and diagnostic guidelines updated regularly by our resident medical board.
              </p>
            </div>

            {blogPosts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-250/50 shadow-xs text-center max-w-md mx-auto space-y-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-xs font-bold text-slate-750">No Publications Active</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                  Configure administrative medical articles in the Admin console to see health newsletter advisories load here visually.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="blogs-cards-grid">
                {blogPosts.map((blog) => (
                  <div key={blog.id} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold uppercase">
                        <span>{blog.date}</span>
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200/50">
                          {blog.category || 'Clinical Health'}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {blog.title}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {blog.description || 'Access baseline therapeutic protocols, diagnostic checklists, and outpatient coordinates published regularly by the clinic panel.'}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 mt-5 pt-3.5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Clinical Advisory</span>
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1 hover:underline cursor-pointer">
                        View Advisory <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" id="contact-view-container">
            
            {/* contact details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wider uppercase rounded-full">
                  Help Desk
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight text-sans">Get in Touch</h2>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Have an emergency, administrative inquiry, or feedback regarding your clinical portal accounts? Our front desk is on standby.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 space-y-4 shadow-xs text-xs text-slate-650">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Clinical Facility Coordinates</span>
                    <span>{instAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-100 pt-3.5">
                  <Phone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Clinic Hotline / Emergency line</span>
                    <span className="font-mono">{instPhone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-100 pt-3.5">
                  <Mail className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Admin Email Inbox</span>
                    <span className="font-mono text-emerald-800">{instEmail}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-100 pt-3.5">
                  <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-1">Office Zone Calibration</span>
                    <span className="font-semibold text-slate-500">{instTimezone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiry Intake Form */}
            <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-3xl border border-slate-200/60 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Publish General Enquiry Slip</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Your inquiry inputs will be logged in the Enquiries database in real-time under the verification protocols.</p>
              </div>

              {contactSuccess && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 text-xs font-bold leading-relaxed shadow-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Administrative success! Your clinical slip has been registered. Officers will evaluate this inside the Enquiries Hub inside the dashboard.</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4" id="contact-intake-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Your Legal Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline focus:outline-emerald-500 focus:border-transparent text-xs bg-slate-50 font-semibold"
                      placeholder="e.g. Al-Dastgeer"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Mobile Contact Hotline</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline focus:outline-emerald-500 focus:border-transparent text-xs bg-slate-50 font-semibold"
                      placeholder="e.g. +92 321 4567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Enquiry / Symptoms or Request specifics</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline focus:outline-emerald-500 focus:border-transparent text-xs bg-slate-50 font-semibold"
                    placeholder="Provide specific notes regarding department routing or scheduled doctor roster values..."
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-extrabold text-xs shadow-md transition-all active:scale-95 duration-150"
                >
                  Publish Public Enquiry Slip
                </button>
              </form>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16 py-10 px-6 border-t border-slate-800 text-xs" id="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400">
          <div className="text-center md:text-left space-y-1">
            <p className="font-extrabold text-white text-sm">{instName}</p>
            <p className="text-[10px] text-slate-500 font-mono">Government Accr Reg: {instReg}</p>
          </div>
          <div className="text-center">
            <span className="font-mono text-[9px] text-slate-600 bg-slate-850 px-3 py-1 rounded-full border border-slate-800">Hope Care Workspace Engine • v1.4.2</span>
          </div>
          <div className="text-center md:text-right text-[11px]">
            <p>© {new Date().getFullYear()} {instName}. Clinical operations verified. All medical advisory rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Portal Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="login-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-slide-up relative">
            
            <button
              onClick={closeLoginModal}
              className="absolute top-4.5 right-4.5 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all border border-transparent hover:border-slate-150"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header logo & visual */}
            <div className="bg-slate-900 text-white p-6.5 space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Lock className="w-32 h-32" />
              </div>

              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-emerald-400">Secure Access Desk</span>
              </div>
              <h3 className="text-lg font-black tracking-tight">
                {isAiLoginMode ? 'AI Assistant Portal' : `${instName} Clinical Portal`}
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                {isAiLoginMode 
                  ? 'Sign in using your AI Portal coordinates. Any registered doctor, staff or patient email/password works here.'
                  : 'Sign in using your pre-authorized keys and email coordinates. Accounts must be registered by administrative staff. Self-signup is restricted.'}
              </p>
            </div>

            {/* Mode Switcher Banner */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold px-4">
              {isAiLoginMode ? (
                <>
                  <span className="text-slate-600 font-bold">Clinical Access Desk?</span>
                  <button
                    type="button"
                    onClick={() => openLoginModal('patient', false)}
                    className="px-3 py-1.5 bg-slate-800 text-white font-extrabold rounded-xl hover:bg-slate-900 text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Go to Clinical Login
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[#007f6e] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Want 24/7 AI Assistant?
                  </span>
                  <button
                    type="button"
                    onClick={() => openLoginModal('patient', true)}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-extrabold rounded-xl hover:bg-emerald-700 text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Go to AI Login (/login)
                  </button>
                </>
              )}
            </div>

            {/* 3 Tabs (Patient, Doctor, Staff) */}
            {!isAiLoginMode && (
              <div className="flex border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest relative bg-slate-50/70">
                {(['patient', 'doctor', 'staff'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`flex-1 py-3 text-center transition-all ${
                      loginRole === role 
                        ? 'bg-white text-slate-900 border-b-2 border-emerald-500 font-black' 
                        : 'hover:text-slate-950 hover:bg-slate-100/40'
                    }`}
                    id={`login-tab-${role}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}

            {/* Conditionally Render Forgot Password view or normal login form */}
            {isForgotMode ? (
              <form onSubmit={handleForgotPasswordSubmit} className="p-6 space-y-4 font-sans" id="portal-forgot-password-form">
                <div className="border-b border-slate-150 pb-2 mb-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Reset Access Key / Password</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Provide your registered email address to authorize a password change for the current role: <span className="font-bold text-slate-800 capitalize">{loginRole}</span>.</p>
                </div>

                {forgotError && (
                  <div className="bg-rose-50 text-rose-850 border border-rose-150 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccessMessage && (
                  <div className="bg-emerald-50 text-emerald-850 border border-emerald-110 rounded-xl p-3 text-xs font-bold leading-normal flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
                    <span>{forgotSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Registered Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="name@hopecare.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Create New Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                      placeholder="••••••••"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="••••••••"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-98"
                  >
                    Authorize Password Reset
                  </button>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(false);
                        setForgotError('');
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>

                    <button
                      type="button"
                      onClick={closeLoginModal}
                      className="text-xs text-rose-650 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4" id="portal-login-form">
                {loginError && (
                  <div className="bg-rose-50 text-rose-850 border border-rose-100 rounded-xl p-3 text-xs font-bold flex items-center gap-2.5">
                    <Shield className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">
                      {isAiLoginMode ? 'E-mail Address' : 'Corporate E-mail Address'}
                    </label>
                    {/* Simulated account hints to assist testing */}
                    <span className="text-[8px] text-slate-400 font-bold uppercase font-mono">
                      {isAiLoginMode 
                        ? 'AI assistant credentials' 
                        : loginRole === 'patient' 
                        ? 'Try: daisy@gmail.com' 
                        : loginRole === 'doctor' 
                        ? 'Try: john.smith@gmail.com' 
                        : 'Try: alice@gmail.com'}
                    </span>
                  </div>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder={isAiLoginMode ? "yourname@gmail.com" : "name@hopecare.com"}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">
                      {isAiLoginMode ? 'Password' : 'Administrative Password / Key'}
                    </label>
                    {!isAiLoginMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotMode(true);
                          setForgotEmail(loginEmail);
                          setForgotError('');
                          setForgotSuccessMessage('');
                        }}
                        className="text-[9px] text-emerald-600 hover:underline font-extrabold"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-98"
                  >
                    {isAiLoginMode ? 'Sign In to AI Assistant' : `Sign In to ${loginRole} Console`}
                  </button>

                  <button
                    type="button"
                    onClick={closeLoginModal}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs transition-all active:scale-98 text-center"
                    id="cancel-modal-btn"
                  >
                    Cancel & Return Home
                  </button>
                  
                  <div className="text-center mt-2 text-[11px] font-semibold text-slate-500">
                    {isAiLoginMode ? "Don't have an AI account? " : "Don't have a patient account? "}
                    <button
                      type="button"
                      onClick={() => openSignupModal()}
                      className="text-emerald-650 hover:underline font-extrabold cursor-pointer"
                    >
                      Sign Up Now
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Portal Sign Up Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="signup-modal-overlay">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-slide-up relative">
            
            <button
              onClick={closeSignupModal}
              className="absolute top-4.5 right-4.5 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all border border-transparent hover:border-slate-150 cursor-pointer"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header logo & visual */}
            <div className="bg-slate-900 text-white p-6 space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="w-32 h-32" />
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-emerald-400">
                  {isAiLoginMode ? 'AI Assistant Portal registration' : 'Instant Patient Registration'}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight">
                {isAiLoginMode ? 'Create AI Assistant Account' : 'Create Patient Account'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                {isAiLoginMode 
                  ? 'Sign up to gain full credentials to the 24/7 clinical AI Assistant. Your account database is secured and private.'
                  : 'Sign up to book clinical specialists, monitor medicine tracker regimes, and access the 24/7 AI Medical Assistant.'}
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto font-sans" id="portal-signup-form">
              {signupError && (
                <div className="bg-rose-50 text-rose-850 border border-rose-100 rounded-xl p-3 text-xs font-bold flex items-center gap-2.5">
                  <Shield className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                  <span>{signupError}</span>
                </div>
              )}

              {signupSuccess && (
                <div className="bg-emerald-50 text-emerald-850 border border-emerald-100 rounded-xl p-3 text-xs font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
                  <span>{signupSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Full Name *</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="Daisy Miller"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">E-mail Address *</label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="daisy@gmail.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Choose Password *</label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Mobile Phone *</label>
                  <input
                    type="tel"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="+92 300 1234567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Age *</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="25"
                    value={signupAge}
                    onChange={(e) => setSignupAge(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Gender *</label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    value={signupGender}
                    onChange={(e) => setSignupGender(e.target.value as any)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Blood Group</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="O+"
                    value={signupBloodGroup}
                    onChange={(e) => setSignupBloodGroup(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold text-slate-600"
                    value={signupDob}
                    onChange={(e) => setSignupDob(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Home Address</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 text-xs bg-slate-50 font-bold"
                    placeholder="123 Health Ave, Complex"
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/40 border border-emerald-100/60 rounded-xl cursor-pointer hover:bg-emerald-50/60 transition-all select-none" onClick={() => setAlsoRegisterAsPatient(!alsoRegisterAsPatient)}>
                <input
                  type="checkbox"
                  id="alsoRegisterAsPatientCheckbox"
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-[#007f6e] cursor-pointer"
                  checked={alsoRegisterAsPatient}
                  onChange={(e) => setAlsoRegisterAsPatient(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-left">
                  <label htmlFor="alsoRegisterAsPatientCheckbox" className="text-xs font-black text-slate-800 cursor-pointer block">
                    Also register as a Clinical Patient
                  </label>
                  <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                    If checked, your credentials will also be added to the Hospital Clinical Patients database. If unchecked, your account remains separate and private.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  {isAiLoginMode ? 'Create AI Assistant Account' : 'Create Patient Account & Start Consultation'}
                </button>

                <button
                  type="button"
                  onClick={closeSignupModal}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs transition-all active:scale-98 text-center cursor-pointer"
                >
                  Cancel & Return Home
                </button>

                <div className="text-center mt-2 text-[11px] font-semibold text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => openLoginModal('patient', isAiLoginMode)}
                    className="text-emerald-600 hover:underline font-extrabold cursor-pointer"
                  >
                    Login here
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
