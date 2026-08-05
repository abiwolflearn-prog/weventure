import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { ticketingApi } from '../../lib/ticketingApi';
import { FileUp, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportAttendeesModalProps {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportAttendeesModal({ eventId, onClose, onSuccess }: ImportAttendeesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'PARSING' | 'PREVIEW' | 'IMPORTING' | 'DONE'>('IDLE');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setImportStatus('PARSING');
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          header: true,
          complete: (results) => {
            setPreviewData(results.data);
            setImportStatus('PREVIEW');
          },
        });
      } else {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setPreviewData(jsonData);
        setImportStatus('PREVIEW');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setImportStatus('IMPORTING');
    try {
      // Map and send to API
      await ticketingApi.importAttendees(eventId, previewData.map(d => ({
          firstName: d['First Name'],
          lastName: d['Last Name'],
          email: d['Email']
      })));
      alert('Attendees imported successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      alert('Import failed');
      setImportStatus('PREVIEW');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Import Attendees">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="secondary" as="span"><FileUp className="w-4 h-4 mr-2" /> Upload File</Button>
            </label>
            <Button variant="secondary" onClick={() => {
                const template = [['First Name', 'Last Name', 'Email', 'Phone Number', 'Company', 'Job Title', 'Ticket Type', 'Registration Status', 'Check-in Status']];
                const ws = XLSX.utils.aoa_to_sheet(template);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Template');
                XLSX.writeFile(wb, 'attendee_template.xlsx');
            }}><Download className="w-4 h-4 mr-2" /> Download Template</Button>
        </div>
        
        {importStatus === 'PREVIEW' && (
          <div className="space-y-4">
            <p>Previewing {previewData.length} records</p>
            <Button onClick={handleImport}>Import All Valid Records</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
