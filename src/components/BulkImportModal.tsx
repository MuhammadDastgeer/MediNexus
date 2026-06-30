import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, FileText, Download, Sparkles, Database } from 'lucide-react';

interface BulkImportModalProps {
  entityType: 'patients' | 'doctors' | 'staff' | 'appointments' | 'inventory';
  onClose: () => void;
  onRefresh: () => void;
}

export default function BulkImportModal({ entityType, onClose, onRefresh }: BulkImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schema specifications for guidance & validation
  const schemas = {
    patients: {
      title: 'Patients List',
      required: ['name', 'age', 'gender'],
      optional: ['phone', 'status', 'bloodGroup', 'address', 'email', 'password'],
      sample: `name,age,gender,phone,status,bloodGroup,address,email,password
M. Ramzan,45,Male,+923001234567,Follow-up,O+,House 123 Street 4,ramzan@email.com,pass123
Kiran Shah,28,Female,+923219876543,New,B-,Apartment 4B,kiran@email.com,pass123`,
      endpoint: '/api/patients',
      mapper: (row: Record<string, string>) => {
        const id = `pat-${Math.floor(Math.random() * 9000 + 1000)}`;
        return {
          id,
          name: row.name || 'Unnamed Patient',
          age: Number(row.age) || 30,
          gender: row.gender || 'Male',
          phone: row.phone || '',
          registeredAt: new Date().toISOString(),
          status: row.status || 'New',
          bloodGroup: row.bloodGroup || '',
          address: row.address || '',
          email: row.email || '',
          password: row.password || 'password123'
        };
      }
    },
    doctors: {
      title: 'Clinical Specialists (Doctors)',
      required: ['name', 'specialization'],
      optional: ['status', 'phone', 'email', 'fee', 'gender', 'dob', 'bloodGroup', 'address', 'qualification', 'experience', 'medicalRegNo', 'licenseNumber', 'department'],
      sample: `name,specialization,status,phone,email,fee,gender,dob,bloodGroup,address,qualification,experience,medicalRegNo,licenseNumber,department
Dr. Sarah Connor,Cardiology,On Duty,+923123456789,sarah@email.com,600,Female,1985-05-12,A-,789 Avenue,MD Cardiology,8,REG12345,LIC98765,Cardiology`,
      endpoint: '/api/doctors',
      mapper: (row: Record<string, string>) => {
        const id = `doc-${Math.floor(Math.random() * 9000 + 1000)}`;
        return {
          id,
          name: row.name || 'Dr. New Specialist',
          specialization: row.specialization || 'General Medicine',
          status: row.status || 'On Duty',
          phone: row.phone || '',
          email: row.email || '',
          fee: Number(row.fee || 500),
          gender: row.gender || 'Male',
          dob: row.dob || '',
          bloodGroup: row.bloodGroup || '',
          address: row.address || '',
          qualification: row.qualification || 'MBBS',
          experience: Number(row.experience) || 0,
          medicalRegNo: row.medicalRegNo || '',
          licenseNumber: row.licenseNumber || '',
          department: row.department || row.specialization || 'General Medicine'
        };
      }
    },
    staff: {
      title: 'Staff Roster',
      required: ['name', 'role', 'department'],
      optional: ['status', 'email', 'phone', 'joinDate', 'dob', 'workingDays', 'address', 'monthlySalary'],
      sample: `name,role,department,status,email,phone,joinDate,dob,workingDays,address,monthlySalary
Jane Smith,Nurse,Emergency Care,Active,jane@email.com,+923214567890,2024-01-10,1990-08-15,"Mon,Tue,Wed",123 Lane,45000`,
      endpoint: '/api/staff',
      mapper: (row: Record<string, string>) => {
        const id = `st-${Math.floor(Math.random() * 9000 + 1000)}`;
        return {
          id,
          name: row.name || 'New Staff Member',
          role: row.role || 'Staff',
          department: row.department || 'General Support',
          status: row.status || 'Active',
          email: row.email || '',
          phone: row.phone || '',
          joinDate: row.joinDate || new Date().toISOString().slice(0, 10),
          dob: row.dob || '',
          workingDays: row.workingDays || 'Mon,Tue,Wed,Thu,Fri',
          address: row.address || '',
          monthlySalary: Number(row.monthlySalary) || 25000
        };
      }
    },
    appointments: {
      title: 'Appointments Schedule',
      required: ['patientName', 'doctorName', 'date', 'time'],
      optional: ['specialization', 'status', 'type', 'department', 'patientEmail', 'patientPhone', 'patientGender', 'age'],
      sample: `patientName,doctorName,specialization,date,time,status,type,department,patientEmail,patientPhone,patientGender,age
John Doe,Dr. Sameer Khan,Orthopedics,2026-06-30,10:30 AM,Scheduled,OPD,Orthopedics,john@email.com,+923001234567,Male,34`,
      endpoint: '/api/appointments',
      mapper: (row: Record<string, string>) => {
        const id = `apt-${Math.floor(Math.random() * 9000 + 1000)}`;
        return {
          id,
          patientName: row.patientName || 'Unnamed Patient',
          doctorName: row.doctorName || 'Dr. Anil Sharma',
          specialization: row.specialization || 'General Medicine',
          date: row.date || new Date().toISOString().slice(0, 10),
          time: row.time || '10:00 AM',
          status: row.status || 'Scheduled',
          type: row.type || 'OPD',
          department: row.department || row.specialization || 'General',
          patientEmail: row.patientEmail || '',
          patientPhone: row.patientPhone || '',
          patientGender: row.patientGender || 'Male',
          age: Number(row.age) || 30
        };
      }
    },
    inventory: {
      title: 'Inventory Stock',
      required: ['name', 'category', 'stock', 'price'],
      optional: ['minStock', 'unit', 'hsnCode', 'mrp', 'sellingPrice', 'gst', 'status', 'genericName', 'brandName', 'subCategory', 'preferredSupplier'],
      sample: `name,category,stock,minStock,price,unit,hsnCode,mrp,sellingPrice,gst,status,genericName,brandName,subCategory,preferredSupplier
Ibuprofen 400mg,Medicine,250,20,15,Tablet,HSN789,25,20,12,Active,Ibuprofen,Actipro,Analgesics,Pharma Supplier Ltd`,
      endpoint: '/api/inventory',
      mapper: (row: Record<string, string>) => {
        const id = `inv-${Math.floor(Math.random() * 9000 + 1000)}`;
        return {
          id,
          name: row.name || 'Unnamed Stock Item',
          category: row.category || 'Medicine',
          stock: Number(row.stock) || 0,
          minStock: Number(row.minStock || 5),
          price: Number(row.price || row.purchasePrice || 0),
          unit: row.unit || 'pcs',
          hsnCode: row.hsnCode || '',
          mrp: Number(row.mrp || row.price || 0),
          sellingPrice: Number(row.sellingPrice || row.price || 0),
          gst: Number(row.gst || 0),
          status: row.status || 'Active',
          genericName: row.genericName || '',
          brandName: row.brandName || '',
          subCategory: row.subCategory || '',
          preferredSupplier: row.preferredSupplier || ''
        };
      }
    }
  };

  const currentSchema = schemas[entityType];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile: File) => {
    // Check if CSV or text
    if (!uploadedFile.name.endsWith('.csv') && !uploadedFile.name.endsWith('.txt')) {
      setStatus({ type: 'error', message: 'Please upload a valid CSV file (.csv or .txt).' });
      return;
    }

    setFile(uploadedFile);
    setStatus({ type: 'idle', message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(uploadedFile);
  };

  const parseCSVContent = (text: string) => {
    try {
      const rows: string[][] = [];
      let row: string[] = [];
      let inQuotes = false;
      let currentVal = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(currentVal.trim());
          currentVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          row.push(currentVal.trim());
          if (row.length > 1 || row[0] !== '') {
            rows.push(row);
          }
          row = [];
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      if (currentVal !== '' || row.length > 0) {
        row.push(currentVal.trim());
        rows.push(row);
      }

      if (rows.length === 0) {
        setStatus({ type: 'error', message: 'The uploaded file is empty.' });
        return;
      }

      const csvHeaders = rows[0].map(h => h.toLowerCase().trim());
      const rawDataRows = rows.slice(1);

      // Verify required fields
      const missingRequired = currentSchema.required.filter(
        req => !csvHeaders.includes(req.toLowerCase())
      );

      if (missingRequired.length > 0) {
        setStatus({
          type: 'error',
          message: `Missing required CSV columns: ${missingRequired.join(', ')}`
        });
        return;
      }

      setHeaders(rows[0]);

      // Map and validate rows based on headers
      const validItems: any[] = [];
      let skippedCount = 0;

      rawDataRows.forEach(dataRow => {
        // Skip empty rows
        if (dataRow.length === 0 || (dataRow.length === 1 && dataRow[0].trim() === '')) {
          return;
        }

        const itemObj: Record<string, string> = {};
        csvHeaders.forEach((header, index) => {
          if (index < dataRow.length) {
            itemObj[header] = dataRow[index] ? dataRow[index].trim() : '';
          } else {
            itemObj[header] = '';
          }
        });

        // Validate that all required fields are present and have non-empty values
        let hasAllRequired = true;
        for (const req of currentSchema.required) {
          const val = itemObj[req.toLowerCase().trim()];
          if (!val || val.trim() === '') {
            hasAllRequired = false;
            break;
          }
        }

        if (hasAllRequired) {
          validItems.push(currentSchema.mapper(itemObj));
        } else {
          skippedCount++;
        }
      });

      if (validItems.length === 0) {
        setStatus({
          type: 'error',
          message: `No valid records found. All ${skippedCount} rows were skipped due to missing required fields: ${currentSchema.required.join(', ')}`
        });
        setParsedData([]);
        return;
      }

      setParsedData(validItems);

      if (skippedCount > 0) {
        setStatus({
          type: 'idle',
          message: `Parsed ${validItems.length} valid records successfully. Skipped ${skippedCount} rows because they were missing required information (${currentSchema.required.join(', ')}). Ready to import.`
        });
      } else {
        setStatus({
          type: 'idle',
          message: `Parsed all ${validItems.length} records successfully. Ready to import.`
        });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: `Failed to parse file: ${err.message}` });
    }
  };

  const executeImport = async () => {
    if (parsedData.length === 0) return;

    setIsProcessing(true);
    setStatus({ type: 'idle', message: 'Uploading and saving clinical records to database...' });
    let successCount = 0;

    try {
      for (const item of parsedData) {
        const response = await fetch(currentSchema.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        if (response.ok) {
          successCount++;
        }
      }

      setImportCount(successCount);
      setStatus({
        type: 'success',
        message: `Successfully imported ${successCount} out of ${parsedData.length} ${entityType} records into the hospital database.`
      });
      onRefresh();
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Database synchronization interrupted after ${successCount} successful saves. Error: ${err.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCSV = () => {
    const element = document.createElement("a");
    const fileContent = new Blob([currentSchema.sample], { type: 'text/csv;charset=utf-8;' });
    element.href = URL.createObjectURL(fileContent);
    element.download = `sample_${entityType}_bulk_import.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in select-none">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-100 animate-slide-up my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Database size={18} className="text-emerald-100" />
              Bulk Data Import Console
            </h3>
            <p className="text-[10px] sm:text-xs text-emerald-100/90 font-medium">
              Upload formatted CSV or Excel-compatible sheets to direct populate {currentSchema.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/10 p-1.5 rounded-full hover:scale-105 transition-all cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Guide & Instructions */}
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/60 space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" />
              Columns Requirements for {currentSchema.title}
            </h4>
            <div className="text-xs text-slate-750 leading-relaxed space-y-1.5">
              <p>
                <strong>Required Columns:</strong>{' '}
                {currentSchema.required.map(col => (
                  <span key={col} className="bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md font-mono text-[10px] mx-0.5 inline-block border border-emerald-200/50">
                    {col}
                  </span>
                ))}
              </p>
              <p>
                <strong>Optional Columns:</strong>{' '}
                {currentSchema.optional.map(col => (
                  <span key={col} className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-mono text-[10px] mx-0.5 inline-block border border-slate-200/50">
                    {col}
                  </span>
                ))}
              </p>
            </div>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-extrabold cursor-pointer transition-colors pt-1"
            >
              <Download size={13} />
              Download Excel/CSV Template
            </button>
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                : 'border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-slate-50 text-slate-600 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="space-y-3">
              <div className="w-12 h-12 bg-emerald-100/80 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                <Upload size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {file ? file.name : 'Drop your CSV file here or click to browse'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supported format: Comma-Separated Values (.csv, .txt) with correct headers
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {status.type !== 'idle' && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : status.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600 mt-0.5 shrink-0" />
              )}
              <div className="text-xs">
                <p className="font-semibold">{status.type === 'success' ? 'Import Completed!' : 'Import Notice'}</p>
                <p className="mt-0.5 leading-relaxed font-medium">{status.message}</p>
              </div>
            </div>
          )}

          {/* parsed records preview */}
          {parsedData.length > 0 && status.type !== 'success' && (
            <div className="space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-400" />
                  Loaded Records Preview ({parsedData.length} found)
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  Ready to Sync
                </span>
              </div>
              <div className="border border-slate-150 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-slate-50/50">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10">
                      {headers.slice(0, 4).map((h, i) => (
                        <th key={i} className="p-2 truncate capitalize">{h}</th>
                      ))}
                      {headers.length > 4 && <th className="p-2 text-slate-400">...</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-750">
                    {parsedData.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white bg-white/70">
                        {headers.slice(0, 4).map((h, hIdx) => {
                          const val = row[h.toLowerCase().trim()] || row[h.trim()];
                          return (
                            <td key={hIdx} className="p-2 truncate max-w-[120px]">
                              {val === undefined || val === null ? '-' : String(val)}
                            </td>
                          );
                        })}
                        {headers.length > 4 && <td className="p-2 text-slate-400">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-[10px] text-slate-400 text-right italic font-medium">
                  Showing first 5 records only
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {parsedData.length > 0 && status.type !== 'success' && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={executeImport}
              className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>Save to Database</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
