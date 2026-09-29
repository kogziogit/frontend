import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payslip } from '../services/hr.service';
import { Employee } from '../data/employees.mock';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

@Injectable({ providedIn: 'root' })
export class PayslipPdfService {
  async download(payslip: Payslip, employee?: Employee) {
    const document = new jsPDF();
    const left = 16;
    const right = 194;
    const width = right - left;
    const blue: [number, number, number] = [13, 65, 98];
    const lightBlue: [number, number, number] = [232, 241, 247];
    const logo = await this.loadImage('/assets/kogzio-logo.png');

    if (logo) document.addImage(logo, 'PNG', left, 12, 42, 16);
    document.setFont('helvetica', 'bold');
    document.setFontSize(18);
    document.setTextColor(...blue);
    document.setFontSize(11);
    document.text('PAYSLIP', right, 18, { align: 'right' });
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.setTextColor(80, 80, 80);
    document.text(`${MONTH_NAMES[payslip.month - 1]} ${payslip.year}`, right, 25, { align: 'right' });
    document.setDrawColor(...blue);
    document.setLineWidth(1.2);
    document.line(left, 34, right, 34);

    let y = 45;
    y = this.sectionTitle(document, 'Employee Details', y, blue);
    const details = [
      ['Employee Name', employee?.name ?? `Employee #${payslip.employeeId}`, 'Employee ID', employee?.empId ?? ''],
      ['Designation', employee?.designation ?? '', 'Department', employee?.department ?? ''],
      ['Date of Joining', this.formatDate(employee?.dateOfJoining), 'Paid Days', `${payslip.paidDays} / ${this.daysInMonth(payslip.year, payslip.month)}`],
      ['Bank Account', employee?.bankAccount ?? '', 'Payment Mode', employee?.paymentMode ?? 'Bank Transfer'],
    ];
    autoTable(document, {
      startY: y,
      margin: { left, right: 210 - right },
      tableWidth: width,
      body: details,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, textColor: [35, 35, 35] },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: lightBlue, cellWidth: 30 }, 1: { cellWidth: 59 }, 2: { fontStyle: 'bold', fillColor: lightBlue, cellWidth: 30 }, 3: { cellWidth: 59 } },
      didParseCell: (data) => { if (data.column.index === 0 || data.column.index === 2) data.cell.styles.textColor = blue; },
    });

    y = this.nextY(document) + 9;
    y = this.sectionTitle(document, 'Salary & Deductions', y, blue);
    autoTable(document, {
      startY: y,
      margin: { left, right: 210 - right },
      tableWidth: width,
      head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
      body: [
        ['Basic', this.plainMoney(payslip.basic), 'Provident Fund', this.plainMoney(payslip.providentFund)],
        ['HRA', this.plainMoney(payslip.hra), 'Professional Tax', this.plainMoney(payslip.professionalTax)],
        ['Conveyance', this.plainMoney(payslip.conveyance), 'TDS', this.plainMoney(payslip.tds)],
        ['Medical Allowance', this.plainMoney(payslip.medicalAllowance), 'LOP Deduction', this.plainMoney(payslip.lopDeduction)],
        ['Special Allowance', this.plainMoney(payslip.specialAllowance), '', ''],
        ['Other Allowance', this.plainMoney(payslip.otherAllowance), '', ''],
        ['Gross Salary', this.plainMoney(payslip.grossSalary), 'Total Deductions', this.plainMoney(payslip.totalDeductions)],
      ],
      theme: 'grid',
      headStyles: { fillColor: blue },
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 7) {
          data.cell.styles.fillColor = [232, 241, 247];
          data.cell.styles.textColor = [13, 65, 98];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    y = this.nextY(document) + 8;
    document.setFillColor(...blue);
    document.rect(left, y, width, 14, 'F');
    document.setTextColor(255, 255, 255);
    document.setFont('helvetica', 'bold');
    document.setFontSize(12);
    document.text('NET PAY', left + 5, y + 9);
    document.text(this.wholeMoney(payslip.netPay, payslip.currency), right - 5, y + 9, { align: 'right' });
    document.setTextColor(90, 90, 90);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8);
    document.text(`Amount in words: ${this.amountInWords(payslip.netPay, payslip.currency)}`, left, y + 22);
    document.text('This is a system-generated payslip.', left, y + 30);
    document.text('Authorized Payroll', right, y + 30, { align: 'right' });

    document.save(`Kogzio-Payslip-Detailed-${employee?.empId ?? payslip.employeeId}-${payslip.year}-${String(payslip.month).padStart(2, '0')}.pdf`);
  }

  private sectionTitle(document: jsPDF, title: string, y: number, color: [number, number, number]) {
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);
    document.setTextColor(...color);
    document.text(title, 16, y);
    return y + 5;
  }

  private nextY(document: jsPDF) {
    return (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
  }

  private money(value: number, currency = 'INR') {
    return `${currency || 'INR'} ${this.plainMoney(value)}`;
  }

  private plainMoney(value: number) {
    return Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private wholeMoney(value: number, currency = 'INR') {
    return `${currency || 'INR'} ${Math.round(Number(value ?? 0)).toLocaleString('en-IN')}`;
  }

  private daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  private amountInWords(value: number, currency = 'INR') {
    const amount = Math.max(0, Math.round(Number(value ?? 0) * 100));
    const whole = Math.floor(amount / 100);
    const cents = amount % 100;
    const words = whole === 0 ? 'Zero' : this.numberToWords(whole);
    const unit = currency === 'INR' ? (whole === 1 ? 'rupee' : 'rupees') : currency === 'EUR' ? 'euros' : currency === 'GBP' ? 'pounds' : currency === 'AED' ? 'dirhams' : (whole === 1 ? 'dollar' : 'dollars');
    return `${words} ${unit} and ${String(cents).padStart(2, '0')} minor units only`;
  }

  private currencySymbol(currency = 'INR') {
    return currency || 'INR';
  }

  private numberToWords(value: number): string {
    const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (value < 20) return ones[value];
    if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''}`;
    if (value < 1000) return `${ones[Math.floor(value / 100)]} hundred${value % 100 ? ` ${this.numberToWords(value % 100)}` : ''}`;
    if (value < 1000000) return `${this.numberToWords(Math.floor(value / 1000))} thousand${value % 1000 ? ` ${this.numberToWords(value % 1000)}` : ''}`;
    if (value < 1000000000) return `${this.numberToWords(Math.floor(value / 1000000))} million${value % 1000000 ? ` ${this.numberToWords(value % 1000000)}` : ''}`;
    return `${this.numberToWords(Math.floor(value / 1000000000))} billion${value % 1000000000 ? ` ${this.numberToWords(value % 1000000000)}` : ''}`;
  }

  private formatDate(value?: string | null) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB');
  }

  private async loadImage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}
