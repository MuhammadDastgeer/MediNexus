import { useState } from 'react';
import { Building2, Search } from 'lucide-react';

export default function DepartmentsView() {
  const [search, setSearch] = useState('');

  const departments = [
    {
      name: 'Cardiology',
      head: 'Dr. Anil Sharma',
      rooms: 'Ground Floor, Room 101 - 105',
      beds: 18,
      occupied: 12,
      subDepts: ['Eco-Cardiography', 'Cardiac ICU', 'Interventional ECG'],
    },
    {
      name: 'Pediatrics',
      head: 'Dr. Priya Patel',
      rooms: 'First Floor, Room 201 - 208',
      beds: 24,
      occupied: 14,
      subDepts: ['Neonatology Unit', 'Immunization Center', 'Pediatric Surgery'],
    },
    {
      name: 'Neurology',
      head: 'Dr. Meera Sen',
      rooms: 'Second Floor, Room 301 - 304',
      beds: 10,
      occupied: 6,
      subDepts: ['Neuro Diagnostics', 'EEG Labs', 'Rehabilitation Center'],
    },
    {
      name: 'Orthopedics',
      head: 'Dr. Sameer Khan',
      rooms: 'Ground Floor, Room 110 - 115',
      beds: 20,
      occupied: 18,
      subDepts: ['Fracture Ward', 'Physiotherapy Unit', 'Joint Replacement Lab'],
    },
    {
      name: 'Emergency & Trauma Care',
      head: 'Dr. Rohan Jha',
      rooms: 'Ground Floor, Critical Wing - Red Zone',
      beds: 35,
      occupied: 29,
      subDepts: ['Trauma ICU', 'Surgical Triage', 'Ambulance Response'],
    },
  ];

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.head.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 h-full overflow-y-auto select-none space-y-6" id="departments-view">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Hospital Departments</h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore clinical medical units, department heads, and rooms structure.
        </p>
      </div>

      <div className="relative w-72">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search clinical units..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="departments-bento-grid">
        {filtered.map((dept, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden" id={`dept-card-${idx}`}>
            <span className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#007f6e]/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#e6f4f1] text-[#007f6e] rounded-lg flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{dept.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium">Head of Unit: {dept.head}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/50 p-2.5 rounded-lg border border-slate-50/20">
              <div>
                <span className="text-slate-400 block font-medium">Location Room:</span>
                <span className="text-slate-700 font-semibold">{dept.rooms}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Beds Capacity:</span>
                <span className="text-slate-705 font-semibold">
                  {dept.beds} total ({dept.occupied} occupied)
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1.5">
                Sub-Departments / Divisions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {dept.subDepts.map((sub, sidx) => (
                  <span
                    key={sidx}
                    className="text-[10px] bg-slate-50 border border-slate-100/50 text-slate-600 px-2 py-0.5 rounded"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
