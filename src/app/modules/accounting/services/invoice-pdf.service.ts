import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../data/invoices.mock';
import { Customer } from '../data/customers.mock';
import { InvoiceTemplateService } from '../../../shared/ui/invoice-template-editor/invoice-template.service';

@Injectable({ providedIn: 'root' })
export class InvoicePdfService {
  constructor(private templateService: InvoiceTemplateService) {}

  async download(invoice: Invoice, customer?: Customer) {
    const template = this.templateService.getTemplate(invoice.invoiceNo);
    const logo = await this.resolveImage(template.logoDataUrl);
    const signature = await this.resolveImage(template.signatureDataUrl);
    const document = new jsPDF();
    const contentLeft = 18;
    const contentRight = 192;
    const contentWidth = contentRight - contentLeft;
    const rightText = contentRight - 4;
    const blue = this.hexColor(template.primaryColor, [18, 58, 103]);
    const red = this.hexColor(template.accentColor, [196, 55, 42]);
    const currencyCode = invoice.currency || 'USD';
    const currencySymbol = this.currencySymbol(currencyCode);
    const amountCredited = invoice.status === 'Paid' ? invoice.amountCredited ?? 0 : 0;
    const hasPartialCredit = amountCredited > 0 && amountCredited < invoice.amount;
    const pendingBalance = invoice.amount - amountCredited;
    const customerAddress = [customer?.addressLine1, customer?.addressLine2, customer?.addressLine3]
      .filter(Boolean).join('\n') || customer?.address || '';
    const companyDetails = [
      template.companyAddress,
      template.panNumber ? `PAN: ${template.panNumber}` : '',
      template.gstin ? `GSTIN: ${template.gstin}` : '',
      template.companyEmail ? `Email: ${template.companyEmail}` : '',
      template.companyWebsite ? `Web: ${template.companyWebsite}` : '',
    ].filter(Boolean).join('\n');
    const customerDetails = [
      customer?.name ?? invoice.customer,
      customerAddress,
      (customer?.pan ?? customer?.taxNumber) ? `PAN: ${customer?.pan ?? customer?.taxNumber}` : '',
      customer?.gst ? `GST: ${customer.gst}` : '',
      customer?.email ?? '',
      customer?.phone ?? '',
      template.placeOfSupply,
    ].filter(Boolean).join('\n');
    document.setFont('helvetica', 'bold');
    document.setTextColor(...blue);
    if (logo.data) {
      const logoWidth = template.logoWidth;
      const logoHeight = Math.min(25, logoWidth / logo.aspectRatio);
      document.addImage(logo.data, 'PNG', contentLeft, 12, logoWidth, logoHeight);
    }
    else { document.setFontSize(30); document.text('kogzio', contentLeft, 28); document.setTextColor(55, 55, 55); document.text('solutions', 60, 31); }
    document.setFontSize(22); document.setTextColor(...blue); document.text(template.invoiceLabel, 190, 25, { align: 'right' });
    document.setFontSize(9); document.setTextColor(70, 70, 70); document.text(`# ${invoice.invoiceNo}`, 190, 33, { align: 'right' });
    document.setFontSize(12); document.setTextColor(...blue); document.text(template.grandTotalLabel, 190, 50, { align: 'right' });
    document.setFontSize(16); document.text(`${currencySymbol}${invoice.amount.toFixed(2)}`, 190, 58, { align: 'right' });
    document.setDrawColor(...blue); document.setLineWidth(1); document.line(18, 64, 192, 64);
    document.setFontSize(9); document.setTextColor(45, 45, 45); document.text(template.companyName, contentLeft, 75);
    document.setFont('helvetica', 'normal'); document.text(companyDetails, contentLeft, 82);
    document.setFontSize(9); document.setTextColor(70, 70, 70); document.text(`Date: ${this.formatDate(invoice.dueDate)}`, 190, 42, { align: 'right' });
    document.text([template.billToLabel, customerDetails].filter(Boolean).join('\n'), 142, 75);
    document.setDrawColor(...red); document.setLineWidth(0.8); document.line(contentLeft, 113, contentRight, 113);
    const rows = invoice.items?.length
      ? invoice.items.map((item, index) => [String(index + 1), item.serviceDescription, item.hsnSac, item.qty.toString(), item.rate.toFixed(2), item.amount.toFixed(2)])
      : [['1', invoice.serviceDescription || template.serviceDescription, invoice.hsnSac || template.hsnSac, '1', invoice.amount.toFixed(2), invoice.amount.toFixed(2)]];
    autoTable(document, { startY: 120, margin: { left: contentLeft, right: 210 - contentRight }, tableWidth: contentWidth, head: [['SL', 'Service Description', 'HSN/SAC', 'Qty', `Rate (${currencySymbol})`, `Amount (${currencySymbol})`]], body: rows, theme: 'grid', headStyles: { fillColor: blue }, styles: { fontSize: 9 } });
    const tableBottom = (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140;
    const totalsY = tableBottom + 1;
    document.setFont('helvetica', 'normal'); document.setFontSize(9); document.setTextColor(55, 55, 55); document.setDrawColor(210, 210, 210); document.setLineWidth(0.2); document.rect(contentLeft, totalsY, contentWidth, 10, 'S');
    document.text('Sub Total', 165, totalsY + 6.5, { align: 'right' }); document.text(`${currencyCode} ${invoice.amount.toFixed(2)}`, rightText, totalsY + 6.5, { align: 'right' });
    const totalY = totalsY + 10;
    document.setFillColor(...blue); document.rect(contentLeft, totalY, contentWidth, 11, 'F'); document.setTextColor(255, 255, 255); document.setFontSize(11); document.setFont('helvetica', 'bold');
    document.text(template.grandTotalLabel.toUpperCase(), 165, totalY + 7, { align: 'right' }); document.text(`${currencySymbol} ${invoice.amount.toFixed(2)}`, rightText, totalY + 7, { align: 'right' });
    document.setFont('helvetica', 'normal'); document.setFontSize(8); document.setTextColor(45, 45, 45);
    let creditY = totalY + 11;
    if (hasPartialCredit) {
      creditY += 5;
      document.text('Amount Credited', 165, creditY, { align: 'right' }); document.text(`${currencySymbol} ${amountCredited.toFixed(2)}`, rightText, creditY, { align: 'right' });
      creditY += 5;
      document.text('Pending Balance', 165, creditY, { align: 'right' }); document.text(`${currencySymbol} ${pendingBalance.toFixed(2)}`, rightText, creditY, { align: 'right' });
    }
    const amountWordsY = creditY + (hasPartialCredit ? 4 : 9);
    const amountWordsLabel = 'Amount in Words:'; document.text(amountWordsLabel, contentLeft, amountWordsY); const amountWordsX = contentLeft + document.getTextWidth(amountWordsLabel) + 3;
    document.setFont('helvetica', 'italic'); document.text(`${this.amountInWords(invoice.amount)} ${this.currencyWords(currencyCode)}`, amountWordsX, amountWordsY);
    const detailY = amountWordsY + 6;
    document.setFont('helvetica', 'normal'); document.text('Export Declaration:', contentLeft, detailY);
    document.setFont('helvetica', 'italic'); document.text(template.exportDeclaration, contentLeft, detailY + 7, { maxWidth: contentWidth });
    document.setFont('helvetica', 'normal');
    document.text(`Bank Account Details\nBank Name: ${template.bankName}\nAccount Name: ${template.accountName}\nAccount No: ${template.accountNumber}\nIFSC Code: ${template.ifscCode}\nBranch: ${template.branch}\nSwift Code: ${template.swiftCode}`, contentLeft, detailY + 25);
    document.text(`For ${template.companyName}`, 135, detailY + 25);
    if (signature.data) {
      const maxWidth = 38;
      const maxHeight = 20;
      let signatureWidth = maxWidth;
      let signatureHeight = signatureWidth / signature.aspectRatio;
      if (signatureHeight > maxHeight) { signatureHeight = maxHeight; signatureWidth = signatureHeight * signature.aspectRatio; }
      const signatureX = 137 + (maxWidth - signatureWidth) / 2;
      document.addImage(signature.data, signature.format, signatureX, detailY + 32, signatureWidth, signatureHeight);
    }
    document.setDrawColor(90, 90, 90); document.setLineWidth(0.35); document.line(130, detailY + 55, 176, detailY + 55);
    document.setFont('helvetica', 'normal'); document.setFontSize(9); document.text(template.signatureLabel, 153, detailY + 62, { align: 'center' });
    document.setFont('helvetica', 'italic'); document.text('Director', 153, detailY + 69, { align: 'center' });
    document.setFont('helvetica', 'normal'); document.text('Terms & Conditions', contentLeft, detailY + 69); document.text(template.terms, contentLeft, detailY + 76);
    document.setDrawColor(...blue); document.line(contentLeft, 270, contentRight, 270); document.setFontSize(8); document.text(template.footerText, contentLeft + 47, 278); document.save(`${invoice.invoiceNo}.pdf`);
  }

  private async resolveImage(source: string): Promise<{ data: string; format: 'PNG'; aspectRatio: number }> {
    try {
      const response = await fetch(source || '/assets/kogzio-logo.png');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('Unable to load invoice image.'));
        element.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      return { data: canvas.toDataURL('image/png'), format: 'PNG', aspectRatio: canvas.width / canvas.height };
    } catch { return { data: '', format: 'PNG', aspectRatio: 2 }; }
  }

