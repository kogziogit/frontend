import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Activity } from './crm.service';
import { Lead } from '../data/leads.mock';

@Injectable({ providedIn: 'root' })
export class CrmExportService {
  exportLeadsExcel(rows: Lead[]) {
    const data = rows.map((lead) => ({
      Lead: lead.name,
      Company: lead.company,
      Email: lead.email,
      Phone: lead.phone,
      'Role / Job Title': lead.jobTitle,
      Source: lead.source,
      'Expected Revenue': lead.expectedRevenue,
      Status: lead.status,
      City: lead.city,
      Country: lead.country,
      Notes: lead.notes,
    }));
    this.downloadExcel(data, 'crm-leads');
  }

  exportLeadsPdf(rows: Lead[]) {
    const document = new jsPDF({ orientation: 'landscape' });
    document.setFontSize(16);
    document.text('CRM Leads', 14, 16);
    autoTable(document, {
      startY: 24,
      head: [['Lead', 'Company', 'Email', 'Phone', 'Source', 'Revenue', 'Status']],
      body: rows.map((lead) => [lead.name, lead.company, lead.email, lead.phone, lead.source, String(lead.expectedRevenue), lead.status]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [70, 79, 235] },
    });
    document.save('crm-leads.pdf');
  }

  exportActivitiesExcel(rows: Array<Activity & { leadName: string; company: string }>) {
    const data = rows.map((activity) => ({
      Lead: activity.leadName,
      Company: activity.company,
      Type: activity.type,
      Subject: activity.subject,
      Notes: activity.notes,
      'Due Date': activity.dueDate,
      Status: activity.status,
    }));
    this.downloadExcel(data, 'crm-follow-ups');
  }

  exportActivitiesPdf(rows: Array<Activity & { leadName: string; company: string }>) {
    const document = new jsPDF({ orientation: 'landscape' });
    document.setFontSize(16);
    document.text('CRM Follow-ups', 14, 16);
    autoTable(document, {
      startY: 24,
      head: [['Lead', 'Company', 'Type', 'Subject', 'Due Date', 'Status']],
      body: rows.map((activity) => [activity.leadName, activity.company, activity.type, activity.subject, activity.dueDate, activity.status]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [70, 79, 235] },
    });
    document.save('crm-follow-ups.pdf');
  }

  private downloadExcel(rows: Record<string, unknown>[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}
