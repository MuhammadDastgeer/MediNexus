import React, { useState, useEffect } from 'react';
import { Settings, Check, HelpCircle, Save, Info } from 'lucide-react';

interface ConfigureHospitalViewProps {
  settings: Record<string, string>;
  onSaveSettings: (settings: Record<string, string>) => void;
  onNavigate?: (view: any) => void;
}

export default function ConfigureHospitalView({ settings, onSaveSettings, onNavigate }: ConfigureHospitalViewProps) {
  const [activeTab, setActiveTab] = useState('general');

  // Fields state (automatically mapped from database configuration parameters)
  const [hospitalName, setHospitalName] = useState('Code');
  const [website, setWebsite] = useState('https://hospital.com');
  const [bookingSlug, setBookingSlug] = useState('my-hospital');
  const [bookingUrl, setBookingUrl] = useState('https://medi-nex-plus-nine.vercel.app/appointment?hid=a00bb217-901a-4b14-8f4f-84369fb0f117');
  const [address, setAddress] = useState('123 Medical Lane, City');
  const [phone, setPhone] = useState('+923706939429');
  const [email, setEmail] = useState('besamof549@afterdo.com');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST, UTC+5:30)');
  const [gst, setGst] = useState('22AAAAA0000A1Z5');
  const [regNo, setRegNo] = useState('HOSP/2026/001');

  // Map values when loaded from parent
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      if (settings.hospitalName) setHospitalName(settings.hospitalName);
      if (settings.website) setWebsite(settings.website);
      if (settings.bookingSlug) setBookingSlug(settings.bookingSlug);
      if (settings.bookingUrl) setBookingUrl(settings.bookingUrl);
      if (settings.address) setAddress(settings.address);
      if (settings.phone) setPhone(settings.phone);
      if (settings.email) setEmail(settings.email);
      if (settings.timezone) setTimezone(settings.timezone);
      if (settings.gst) setGst(settings.gst);
      if (settings.regNo) setRegNo(settings.regNo);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim()) { alert('Hospital Name is required.'); return; }
    if (!website.trim()) { alert('Website address is required.'); return; }
    if (!bookingSlug.trim()) { alert('Online booking slug prefix is required.'); return; }
    if (!bookingUrl.trim()) { alert('Complete online booking referral link is required.'); return; }
    if (!address.trim()) { alert('Hospital physical mailing address is required.'); return; }
    if (!phone.trim()) { alert('Hospital corporate/inquiry phone number is required.'); return; }
    if (!email.trim()) { alert('Hospital inquiries email address is required.'); return; }
    if (!timezone.trim()) { alert('Primary hospital operating timezone is required.'); return; }
    if (!gst.trim()) { alert('GST tax details are required.'); return; }
    if (!regNo.trim()) { alert('Hospital Board Registration number is required.'); return; }

    onSaveSettings({
      hospitalName,
      website,
      bookingSlug,
      bookingUrl,
      address,
      phone,
      email,
      timezone,
      gst,
      regNo
    });
    alert('Hospital Configuration updated successfully and persistent in SQLite!');
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700 font-sans" id="config-view">
      {/* Title block */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="config-title">Configure Hospital Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">Identity & Branding, CRM, Billing Configurations & legal registration terms</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 flex-wrap gap-2" id="config-tabs">
        {[
          { id: 'general', label: 'General Settings' },
          { id: 'departments', label: 'Departments Setup' },
          { id: 'wards', label: 'Ward & Bed Setup' },
          { id: 'services', label: 'Services & Packages Setup' },
          { id: 'permissions', label: 'Permissions & Roles' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (t.id === 'departments') {
                onNavigate?.('departments');
              } else if (t.id === 'wards') {
                onNavigate?.('ipd-wards');
              } else if (t.id === 'services') {
                onNavigate?.('billing');
              } else if (t.id === 'permissions') {
                onNavigate?.('staff');
              } else {
                setActiveTab(t.id);
              }
            }}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-[#007f6e] text-[#007f6e]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' ? (
        <form onSubmit={handleSave} className="space-y-6 max-w-4xl" id="config-general-form">
          {/* Main settings grid */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
              <Settings size={16} className="text-[#007f6e]" />
              <span>Identity & Branding</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Hospital Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                  required
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Public Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>
            </div>
          </div>

          {/* Contact settings */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mobile No */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Corporate Mobile No</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">System Admin Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Address Details</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Operating Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] bg-white"
                >
                  <option value="Asia/Kolkata (IST, UTC+5:30)">Asia/Kolkata (IST, UTC+5:30)</option>
                  <option value="Asia/Karachi (PKT, UTC+5:00)">Asia/Karachi (PKT, UTC+5:00)</option>
                  <option value="America/New_York (EST, UTC-5:00)">America/New_York (EST, UTC-5:00)</option>
                  <option value="UTC (GMT, UTC+0:00)">UTC (GMT, UTC+0:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Legal Compliance setup */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Legal & Compliance Registration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* GST */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">GST / Corporate Tax License ID</label>
                <input
                  type="text"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>

              {/* Registration Certification */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Medical Council Registration Certification</label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 hover:border-slate-300 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2" id="save-settings-bar">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#007f6e] hover:bg-[#006657] text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-[#007f6e]/15 transition-all cursor-pointer"
            >
              <Save size={14} />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-slate-150 rounded-xl p-8 max-w-4xl text-center shadow-xs">
          <Info size={32} className="text-slate-300 mx-auto mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')} module initialized</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            These configurations are linked perfectly to your hospital profiles. You can configure and review identity details within this screen anytime!
          </p>
        </div>
      )}
    </div>
  );
}