  private hexColor(value: string, fallback: [number, number, number]): [number, number, number] {
    const match = /^#?([0-9a-f]{6})$/i.exec(value ?? '');
    return match ? [parseInt(match[1].slice(0, 2), 16), parseInt(match[1].slice(2, 4), 16), parseInt(match[1].slice(4, 6), 16)] : fallback;
  }

  private currencySymbol(code: string): string {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[code] ?? `${code} `;
  }

  private currencyWords(code: string): string {
    const words: Record<string, string> = { USD: 'dollars', EUR: 'euros', GBP: 'pounds', INR: 'rupees' };
    return words[code] ?? code;
  }

  private formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private amountInWords(amount: number): string {
    const whole = Math.floor(Math.abs(amount));
    if (whole === 0) return 'Zero';
    const small = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const underThousand = (value: number): string => {
      if (value < 20) return small[value];
      if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${small[value % 10]}` : ''}`;
      return `${small[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${underThousand(value % 100)}` : ''}`;
    };
    const parts: string[] = [];
    if (whole >= 1_000_000) { parts.push(`${underThousand(Math.floor(whole / 1_000_000))} Million`); }
    const thousand = Math.floor((whole % 1_000_000) / 1000);
    if (thousand) parts.push(`${underThousand(thousand)} Thousand`);
    const remainder = whole % 1000;
    if (remainder) parts.push(underThousand(remainder));
    return parts.join(' ');
  }
}
