import React, { useState } from 'react';
import { 
  Bed, Plus, Search, RefreshCw, FileSpreadsheet, Trash2, Edit3, Eye, 
  X, Check, AlertCircle, Shield, Home, Users, CheckCircle2, UserCheck, Sparkles
} from 'lucide-react';
import { Patient } from '../types';
import { downloadCSV, downloadExcel, downloadWord, downloadPDFFile } from '../utils/exportHelper';

interface IpdWardsViewProps {
  patients: Patient[];
  wards?: any[];
  onAdmitPatient: () => void;
  onRefresh: () => void;
  onAddWard: (ward: any) => Promise<void>;
  onDeleteWard: (id: string) => Promise<void>;
  onUpdatePatient: (patient: any) => Promise<void>;
  onNavigate?: (view: any) => void;
}

interface RoomConfig {
  id: string;
  name: string;
  bedsCount: number;
}

export default function IpdWardsView({ 
  patients = [], 
  wards = [], 
  onAdmitPatient, 
  onRefresh,
  onAddWard,
  onDeleteWard,
  onUpdatePatient,
  onNavigate
}: IpdWardsViewProps) {
  const [activeTab, setActiveTab] = useState<'bed-map' | 'admissions' | 'ipd-setup'>('bed-map');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / forms state
  const [showWardModal, setShowWardModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [editingWard, setEditingWard] = useState<any | null>(null);

  // Ward Form States
  const [wardName, setWardName] = useState('');
  const [wardType, setWardType] = useState<'General' | 'Semi-Private' | 'Private' | 'ICU'>('General');
  const [roomCount, setRoomCount] = useState(2);
  const [roomsList, setRoomsList] = useState<RoomConfig[]>([
    { id: 'room-1', name: 'Room 101', bedsCount: 4 },
    { id: 'room-2', name: 'Room 102', bedsCount: 2 }
  ]);

  // Admission Modal States (Admitting patient to a prospective bed)
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionPatientId, setAdmissionPatientId] = useState('');
  const [admissionWardId, setAdmissionWardId] = useState('');
  const [admissionRoomId, setAdmissionRoomId] = useState('');
  const [admissionBedNumber, setAdmissionBedNumber] = useState('');

  // View Modals State
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [viewingWard, setViewingWard] = useState<any | null>(null);

  // Search Ward Selection in Bed Map
  const [selectedBedMapWardId, setSelectedBedMapWardId] = useState<string>('All');

  // Handle number of rooms change
  const handleRoomCountChange = (count: number) => {
    setRoomCount(count);
    const updated = [...roomsList];
    if (count > updated.length) {
      // Add rooms
      for (let i = updated.length; i < count; i++) {
        updated.push({
          id: `room-${Date.now()}-${i}`,
          name: `Room ${101 + i}`,
          bedsCount: 2
        });
      }
    } else if (count < updated.length) {
      // Truncate rooms
      updated.splice(count);
    }
    setRoomsList(updated);
  };

  const handleRoomFieldChange = (index: number, field: keyof RoomConfig, value: any) => {
    const updated = [...roomsList];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setRoomsList(updated);
  };

  // Live Totals calculation for Ward Form
  const totalBedsInForm = roomsList.reduce((acc, r) => acc + Number(r.bedsCount || 0), 0);

  // Ward Submit
  const handleWardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardName.trim()) {
      alert('Ward Name is required.');
      return;
    }
    if (!wardType) {
      alert('Ward Type is required.');
      return;
    }
    const emptyRoom = roomsList.some(r => !r.name.trim() || !r.bedsCount || r.bedsCount <= 0);
    if (emptyRoom) {
      alert('All Rooms must have a valid Name and at least 1 Bed.');
      return;
    }

    const payload = {
      id: editingWard ? editingWard.id : `ward-${Date.now().toString().slice(-4)}`,
      name: wardName,
      type: wardType,
      bedsTotal: totalBedsInForm,
      bedsOccupied: calculateWardsOccupiedCount(editingWard ? editingWard.id : ''),
      bedsAvailable: totalBedsInForm - calculateWardsOccupiedCount(editingWard ? editingWard.id : ''),
      bedsMaintenance: 0,
      roomsData: JSON.stringify(roomsList)
    };

    await onAddWard(payload);
    setShowWardModal(false);
    resetWardForm();
    onRefresh();
  };

  const resetWardForm = () => {
    setEditingWard(null);
    setWardName('');
    setWardType('General');
    setRoomCount(2);
    setRoomsList([
      { id: 'room-1', name: 'Room 101', bedsCount: 4 },
      { id: 'room-2', name: 'Room 102', bedsCount: 2 }
    ]);
  };

  const handleEditWardClick = (ward: any) => {
    setEditingWard(ward);
    setWardName(ward.name);
    setWardType(ward.type || 'General');
    
    let parsedRooms: RoomConfig[] = [];
    try {
      if (ward.roomsData) {
        parsedRooms = JSON.parse(ward.roomsData);
      }
    } catch (e) {
      console.warn('Failed to parse roomsData, using fallback', e);
    }

    if (parsedRooms.length === 0) {
      parsedRooms = [
        { id: 'room-1', name: 'Room 101', bedsCount: ward.bedsTotal || 4 }
      ];
    }

    setRoomsList(parsedRooms);
    setRoomCount(parsedRooms.length);
    setShowWardModal(true);
  };

  const handleDeleteWardClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this Ward configuration? All bed mapping will be deleted.')) {
      // Clear associated patients bed assignments first
      const associatedPatients = patients.filter(p => p.wardId === id);
      for (const p of associatedPatients) {
        await onUpdatePatient({
          ...p,
          wardId: null,
          roomId: null,
          bedNumber: null
        });
      }
      await onDeleteWard(id);
      onRefresh();
    }
  };

  // Helper: calculate occupied beds per ward id
  const calculateWardsOccupiedCount = (wardId: string) => {
    if (!wardId) return 0;
    return patients.filter(p => p.wardId === wardId).length;
  };

  // Quick Stats across the active database records
  const totalWardsCount = wards.length;
  const totalRoomsCount = wards.reduce((sum, w) => {
    try {
      const list = w.roomsData ? JSON.parse(w.roomsData) : [];
      return sum + list.length;
    } catch {
      return sum + 1;
    }
  }, 0);
  const totalBedsCount = wards.reduce((sum, w) => sum + (Number(w.bedsTotal) || 0), 0);
  const occupiedBedsCount = patients.filter(p => p.wardId).length;
  const availableBedsCount = Math.max(0, totalBedsCount - occupiedBedsCount);

  // Dynamic search filtering
  const filteredWards = wards.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Patients who have a bed allocated
  const admittedPatients = patients.filter(p => p.wardId && p.wardId !== '');

  // Patient search in admissions list
  const filteredAdmittedPatients = admittedPatients.filter(p => {
    const matchedWard = wards.find(w => w.id === p.wardId);
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (matchedWard && matchedWard.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Patient Allocation modal helper
  const handleOpenAllocateModal = (wardId = '', roomId = '', bedNum = '') => {
    setAdmissionWardId(wardId || (wards[0]?.id || ''));
    setAdmissionRoomId(roomId);
    setAdmissionBedNumber(bedNum);
    setShowAdmissionModal(true);
  };

  const handlePatientAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionPatientId) {
      alert('Please select a patient to admit');
      return;
    }
    if (!admissionWardId || !admissionRoomId || !admissionBedNumber) {
      alert('Please specify complete Ward, Room, and Bed details');
      return;
    }

    const patientToAdmit = patients.find(p => p.id === admissionPatientId);
    if (!patientToAdmit) return;

    // Check if bed is already occupied
    const occupied = patients.some(p => p.wardId === admissionWardId && p.roomId === admissionRoomId && String(p.bedNumber) === String(admissionBedNumber));
    if (occupied) {
      alert('This bed is already occupied. Please select an available bed.');
      return;
    }

    await onUpdatePatient({
      ...patientToAdmit,
      wardId: admissionWardId,
      roomId: admissionRoomId,
      bedNumber: String(admissionBedNumber)
    });

    setShowAdmissionModal(false);
    setAdmissionPatientId('');
    onRefresh();
  };

  const handleDischargePatient = async (patient: Patient) => {
    if (confirm(`Are you sure you want to release bed allocation & discharge patient ${patient.name}?`)) {
      await onUpdatePatient({
        ...patient,
        wardId: null,
        roomId: null,
        bedNumber: null
      });
      onRefresh();
    }
  };

  // Dynamic, Multi-Format Admitted Patients Export
  const handleExport = (format: 'CSV' | 'Excel' | 'Word' | 'PDF') => {
    setShowExportDropdown(false);
    if (admittedPatients.length === 0) {
      alert('No active patient admissions recorded to export.');
      return;
    }

    const mappedAdmitted = admittedPatients.map(p => {
      const wardNameStr = wards.find(w => w.id === p.wardId)?.name || 'Unknown Ward';
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        ward: wardNameStr,
        room: p.roomId,
        bed: p.bedNumber ? `Bed ${p.bedNumber}` : 'N/A'
      };
    });

    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'Ward Name', 'Room', 'Bed Number'];
    const keys = ['id', 'name', 'age', 'gender', 'phone', 'ward', 'room', 'bed'];
    const filename = `ipd_admissions_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      downloadCSV(mappedAdmitted, headers, keys, filename);
    } else if (format === 'Excel') {
      downloadExcel(mappedAdmitted, headers, keys, filename);
    } else if (format === 'Word') {
      downloadWord(mappedAdmitted, headers, keys, filename, 'IPD Active Ward Admissions Ledger');
    } else if (format === 'PDF') {
      downloadPDFFile(mappedAdmitted, headers, keys, filename, 'IPD Ward Bed Admissions Ledger');
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="ipd-wards-view">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="ipd-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="ipd-title">IPD — Ward & Bed Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Allocate, track, and configure wards and hospital bed systems.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('ipd-wards-ai')}
              type="button"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-[#007f6e] hover:from-emerald-700 hover:to-[#006657] text-[#ffffff] px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              id="trigger-ipd-wards-ai"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span>IPD Wards AI</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAllocateModal()}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            id="admit-patient-btn"
          >
            <UserCheck size={14} />
            <span>Admit Patient</span>
          </button>
          
          <button
            onClick={() => {
              resetWardForm();
              setShowWardModal(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            id="add-ward-btn"
          >
            <Plus size={14} />
            <span>Add IPD Ward Bed</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-1.5 border border-slate-150 bg-white hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              <span>Export</span>
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg z-25 py-1 divide-y divide-slate-50 text-[11px] text-slate-700">
                <button onClick={() => handleExport('CSV')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-705 font-medium block cursor-pointer">CSV format</button>
                <button onClick={() => handleExport('Excel')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-emerald-600 font-medium block cursor-pointer">Excel sheet</button>
                <button onClick={() => handleExport('Word')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-blue-600 font-medium block cursor-pointer">Word document</button>
                <button onClick={() => handleExport('PDF')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-rose-600 font-medium block cursor-pointer">PDF file</button>
              </div>
            )}
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center justify-center p-2 border border-slate-150 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Bed Map, Admissions, Setup) */}
      <div className="flex border-b border-slate-100" id="ipd-tabs-row">
        <button
          onClick={() => setActiveTab('bed-map')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'bed-map'
              ? 'border-[#007f6e] text-[#007f6e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Bed Map
        </button>
        <button
          onClick={() => setActiveTab('admissions')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'admissions'
              ? 'border-[#007f6e] text-[#007f6e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Admissions ({admittedPatients.length})
        </button>
        <button
          onClick={() => setActiveTab('ipd-setup')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ipd-setup'
              ? 'border-[#007f6e] text-[#007f6e]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          IPD & Ward & Bed ({totalWardsCount})
        </button>
      </div>

      {/* Bed System Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="ipd-metrics">
        {/* Total Beds */}
        <div className="bg-white border border-slate-105 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total IPD Beds</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalBedsCount}</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <Bed size={18} />
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white border border-slate-105 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupied Beds</span>
            <span className="text-2xl font-extrabold text-[#d93838]">{occupiedBedsCount}</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <Bed size={18} className="text-rose-400" />
          </div>
        </div>

        {/* Available */}
        <div className="bg-white border border-slate-105 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Beds</span>
            <span className="text-2xl font-extrabold text-[#007f6e]">{availableBedsCount}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-[#007f6e] rounded-xl flex items-center justify-center">
            <Bed size={18} className="text-emerald-450" />
          </div>
        </div>

        {/* Total Rooms */}
        <div className="bg-white border border-slate-105 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hospital Rooms</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalRoomsCount}</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-extrabold text-sm">
            <Home size={18} />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-105 rounded-xl shadow-xs overflow-hidden" id="ipd-main-card">
        
        {/* Sort and search bar */}
        <div className="p-4 border-b border-slate-100 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {activeTab === 'bed-map' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400">Ward:</span>
                <select
                  value={selectedBedMapWardId}
                  onChange={(e) => setSelectedBedMapWardId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-[#007f6e] outline-none font-semibold text-slate-600"
                >
                  <option value="All">All Wards</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>
            )}
            
            {activeTab === 'ipd-setup' && (
              <span className="text-xs font-bold text-slate-500">
                IPD Ward Registry ({filteredWards.length} config entries)
              </span>
            )}

            {activeTab === 'admissions' && (
              <span className="text-xs font-bold text-slate-500">
                Admitted IPD Patients Dashboard
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder={activeTab === 'admissions' ? 'Search patient, phone, or ward...' : 'Search by keyword...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e] outline-none"
            />
          </div>
        </div>

        {/* TAB 1: BED MAP (Interactive Visualization Diagram) */}
        {activeTab === 'bed-map' && (
          <div className="p-6 space-y-8" id="bed-map-panel">
            {wards.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-wards">
                <div className="w-14 h-14 bg-slate-55 rounded-full flex items-center justify-center text-slate-300">
                  <Bed size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No Wards or Beds Configured</p>
                  <p className="text-xs text-slate-400 mt-0.5">Please head to the "IPD & Ward & Bed" tab to register your first ward profile.</p>
                </div>
              </div>
            ) : (
              wards
                .filter(w => selectedBedMapWardId === 'All' || w.id === selectedBedMapWardId)
                .map((ward) => {
                  let rooms: RoomConfig[] = [];
                  try {
                    rooms = ward.roomsData ? JSON.parse(ward.roomsData) : [];
                  } catch {
                    rooms = [];
                  }

                  return (
                    <div key={ward.id} className="border border-slate-100 rounded-xl overflow-hidden bg-[#fafbfc]">
                      {/* Ward Subheader banner */}
                      <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-[#007f6e] rounded-full"></div>
                          <h3 className="font-bold text-xs text-slate-800">{ward.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 uppercase">
                            {ward.type}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-400">
                          Total Beds: <strong className="text-slate-700">{ward.bedsTotal}</strong> | Admitted: <strong className="text-red-500">{calculateWardsOccupiedCount(ward.id)}</strong>
                        </div>
                      </div>

                      {/* Rooms Grid */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {rooms.map((room) => {
                          return (
                            <div key={room.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="text-[11px] font-extrabold text-slate-600 tracking-tight flex items-center gap-1">
                                  <Home size={12} className="text-slate-400" />
                                  {room.name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  {room.bedsCount} Beds Config
                                </span>
                              </div>

                              {/* Beds block list inside this Room */}
                              <div className="grid grid-cols-2 gap-2">
                                {Array.from({ length: Number(room.bedsCount || 0) }).map((_, idx) => {
                                  const bedIdx = idx + 1;
                                  // Locate patient allocated to this specific bed
                                  const occupant = patients.find(
                                    p => p.wardId === ward.id && p.roomId === room.name && String(p.bedNumber) === String(bedIdx)
                                  );

                                  return (
                                    <div
                                      key={bedIdx}
                                      onClick={() => {
                                        if (occupant) {
                                          setViewingPatient(occupant);
                                        } else {
                                          handleOpenAllocateModal(ward.id, room.name, String(bedIdx));
                                        }
                                      }}
                                      className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between h-20 ${
                                        occupant 
                                          ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50 hover:border-rose-200' 
                                          : 'bg-emerald-50/20 border-emerald-100/60 hover:bg-emerald-50/40 hover:border-emerald-250'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] font-extrabold text-slate-400">
                                          Bed #{bedIdx}
                                        </span>
                                        <Bed 
                                          size={14} 
                                          className={occupant ? 'text-rose-500' : 'text-emerald-500'} 
                                        />
                                      </div>
                                      
                                      <div className="mt-2.5 truncate">
                                        {occupant ? (
                                          <div>
                                            <p className="text-[11px] font-bold text-slate-800 truncate leading-none">
                                              {occupant.name}
                                            </p>
                                            <p className="text-[9px] text-rose-600 font-semibold tracking-tight mt-0.5 font-sans uppercase">
                                              Occupied
                                            </p>
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="text-[11px] font-bold text-slate-400 truncate leading-none">
                                              - Empty -
                                            </p>
                                            <p className="text-[9px] text-[#007f6e] font-bold tracking-tight mt-0.5 font-sans uppercase">
                                              Available
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {rooms.length === 0 && (
                          <div className="col-span-full py-6 text-center text-xs text-slate-400 italic">
                            No rooms defined for this ward.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* TAB 2: ADMISSIONS TABLE (Filtered to Active Ward/Beds Patients) */}
        {activeTab === 'admissions' && (
          <div id="admissions-panel">
            {filteredAdmittedPatients.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-355">
                  <UserCheck size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No Patient Admissions Found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {searchQuery ? 'Adjust your query to locate patients.' : 'Admit a patient to a prospective bed using the "Admit Patient" action button.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Patient ID</th>
                      <th className="px-6 py-3">FullName</th>
                      <th className="px-6 py-3">Age/Gender</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3">Assigned IPD Ward</th>
                      <th className="px-6 py-3">Room & Bed</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAdmittedPatients.map((p) => {
                      const matWard = wards.find(w => w.id === p.wardId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{p.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                          <td className="px-6 py-4 text-slate-600">{p.age} yrs · {p.gender}</td>
                          <td className="px-6 py-4 font-mono text-slate-500">{p.phone}</td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">
                            <span className="flex items-center gap-1.5 text-xs text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-[#007f6e]"></span>
                              {matWard ? matWard.name : 'Unassigned Ward'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] font-bold">
                            <span className="text-[#007f6e]">{p.roomId}</span> — <span className="bg-[#fafbfc] px-1.5 py-0.5 rounded text-orange-600 border border-amber-100">Bed {p.bedNumber}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewingPatient(p)}
                                className="p-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-650 flex items-center gap-1 cursor-pointer"
                                title="View Patient details"
                              >
                                <Eye size={12} />
                                <span className="text-[10px] font-semibold">View</span>
                              </button>
                              
                              <button
                                onClick={() => handleOpenAllocateModal(p.wardId || '', p.roomId || '', p.bedNumber || '')}
                                className="p-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-blue-600 flex items-center gap-1 cursor-pointer"
                                title="Change Ward/Bed Allocation"
                              >
                                <Edit3 size={12} />
                                <span className="text-[10px] font-semibold">Edit</span>
                              </button>

                              <button
                                onClick={() => handleDischargePatient(p)}
                                className="p-1 px-2 border border-rose-100 bg-rose-50/30 hover:bg-rose-50 text-rose-650 rounded-lg flex items-center gap-1 cursor-pointer"
                                title="Discharge and vacate bed"
                              >
                                <Trash2 size={12} />
                                <span className="text-[10px] font-bold">Discharge</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: IPD & WARD & BED (Configuration setups registry list) */}
        {activeTab === 'ipd-setup' && (
          <div id="setup-panel">
            {filteredWards.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-350">
                  <Home size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No Wards Registry Entries</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add custom hospital IPD wards, set dynamic rooms list, and beds count config!
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Ward ID</th>
                      <th className="px-6 py-3">Ward Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Rooms Configured</th>
                      <th className="px-6 py-3">Total Beds</th>
                      <th className="px-6 py-3">Beds Status</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredWards.map((w) => {
                      let parsedRooms: RoomConfig[] = [];
                      try {
                        parsedRooms = w.roomsData ? JSON.parse(w.roomsData) : [];
                      } catch {
                        parsedRooms = [];
                      }

                      const occupiedCount = calculateWardsOccupiedCount(w.id);

                      return (
                        <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{w.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{w.name}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 uppercase text-[10px]">
                              {w.type || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600">
                            <div className="flex flex-wrap gap-1">
                              {parsedRooms.map((r, idx) => (
                                <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-500 rounded p-0.5 px-1.5 text-[9px]">
                                  {r.name} ({r.bedsCount}B)
                                </span>
                              ))}
                              {parsedRooms.length === 0 && <span className="text-slate-400 italic">None</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-[#007f6e]">
                            {w.bedsTotal} Units
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 text-[10px] font-bold">
                              <span className="text-[#007f6e]">{w.bedsTotal - occupiedCount} Free</span>
                              <span className="text-rose-500">{occupiedCount} Admitted</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setViewingWard(w);
                                }}
                                className="p-1 px-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer flex items-center gap-1"
                                title="View Ward details"
                              >
                                <Eye size={12} />
                                <span className="text-[10px] font-semibold">View</span>
                              </button>

                              <button
                                onClick={() => handleEditWardClick(w)}
                                className="p-1 px-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-blue-600 cursor-pointer flex items-center gap-1"
                                title="Edit Configuration"
                              >
                                <Edit3 size={12} />
                                <span className="text-[10px] font-semibold">Edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteWardClick(w.id)}
                                className="p-1 px-1.5 border border-rose-100 bg-rose-50/20 hover:bg-rose-50 text-rose-600 cursor-pointer flex items-center gap-1"
                                title="Delete Ward"
                              >
                                <Trash2 size={12} />
                                <span className="text-[10px] font-bold">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: ADD / EDIT WARD FORM */}
      {showWardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-220 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-[#007f6e]" />
                {editingWard ? 'Edit IPD Ward & Bed Profile' : 'Configure New IPD Ward & Bed System'}
              </h3>
              <button 
                onClick={() => setShowWardModal(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleWardSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    IPD Ward Name
                  </label>
                  <input
                    type="text"
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    placeholder="e.g. ICU Wing B, Premium General"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Ward Type
                  </label>
                  <select
                    value={wardType}
                    onChange={(e) => setWardType(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none font-semibold text-slate-600"
                  >
                    <option value="General">General (Shared Ward)</option>
                    <option value="Semi-Private">Semi-Private (Twin Bed)</option>
                    <option value="Private">Private (Single Room Deluxe)</option>
                    <option value="ICU">Intensive Care Unit (ICU)</option>
                  </select>
                </div>

                <div className="col-span-2 bg-[#f8fafc] border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Rooms Setup</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 inline-block">Specify rooms inside this ward & beds configuration.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-500">Rooms:</span>
                      <select
                        value={roomCount}
                        onChange={(e) => handleRoomCountChange(parseInt(e.target.value))}
                        className="px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs font-bold outline-none text-slate-700"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(n => (
                          <option key={n} value={n}>{n} Rooms</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rooms Dynamic Inputs Container */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {roomsList.map((room, idx) => (
                      <div key={room.id} className="grid grid-cols-12 gap-2 bg-white p-2 rounded-lg border border-slate-100">
                        <div className="col-span-7 flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-300">#{idx + 1}</span>
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => handleRoomFieldChange(idx, 'name', e.target.value)}
                            placeholder={`Room ${101 + idx}`}
                            className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-[#007f6e] outline-none"
                            required
                          />
                        </div>
                        <div className="col-span-5 flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">Beds Qty:</span>
                          <select
                            value={room.bedsCount}
                            onChange={(e) => handleRoomFieldChange(idx, 'bedsCount', parseInt(e.target.value))}
                            className="w-full text-xs px-2 py-1 border border-slate-250 bg-white rounded outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 8, 10].map(bn => (
                              <option key={bn} value={bn}>{bn} Beds</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total beds counter preview */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">Sumulated Beds Capacity (ReadOnly):</span>
                    <strong className="text-[#007f6e] font-mono font-extrabold text-sm">{totalBedsInForm} Beds Total</strong>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowWardModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-500 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel Guidance
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007f6e] hover:bg-[#006657] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Check size={14} />
                  <span>{editingWard ? 'Update Ward Config' : 'Save Config & Initialize'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PATIENT ADMISSION / ALLOCATION HANDLER */}
      {showAdmissionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-220 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserCheck size={16} className="text-[#007f6e]" />
                Assign Patient Bed Allocation
              </h3>
              <button 
                onClick={() => setShowAdmissionModal(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePatientAdmissionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Select Registered Patient
                </label>
                <select
                  value={admissionPatientId}
                  onChange={(e) => setAdmissionPatientId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none text-slate-700"
                  required
                >
                  <option value="">-- Choose New/Pending Patient --</option>
                  {/* Patients without any active bed assigned */}
                  {patients.filter(p => !p.wardId).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age}y, {p.gender}) - {p.phone}
                    </option>
                  ))}
                  {/* Plus include patients already with beds so we can switch them */}
                  {patients.filter(p => p.wardId).map(p => (
                    <option key={p.id} value={p.id}>
                      [SWITCH BED] {p.name} - currently Bed {p.bedNumber} ({p.roomId})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">If candidate is unregistered, register them first under Patients Tab.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Prospective Ward
                </label>
                <select
                  value={admissionWardId}
                  onChange={(e) => {
                    setAdmissionWardId(e.target.value);
                    setAdmissionRoomId('');
                    setAdmissionBedNumber('');
                  }}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none text-slate-700"
                  required
                >
                  <option value="">-- Choose Ward --</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>

              {admissionWardId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Choose Room
                    </label>
                    <select
                      value={admissionRoomId}
                      onChange={(e) => {
                        setAdmissionRoomId(e.target.value);
                        setAdmissionBedNumber('');
                      }}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl lg:outline-none focus:border-[#007f6e] outline-none text-slate-700"
                      required
                    >
                      <option value="">-- Choose Room --</option>
                      {(() => {
                        const targetWard = wards.find(w => w.id === admissionWardId);
                        if (!targetWard) return null;
                        try {
                          const rList = targetWard.roomsData ? JSON.parse(targetWard.roomsData) : [];
                          return rList.map((r: any) => (
                            <option key={r.id} value={r.name}>{r.name} ({r.bedsCount} Beds)</option>
                          ));
                        } catch {
                          return null;
                        }
                      })()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Bed Number
                    </label>
                    <select
                      value={admissionBedNumber}
                      onChange={(e) => setAdmissionBedNumber(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] outline-none text-slate-700"
                      required
                    >
                      <option value="">-- Seat --</option>
                      {(() => {
                        const targetWard = wards.find(w => w.id === admissionWardId);
                        if (!targetWard || !admissionRoomId) return null;
                        try {
                          const rList = targetWard.roomsData ? JSON.parse(targetWard.roomsData) : [];
                          const targetRoom = rList.find((r: any) => r.name === admissionRoomId);
                          if (!targetRoom) return null;
                          return Array.from({ length: targetRoom.bedsCount }).map((_, i) => {
                            const bedNumStr = String(i + 1);
                            // Highlight if occupied
                            const occupant = patients.find(p => p.wardId === admissionWardId && p.roomId === admissionRoomId && String(p.bedNumber) === bedNumStr);
                            return (
                              <option 
                                key={bedNumStr} 
                                value={bedNumStr}
                                disabled={!!occupant}
                              >
                                Bed #{bedNumStr} {occupant ? `(Admitted: ${occupant.name})` : '(Available)'}
                              </option>
                            );
                          });
                        } catch {
                          return null;
                        }
                      })()}
                    </select>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAdmissionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-500 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007f6e] hover:bg-[#006657] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Admit Patient Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW PATIENT DETAILS */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white border rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button 
              onClick={() => setViewingPatient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-3 mt-2">
              <div className="w-14 h-14 bg-blue-50 text-[#007f6e] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">{viewingPatient.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Patient File ID: {viewingPatient.id}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-b border-slate-50 py-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Age / Gender:</span>
                <span className="font-semibold text-slate-750">{viewingPatient.age} yrs · {viewingPatient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Phone:</span>
                <span className="font-mono text-slate-755">{viewingPatient.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Onboarding Date:</span>
                <span>{new Date(viewingPatient.registeredAt).toLocaleDateString()}</span>
              </div>
              
              {viewingPatient.wardId && (
                <>
                  <div className="flex justify-between pb-1 border-t border-slate-50 pt-3">
                    <span className="text-slate-400 font-semibold text-xs">Assigned Ward:</span>
                    <strong className="text-slate-800 text-xs">
                      {wards.find(w => w.id === viewingPatient.wardId)?.name || 'Ward Profile'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Occupied Room:</span>
                    <strong className="text-slate-700">{viewingPatient.roomId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bed Allocation:</span>
                    <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-100 text-[10px] uppercase">
                      Seat Bed {viewingPatient.bedNumber}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setViewingPatient(null);
                  handleOpenAllocateModal(viewingPatient.wardId || '', viewingPatient.roomId || '', viewingPatient.bedNumber || '');
                }}
                className="flex-1 py-2 text-center text-xs font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Transfer Bed
              </button>

              {viewingPatient.wardId && (
                <button
                  onClick={() => {
                    const temp = viewingPatient;
                    setViewingPatient(null);
                    handleDischargePatient(temp);
                  }}
                  className="flex-1 py-2 text-center text-xs font-bold bg-rose-50 border border-rose-105 hover:bg-rose-100/60 text-rose-650 rounded-xl cursor-pointer"
                >
                  Discharge Patients
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW WARD ROOMS CONFIG DETAILS */}
      {viewingWard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setViewingWard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Home size={18} className="text-[#007f6e]" />
                <h3 className="font-extrabold text-sm text-slate-800">{viewingWard.name}</h3>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Type: {viewingWard.type || 'General'}</p>
            </div>

            <div className="mt-5 space-y-3 max-h-60 overflow-y-auto border-t border-slate-50 pt-4">
              <h4 className="text-[10px] uppercase font-extrabold text-slate-450 tracking-wider">Rooms & Bed Occupancy Mapping</h4>
              {(() => {
                let parsedRooms: RoomConfig[] = [];
                try {
                  parsedRooms = viewingWard.roomsData ? JSON.parse(viewingWard.roomsData) : [];
                } catch {
                  parsedRooms = [];
                }

                if (parsedRooms.length === 0) {
                  return <p className="text-xs text-slate-400 italic">No rooms configured.</p>;
                }

                return parsedRooms.map(room => {
                  return (
                    <div key={room.id} className="p-3 bg-[#fafbfc] border border-slate-100 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{room.name}</span>
                        <span className="text-[10px] text-slate-400">{room.bedsCount} Beds Capacity</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {Array.from({ length: Number(room.bedsCount || 0) }).map((_, idx) => {
                          const num = idx + 1;
                          const occupant = patients.find(p => p.wardId === viewingWard.id && p.roomId === room.name && String(p.bedNumber) === String(num));
                          return (
                            <div key={idx} className="bg-white p-2 rounded-lg border border-slate-50 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-mono">Bed #{num}</span>
                              <span className={occupant ? 'text-rose-500 font-bold' : 'text-emerald-500 font-semibold'}>
                                {occupant ? occupant.name : 'Free'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setViewingWard(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
