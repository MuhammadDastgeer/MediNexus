import React from 'react';
import { HelpCircle, PhoneCall, Mail, BookOpen } from 'lucide-react';

export default function SupportView() {
  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700 font-sans" id="support-view">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">System & Tech Support</h1>
        <p className="text-xs text-slate-400 mt-0.5">Reach out for product setup guidance, API keys connection or legal compliance integration.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs max-w-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
          <HelpCircle size={16} className="text-[#007f6e]" />
          <span>Product Setup HelpDesk</span>
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed">
          Need help? Our tech team is here to assist with setting up standard parameters, managing custom sub-departments, custom medical packages, printing professional prescriptions with headers, or editing clinic contact info.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="border border-slate-100 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center">
              <PhoneCall size={14} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Hotline support</span>
              <span className="text-xs font-semibold text-slate-700">+91 911 2233 44</span>
            </div>
          </div>

          <div className="border border-slate-100 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
              <Mail size={14} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Email Desk</span>
              <span className="text-xs font-semibold text-slate-700">support@hospital.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
