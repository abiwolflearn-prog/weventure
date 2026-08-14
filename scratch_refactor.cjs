const fs = require('fs');

const crmPath = 'src/views/CrmDashboard.tsx';
const invPath = 'src/views/InvoicesPage.tsx';

let crm = fs.readFileSync(crmPath, 'utf8').replace(/\r\n/g, '\n');
let inv = fs.readFileSync(invPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Extract from CRM
const statesMarkerStart = '// Enhanced Create Invoice States';
const statesMarkerEnd = '// Form Modals State';
const idx1 = crm.indexOf(statesMarkerStart);
const idx2 = crm.indexOf(statesMarkerEnd);
if (idx1 === -1 || idx2 === -1) throw new Error('CRM states not found');
const crmStates = crm.substring(idx1, idx2);

const formStateStart = 'const [invoiceForm, setInvoiceForm] = useState({';
const formStateEnd = 'const [paymentForm, setPaymentForm] = useState({';
const idx3 = crm.indexOf(formStateStart);
const idx4 = crm.indexOf(formStateEnd);
if (idx3 === -1 || idx4 === -1) throw new Error('CRM form state not found');
const crmFormState = crm.substring(idx3, idx4);

const handlerStart = '// Create Invoice Submission';
const handlerEnd = '// Record Payment Submission';
const idx5 = crm.indexOf(handlerStart);
const idx6 = crm.indexOf(handlerEnd);
if (idx5 === -1 || idx6 === -1) throw new Error('CRM handler not found');
const crmHandler = crm.substring(idx5, idx6);

const modalStart = '{/* 8. CREATE WORKSPACE INVOICE MODAL */}';
const modalEnd = '{/* 9. RECORD PAYMENT MODAL */}';
const idx7 = crm.indexOf(modalStart);
const idx8 = crm.indexOf(modalEnd);
if (idx7 === -1 || idx8 === -1) throw new Error('CRM modal not found');
const crmModal = crm.substring(idx7, idx8);

// 2. Remove buttons/actions from CRM
const crmTopBtnIdx = crm.indexOf('Create Workspace Invoice');
if (crmTopBtnIdx !== -1) {
    let btnStart = crm.lastIndexOf('<Button', crmTopBtnIdx);
    let btnEnd = crm.indexOf('</Button>', crmTopBtnIdx) + '</Button>'.length;
    if (btnStart !== -1 && btnEnd !== -1) {
        crm = crm.substring(0, btnStart) + crm.substring(btnEnd);
    }
}
crm = crm.replace(/<Button[^>]*?onClick=\{\(\) => \{\s*setInvoiceForm[\s\S]*?Create (Workspace )?Invoice\s*<\/Button>/g, '');
crm = crm.replace(/<button[^>]*?onClick=\{\(\) => setIsCreateInvoiceOpen\(true\)\}[\s\S]*?<\/button>/g, '');

fs.writeFileSync(crmPath, crm);
console.log('CRM cleaned successfully');

// 3. Update InvoicesPage
// Button
const invBtnTextIdx = inv.indexOf('<span>Create Invoice</span>');
if (invBtnTextIdx === -1) throw new Error('Inv button not found');
let invBtnStart = inv.lastIndexOf('<Button', invBtnTextIdx);
let invBtnEnd = inv.indexOf('</Button>', invBtnTextIdx) + '</Button>'.length;

const newBtn = `  <Button
  size="sm"
  onClick={() => setIsCreateInvoiceOpen(true)}
  className="bg-[#84CC16] hover:bg-lime-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
  >
  <Plus className="w-4 h-4" />
  <span>Create Workspace Invoice</span>
  </Button>`;

inv = inv.substring(0, invBtnStart) + newBtn + inv.substring(invBtnEnd);

// State replacement
const oldStateStart = inv.indexOf('// Create Invoice Modal State');
const oldStateEnd = inv.indexOf('// Print ref');
if (oldStateStart === -1 || oldStateEnd === -1) throw new Error(`Inv states not found: start=${oldStateStart}, end=${oldStateEnd}`);

const adaptedHandler = crmHandler.replace('loadCrmData();', 'queryClient.invalidateQueries({ queryKey: [\'invoices\'] });\n      queryClient.invalidateQueries({ queryKey: [\'invoice-stats\'] });');
const newInvStates = `  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);\n  ` + crmStates + '  ' + crmFormState + adaptedHandler + '\n\n';

inv = inv.substring(0, oldStateStart) + newInvStates + inv.substring(oldStateEnd);

// Modal replacement
const oldModalStart = inv.indexOf('{/* ADMIN CREATE INVOICE MODAL */}');
const oldModalEnd = inv.indexOf('  </div>\n  );\n}', oldModalStart);
if (oldModalStart === -1 || oldModalEnd === -1) throw new Error(`Inv modal not found: start=${oldModalStart}, end=${oldModalEnd}`);

inv = inv.substring(0, oldModalStart) + crmModal + '\n\n' + inv.substring(oldModalEnd);

// Imports
if (!inv.includes('Trash2,')) {
    inv = inv.replace('import {', 'import {\n  Trash2,');
}
if (!inv.includes('WEVENTURE_BANKS')) {
    inv = inv.replace('WEVENTURE_SUPPLIER_INFO', 'WEVENTURE_SUPPLIER_INFO, WEVENTURE_BANKS');
}
if (!inv.includes("import { motion, AnimatePresence } from 'motion/react';")) {
    inv = "import { motion, AnimatePresence } from 'motion/react';\n" + inv;
}

fs.writeFileSync(invPath, inv);
console.log('InvoicesPage refactored successfully!');
