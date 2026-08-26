export interface BankRecord {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export const WEVENTURE_BANKS: BankRecord[] = [
  {
    bankName: 'Dashen Bank',
    accountName: 'WE VENTURE HOLDINGS PLC',
    accountNumber: '001210684011',
    branch: 'Bole Branch',
  },
  {
    bankName: 'Zemen Bank S.C',
    accountName: 'WE VENTURE HOLDINGS PLC',
    accountNumber: '126110926406013',
    branch: 'Bole Rwanda Branch',
  },
  {
    bankName: 'Awash Bank',
    accountName: 'WE VENTURE HOLDINGS PLC',
    accountNumber: '013251088122000',
    branch: 'Africa Avenue Branch',
  },
  {
    bankName: 'Abyssinia Bank',
    accountName: 'WE VENTURE HOLDINGS PLC',
    accountNumber: '131263899',
    branch: 'Bole Branch',
  },
  {
    bankName: 'Commercial Bank of Ethiopia',
    accountName: 'WE VENTURE HOLDINGS PLC',
    accountNumber: '1000571098842',
    branch: 'Peacock Menafesha Branch',
  },
];

export const DEFAULT_BANK: BankRecord = WEVENTURE_BANKS[0]; // Dashen Bank

export const WEVENTURE_SUPPLIER_INFO = {
  companyName: 'WE VENTURE HOLDINGS PLC',
  address: 'Kirkos Sub City, W. 02 H. No New',
  vatRegNo: '23130180002',
  tinNo: '0082788884',
  taxId: '0082788884',
  dateOfRegistration: '', // [blank]
  email: 'info@weventurehub.com',
  phone: '0911243503',
};

/**
 * Get bank record by bank name. Defaults to Dashen Bank if not found.
 */
export function getBankRecord(bankName?: string): BankRecord {
  if (!bankName) return DEFAULT_BANK;
  const found = WEVENTURE_BANKS.find(
    (b) => b.bankName.trim().toLowerCase() === bankName.trim().toLowerCase()
  );
  return found || DEFAULT_BANK;
}

/**
 * Get multiple bank records by names or array. Defaults to at least 2 banks if not provided.
 */
export function getBankRecords(banks?: string | string[]): BankRecord[] {
  if (Array.isArray(banks) && banks.length > 0) {
    const list = banks
      .map((name) => WEVENTURE_BANKS.find((b) => b.bankName.trim().toLowerCase() === name.trim().toLowerCase()))
      .filter((b): b is BankRecord => Boolean(b));
    if (list.length > 0) return list;
  }

  if (typeof banks === 'string' && banks.trim().length > 0) {
    const parts = banks.split(',').map((s) => s.trim()).filter(Boolean);
    const list = parts
      .map((name) => WEVENTURE_BANKS.find((b) => b.bankName.trim().toLowerCase() === name.trim().toLowerCase()))
      .filter((b): b is BankRecord => Boolean(b));
    if (list.length > 0) return list;
    // Single string lookup fallback
    return [getBankRecord(banks)];
  }

  // Default to 2 banks for multi-bank options
  return [WEVENTURE_BANKS[0], WEVENTURE_BANKS[2]];
}

/**
 * Automatically generate the invoice total in words.
 * Example output: "Eighty Five and 00/100 USD"
 */
export function numberToWords(amount: number, currency: string = 'USD'): string {
  const num = Number(amount);
  if (isNaN(num) || num < 0) return `Zero and 00/100 ${currency || 'USD'}`;

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertInteger(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertInteger(n % 100) : '');
    if (n < 1000000) return convertInteger(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertInteger(n % 1000) : '');
    if (n < 1000000000) return convertInteger(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convertInteger(n % 1000000) : '');
    return convertInteger(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 ? ' ' + convertInteger(n % 1000000000) : '');
  }

  const roundedAmount = Math.round(num * 100) / 100;
  const integerPart = Math.floor(roundedAmount);
  const decimalPart = Math.round((roundedAmount - integerPart) * 100);

  const integerWords = integerPart === 0 ? 'Zero' : convertInteger(integerPart);
  const centsStr = decimalPart < 10 ? `0${decimalPart}` : `${decimalPart}`;

  return `${integerWords} and ${centsStr}/100 ${currency || 'USD'}`;
}
