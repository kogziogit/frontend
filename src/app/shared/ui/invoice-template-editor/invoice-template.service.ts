import { Injectable } from '@angular/core';

export interface InvoiceTemplate {
  logoDataUrl: string;
  signatureDataUrl: string;
  primaryColor: string;
  accentColor: string;
  logoWidth: number;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyWebsite: string;
  panNumber: string;
  gstin: string;
  invoiceDateLabel: string;
  placeOfSupply: string;
  hsnSac: string;
  exportDeclaration: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  swiftCode: string;
  invoiceLabel: string;
  grandTotalLabel: string;
  billToLabel: string;
  serviceDescription: string;
  quantityLabel: string;
  rateLabel: string;
  amountLabel: string;
  bankDetails: string;
  terms: string;
  signatureLabel: string;
  footerText: string;
}

const DEFAULT_TEMPLATE: InvoiceTemplate = {
  logoDataUrl: '/assets/kogzio-logo.png',
  signatureDataUrl: '/assets/authorized-signature.png',
  primaryColor: '#123a67',
  accentColor: '#c4372a',
  logoWidth: 55,
  companyName: 'KOGZIO SOLUTIONS LLP.',
  companyAddress: 'Door no: 2211, Phase 2,\n2nd Floor, HiLite Business Park,\nPooyangal, Pantheeramkavu, Kozhikode,\nKerala 673014, India',
  companyEmail: 'info@kogzio.com',
  companyWebsite: 'www.kogzio.com',
  panNumber: 'ABFFK3340R',
  gstin: '32ABFFK3340R1Z4',
  invoiceDateLabel: 'Date: 30 July 2026',
  placeOfSupply: 'Place of supply: Outside India',
  hsnSac: '998313',
  exportDeclaration: 'SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX',
  bankName: 'Axis Bank',
  accountName: 'Kogzio Solutions LLP',
  accountNumber: '925020058220203',
  ifscCode: 'UTIB0000136',
  branch: 'Calicut',
  swiftCode: 'AXISINBB136',
  invoiceLabel: 'INVOICE',
  grandTotalLabel: 'Grand Total',
  billToLabel: 'Bill To:',
  serviceDescription: 'Professional services',
  quantityLabel: 'Qty',
  rateLabel: 'Rate ($)',
  amountLabel: 'Amount ($)',
  bankDetails: 'Bank Account Details\nBank Name: Axis Bank\nAccount Name: Kogzio Solutions LLP\nAccount No: 925020058220203',
  terms: 'Payment is due within 10 days of invoice date.',
  signatureLabel: 'Authorized Signatory',
  footerText: 'Thank you for your business!  |  www.kogzio.com  |  info@kogzio.com',
};

@Injectable({ providedIn: 'root' })
export class InvoiceTemplateService {
  private readonly storageKey = 'kogzio-invoice-template';

  getTemplate(key = 'default'): InvoiceTemplate {
    const saved = localStorage.getItem(`${this.storageKey}:${key}`);
    const template = saved ? { ...DEFAULT_TEMPLATE, ...JSON.parse(saved) } : { ...DEFAULT_TEMPLATE };
    if (template.logoDataUrl === '/assets/kogzio-logo.svg') template.logoDataUrl = '/assets/kogzio-logo.png';
    if (template.signatureDataUrl === '/assets/authorized-signature.png.png') template.signatureDataUrl = DEFAULT_TEMPLATE.signatureDataUrl;
    if (!template.signatureDataUrl) template.signatureDataUrl = DEFAULT_TEMPLATE.signatureDataUrl;
    if (template.companyAddress === 'Door no: 2211, Phase 2,\n2nd Floor, HiLite Business Park,\nKozhikode, Kerala, India') {
      template.companyAddress = DEFAULT_TEMPLATE.companyAddress;
    }
    return template;
  }

  saveTemplate(template: InvoiceTemplate, key = 'default') {
    localStorage.setItem(`${this.storageKey}:${key}`, JSON.stringify(template));
  }

  resetTemplate(key = 'default') {
    localStorage.removeItem(`${this.storageKey}:${key}`);
    return { ...DEFAULT_TEMPLATE };
  }
}
