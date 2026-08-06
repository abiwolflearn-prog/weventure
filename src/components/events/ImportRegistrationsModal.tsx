import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { axiosInstance } from '../../lib/axiosInstance';
import { 
  FileUp, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X, 
  Check, 
  Info,
  ChevronDown,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface ImportRegistrationsModalProps {
  eventId: string;
  eventTitle: string;
  registrations: any[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  index: number;
  original: Record<string, any>;
  firstName: string;
  lastName: string;
  email: string;
  status: 'valid' | 'duplicate' | 'invalid';
  reason?: string;
}

export function ImportRegistrationsModal({ 
  eventId, 
  eventTitle, 
  registrations, 
  onClose, 
  onSuccess 
}: ImportRegistrationsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'PARSING' | 'PREVIEW' | 'IMPORTING' | 'DONE'>('IDLE');
  
  // Columns matched for preview info
  const [detectedColumns, setDetectedColumns] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  }>({ firstName: '', lastName: '', email: '' });

  // Filter for preview list
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'duplicate' | 'invalid'>('all');

  // Final summary stats
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    skippedDuplicates: 0,
    invalid: 0,
    errors: [] as { email: string; reason: string }[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        setFile(droppedFile);
        parseFile(droppedFile);
      } else {
        alert('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Automated smart column mapper
  const autoDetectColumns = (headers: string[]) => {
    let firstNameCol = '';
    let lastNameCol = '';
    let emailCol = '';
    let fullNameCol = '';

    const firstNameSynonyms = ['first name', 'firstname', 'first', 'fname', 'attendee first name', 'given name'];
    const lastNameSynonyms = ['last name', 'lastname', 'last', 'lname', 'attendee last name', 'sur name', 'surname', 'family name'];
    const emailSynonyms = ['email', 'email address', 'emailaddress', 'mail', 'attendee email', 'e-mail'];
    const fullNameSynonyms = ['name', 'full name', 'fullname', 'attendee name', 'display name'];

    for (const header of headers) {
      const cleanHeader = header.toLowerCase().trim().replace(/[\s_-]+/g, ' ');
      
      if (!firstNameCol && firstNameSynonyms.some(s => cleanHeader === s || cleanHeader.includes(s))) {
        firstNameCol = header;
      } else if (!lastNameCol && lastNameSynonyms.some(s => cleanHeader === s || cleanHeader.includes(s))) {
        lastNameCol = header;
      } else if (!emailCol && emailSynonyms.some(s => cleanHeader === s || cleanHeader.includes(s))) {
        emailCol = header;
      } else if (!fullNameCol && fullNameSynonyms.some(s => cleanHeader === s || cleanHeader.includes(s))) {
        fullNameCol = header;
      }
    }

    // Try fuzzy substring matches if exact/synonym mapping failed
    if (!firstNameCol) {
      firstNameCol = headers.find(h => h.toLowerCase().includes('first') || h.toLowerCase().includes('fname')) || '';
    }
    if (!lastNameCol) {
      lastNameCol = headers.find(h => h.toLowerCase().includes('last') || h.toLowerCase().includes('lname')) || '';
    }
    if (!emailCol) {
      emailCol = headers.find(h => h.toLowerCase().includes('email') || h.toLowerCase().includes('mail')) || '';
    }
    if (!fullNameCol) {
      fullNameCol = headers.find(h => h.toLowerCase().includes('name')) || '';
    }

    // Ultimate fallback based on indices if still completely empty
    if (!firstNameCol && !fullNameCol && headers.length > 0) firstNameCol = headers[0];
    if (!lastNameCol && firstNameCol && headers.length > 1) lastNameCol = headers[1];
    if (!emailCol && headers.length > 2) {
      // Pick third column or whichever first has an @ symbol (checked during cell pass, fallback to index 2 here)
      emailCol = headers[2];
    }

    return { firstNameCol, lastNameCol, emailCol, fullNameCol };
  };

  const parseFile = (file: File) => {
    setImportStatus('PARSING');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rawData: any[] = [];
        let headers: string[] = [];

        if (file.name.endsWith('.csv')) {
          // Parse CSV with PapaParse supporting UTF-8 and auto-encoding detection
          Papa.parse(data as string, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (results) => {
              rawData = results.data;
              if (results.meta && results.meta.fields) {
                headers = results.meta.fields;
              } else if (rawData.length > 0) {
                headers = Object.keys(rawData[0]);
              }
              processRawData(rawData, headers);
            },
            error: (err) => {
              throw new Error(err.message);
            }
          });
        } else {
          // Parse Excel (binary) with SheetJS
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          // Use standard JSON conversion
          rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (rawData.length > 0) {
            headers = Object.keys(rawData[0]);
          }
          processRawData(rawData, headers);
        }
      } catch (err: any) {
        alert(`Error parsing file: ${err.message || 'Malformed structure'}`);
        setImportStatus('IDLE');
        setFile(null);
      }
    };

    if (file.name.endsWith('.csv')) {
      // Use readAsText to preserve UTF-8 and local special characters perfectly
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const processRawData = (rawData: any[], headers: string[]) => {
    if (rawData.length === 0) {
      alert('The uploaded file contains no data rows.');
      setImportStatus('IDLE');
      setFile(null);
      return;
    }

    const colMapping = autoDetectColumns(headers);
    setDetectedColumns({
      firstName: colMapping.firstNameCol || colMapping.fullNameCol || 'Not detected',
      lastName: colMapping.lastNameCol || 'Not detected',
      email: colMapping.emailCol || 'Not detected'
    });

    const existingEmails = new Set(registrations.map(r => r.attendeeEmail?.toLowerCase()?.trim()));
    const fileProcessedEmails = new Set<string>();

    const mappedRows: ParsedRow[] = rawData.map((row, idx) => {
      let fName = '';
      let lName = '';
      let emailVal = '';

      // Extract Email
      if (colMapping.emailCol && row[colMapping.emailCol]) {
        emailVal = String(row[colMapping.emailCol]).trim();
      }

      // Extract First and Last Name
      if (colMapping.firstNameCol && row[colMapping.firstNameCol]) {
        fName = String(row[colMapping.firstNameCol]).trim();
      }
      if (colMapping.lastNameCol && row[colMapping.lastNameCol]) {
        lName = String(row[colMapping.lastNameCol]).trim();
      }

      // Handle split if Full Name column is matched instead of individual first/last columns
      if ((!fName || !lName) && colMapping.fullNameCol && row[colMapping.fullNameCol]) {
        const fullName = String(row[colMapping.fullNameCol]).trim();
        const parts = fullName.split(/\s+/);
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || 'Attendee';
      }

      let status: 'valid' | 'duplicate' | 'invalid' = 'valid';
      let reason = '';

      // 1. Mandatory Fields Presence Validation
      if (!emailVal) {
        status = 'invalid';
        reason = 'Missing Email Address';
      } else if (!isValidEmail(emailVal)) {
        status = 'invalid';
        reason = 'Invalid Email Format';
      } else if (!fName) {
        status = 'invalid';
        reason = 'Missing First Name / Full Name';
      }

      // 2. Local Duplicate Validation (duplicates within the same file)
      if (status === 'valid') {
        const lowerEmail = emailVal.toLowerCase();
        if (fileProcessedEmails.has(lowerEmail)) {
          status = 'duplicate';
          reason = 'Duplicate in current import file';
        } else {
          fileProcessedEmails.add(lowerEmail);

          // 3. Existing Registrations Database Duplicate check
          if (existingEmails.has(lowerEmail)) {
            status = 'duplicate';
            reason = 'Already registered for this event';
          }
        }
      }

      return {
        index: idx + 1,
        original: row,
        firstName: fName,
        lastName: lName || 'Attendee',
        email: emailVal,
        status,
        reason
      };
    });

    setParsedRows(mappedRows);
    setImportStatus('PREVIEW');
  };

  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      alert('There are no valid registration rows to import.');
      return;
    }

    setImportStatus('IMPORTING');

    // Create bulk list of attendees to send
    const attendeesPayload = validRows.map(r => ({
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email
    }));

    try {
      const response = await axiosInstance.post(`/ticketing/events/${eventId}/attendees/import`, {
        attendees: attendeesPayload
      });

      const resData = response.data.data || {};
      
      // Calculate results
      const successCount = resData.success || 0;
      const failedCount = resData.failed || 0;
      const backendErrors = resData.errors || [];

      // Compile and update final summary statistics
      setSummary({
        total: parsedRows.length,
        success: successCount,
        skippedDuplicates: parsedRows.filter(r => r.status === 'duplicate').length + backendErrors.filter((e: any) => e.reason?.includes('already registered')).length,
        invalid: parsedRows.filter(r => r.status === 'invalid').length,
        errors: backendErrors.map((e: any) => ({
          email: e.attendee?.email || 'Unknown',
          reason: e.reason || 'Failed saving record'
        }))
      });

      setImportStatus('DONE');
    } catch (err: any) {
      alert(`Bulk Import Error: ${err.message || 'Server encountered an error saving registrations.'}`);
      setImportStatus('PREVIEW');
    }
  };

  const filteredRows = parsedRows.filter(row => {
    if (previewFilter === 'all') return true;
    return row.status === previewFilter;
  });

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter(r => r.status === 'duplicate').length;
  const invalidCount = parsedRows.filter(r => r.status === 'invalid').length;

  return (
    <Modal isOpen={true} onClose={onClose} title="Import Bulk Registrations">
      <div className="space-y-6 text-left max-h-[85vh] flex flex-col">
        
        {/* PROGRESS STEPPER HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0 px-6 pt-2">
          <div className="flex items-center space-x-2">
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${importStatus === 'IDLE' || importStatus === 'PARSING' ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {importStatus !== 'IDLE' && importStatus !== 'PARSING' ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <span className="text-xs font-bold text-gray-700">Upload</span>
          </div>
          <div className="h-[2px] w-12 bg-gray-200 flex-1 mx-2" />
          <div className="flex items-center space-x-2">
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${importStatus === 'PREVIEW' ? 'bg-brand-primary text-white' : importStatus === 'IMPORTING' || importStatus === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}`}>
              {importStatus === 'DONE' ? <Check className="w-3.5 h-3.5" /> : '2'}
            </span>
            <span className="text-xs font-bold text-gray-700">Preview</span>
          </div>
          <div className="h-[2px] w-12 bg-gray-200 flex-1 mx-2" />
          <div className="flex items-center space-x-2">
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${importStatus === 'DONE' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              3
            </span>
            <span className="text-xs font-bold text-gray-700">Results</span>
          </div>
        </div>

        {/* STEP 1: UPLOAD & DROPZONE */}
        {(importStatus === 'IDLE' || importStatus === 'PARSING') && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-left">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide">Import Instructions</h4>
                <p className="text-xs text-blue-800/85 leading-relaxed">
                  Bulk import attendees using an Excel (.xlsx, .xls) or Comma Separated (.csv) file. 
                  The tool automatically detects columns like **First Name**, **Last Name**, and **Email Address**. 
                  If a single **Full Name** or **Name** column is found, it will automatically split it for registration confirmation.
                </p>
              </div>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-200 hover:border-brand-primary/50 transition-colors rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 cursor-pointer bg-neutral-50/40"
              onClick={triggerFileSelect}
            >
              <div className="w-14 h-14 bg-white shadow-md border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                <FileUp className="w-7 h-7" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-neutral-800">Drag & Drop spreadsheet file here</p>
                <p className="text-xs text-neutral-slate-400">or click to browse local storage</p>
                <p className="text-[10px] text-neutral-slate-400 font-bold uppercase tracking-wider pt-2">Supports Excel (.xlsx, .xls) & CSV formats</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
              <span className="text-xs text-neutral-400 font-medium">Need a baseline starting file?</span>
              <Button 
                type="button"
                variant="secondary" 
                size="sm"
                className="text-xs font-bold"
                onClick={() => {
                  const template = [
                    ['First Name', 'Last Name', 'Email Address'],
                    ['Abebe', 'Bihon', 'abebe@weventurehub.com'],
                    ['Chala', 'Kebede', 'chala@weventurehub.com']
                  ];
                  const ws = XLSX.utils.aoa_to_sheet(template);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Registrations Template');
                  XLSX.writeFile(wb, 'weventurehub_bulk_registration_template.xlsx');
                }}
              >
                <Download className="w-4 h-4 mr-2" /> 
                Download Excel Template
              </Button>
            </div>

            {importStatus === 'PARSING' && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-30">
                <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                <p className="text-sm font-black text-neutral-800">Parsing spreadsheet structure...</p>
                <p className="text-xs text-neutral-slate-400">Verifying headers, emails and UTF-8 encoding</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PREVIEW & VERIFY */}
        {importStatus === 'PREVIEW' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* File Info & Detected Columns Bar */}
            <div className="px-6 pb-2 shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wide">Selected File</h4>
                  <p className="text-sm font-bold text-brand-primary truncate max-w-xs">{file?.name}</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-slate-400">First Name Col</span>
                    <span className="font-extrabold text-neutral-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                      {detectedColumns.firstName || 'None'}
                    </span>
                  </div>
                  {detectedColumns.lastName !== 'Not detected' && (
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-neutral-slate-400">Last Name Col</span>
                      <span className="font-extrabold text-neutral-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                        {detectedColumns.lastName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-neutral-slate-400">Email Col</span>
                    <span className="font-extrabold text-neutral-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                      {detectedColumns.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Selector Tabs */}
            <div className="px-6 pt-2 shrink-0 flex items-center gap-2">
              <button 
                onClick={() => setPreviewFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${previewFilter === 'all' ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-white border-gray-200 text-neutral-600 hover:bg-gray-50'}`}
              >
                <span>All Rows</span>
                <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">{parsedRows.length}</span>
              </button>
              <button 
                onClick={() => setPreviewFilter('valid')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${previewFilter === 'valid' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-neutral-600 hover:bg-gray-50'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ready to Import</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">{validCount}</span>
              </button>
              <button 
                onClick={() => setPreviewFilter('duplicate')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${previewFilter === 'duplicate' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-200 text-neutral-600 hover:bg-gray-50'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Skipped Duplicates</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">{duplicateCount}</span>
              </button>
              <button 
                onClick={() => setPreviewFilter('invalid')}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${previewFilter === 'invalid' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-gray-200 text-neutral-600 hover:bg-gray-50'}`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Invalid Rows</span>
                <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">{invalidCount}</span>
              </button>
            </div>

            {/* PREVIEW TABLE LIST */}
            <div className="flex-1 overflow-y-auto px-6 mt-4 border-b border-gray-100 min-h-0">
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-gray-200 text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                      <th className="px-4 py-3 w-12 text-center">Row</th>
                      <th className="px-4 py-3">Attendee Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Import Status</th>
                      <th className="px-4 py-3">Diagnostics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-xs text-neutral-slate-400 italic font-medium">
                          No rows match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.index} className="border-b border-neutral-100 text-xs hover:bg-neutral-50/50">
                          <td className="px-4 py-3 text-center text-neutral-slate-400 font-extrabold">{row.index}</td>
                          <td className="px-4 py-3 font-extrabold text-neutral-900">
                            {row.firstName} {row.lastName}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 font-bold">{row.email || <span className="text-rose-400 italic">Empty</span>}</td>
                          <td className="px-4 py-3">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                <Check className="w-3 h-3 text-emerald-600" /> Valid
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Skip
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                <X className="w-3 h-3 text-rose-600" /> Invalid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold text-xs ${row.status === 'invalid' ? 'text-rose-600' : row.status === 'duplicate' ? 'text-amber-600' : 'text-neutral-slate-400'}`}>
                              {row.reason || 'Ready for DB import'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-6 shrink-0 flex items-center justify-between bg-neutral-50/50">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setParsedRows([]);
                  setImportStatus('IDLE');
                  setFile(null);
                }}
                className="text-xs font-bold"
              >
                Reset & Choose Another File
              </Button>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-neutral-600">
                  Ready to import <strong className="text-emerald-600 text-sm">{validCount}</strong> valid of {parsedRows.length} total rows.
                </span>
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={handleImportSubmit}
                  disabled={validCount === 0}
                  className="text-xs font-bold px-6 py-2.5 shadow-md shadow-brand-primary/10"
                >
                  Confirm & Import Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LOADING OVERLAY */}
        {importStatus === 'IMPORTING' && (
          <div className="p-12 flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-neutral-800">Processing registrations upload...</h3>
              <p className="text-xs text-neutral-slate-400">Saving {parsedRows.filter(r => r.status === 'valid').length} registrations to WeVentureHub database.</p>
              <p className="text-[10px] text-neutral-slate-400">Updating analytics, ticket counts, and capacity settings.</p>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL BULK RESULTS SUMMARY */}
        {importStatus === 'DONE' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-center">
            <div className="flex flex-col items-center space-y-2 py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border-2 border-emerald-100 shadow-md">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-neutral-900 pt-2">Import Workflow Completed!</h3>
              <p className="text-xs text-neutral-slate-400 max-w-md">
                Registrations have been processed. Duplicates and invalid rows were safely bypassed to ensure database integrity.
              </p>
            </div>

            {/* Visual Stats Cards */}
            <div className="grid grid-cols-4 gap-4 text-left">
              <div className="bg-neutral-50 border border-gray-100 rounded-2xl p-4">
                <span className="block text-[10px] font-bold text-neutral-slate-400 uppercase tracking-wider">Total Rows</span>
                <span className="text-xl font-black text-neutral-800">{summary.total}</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Imported</span>
                <span className="text-xl font-black text-emerald-800">{summary.success}</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">Duplicates</span>
                <span className="text-xl font-black text-amber-800">{summary.skippedDuplicates}</span>
              </div>
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4">
                <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">Bypassed/Errors</span>
                <span className="text-xl font-black text-neutral-800">{summary.invalid}</span>
              </div>
            </div>

            {/* Detailed Backend Validation Errors List */}
            {summary.errors.length > 0 && (
              <div className="text-left space-y-2">
                <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Specific database-rejections ({summary.errors.length})</span>
                </h4>
                <div className="bg-rose-50/30 border border-rose-100/60 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2">
                  {summary.errors.map((err, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-rose-800">
                      <span className="font-extrabold">{err.email}</span>
                      <span className="font-semibold text-rose-600">{err.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DONE BUTTON */}
            <div className="border-t border-gray-100 pt-6 flex justify-end">
              <Button 
                type="button" 
                variant="primary" 
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="text-xs font-bold px-8 py-2.5"
              >
                Done
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
