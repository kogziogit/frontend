import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  attendanceDate: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: 'Present' | 'Absent' | 'Half Day' | 'Work From Home' | 'On Leave';
  notes?: string;
  approvalStatus: 'Submitted' | 'Approved' | 'Rejected';
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAtUtc?: string | null;
  workHours?: number;
}

export interface Department { id: number; name: string; code?: string; managerName?: string; description?: string; }
export interface Designation { id: number; title: string; department?: string; level: string; }
export interface Holiday { id: number; name: string; holidayDate: string; type: 'Mandatory' | 'Optional'; description?: string; }

export interface PerformanceReview {
  id: number;
  employeeId: number;
  reviewPeriod: string;
  reviewDate: string;
  rating: number;
  strengths?: string;
  areasForImprovement?: string;
  managerComments?: string;
  reviewerName: string;
  status: 'Draft' | 'Completed';
}

export interface JobOpening {
  id: number;
  title: string;
  department: string;
  description?: string;
  positionsCount: number;
  openedDate: string;
  status: 'Open' | 'On Hold' | 'Closed';
}

export interface Candidate {
  id: number;
  jobOpeningId: number;
  name: string;
  email: string;
  phone?: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  notes?: string;
  appliedDate: string;
}

@Injectable({ providedIn: 'root' })
export class HrmsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/hr`;

  getAttendance() { return this.http.get<AttendanceRecord[]>(`${this.base}/attendance`); }
  createAttendance(item: Partial<AttendanceRecord>) { return this.http.post<AttendanceRecord>(`${this.base}/attendance`, item); }
  updateAttendance(id: number, item: AttendanceRecord) { return this.http.put<void>(`${this.base}/attendance/${id}`, item); }
  deleteAttendance(id: number) { return this.http.delete<void>(`${this.base}/attendance/${id}`); }
  approveAttendance(id: number) { return this.http.post<void>(`${this.base}/attendance/${id}/approve`, {}); }
  rejectAttendance(id: number, reason: string) { return this.http.post<void>(`${this.base}/attendance/${id}/reject`, { reason }); }

  getDepartments() { return this.http.get<Department[]>(`${this.base}/departments`); }
  createDepartment(item: Partial<Department>) { return this.http.post<Department>(`${this.base}/departments`, item); }
  updateDepartment(id: number, item: Department) { return this.http.put<void>(`${this.base}/departments/${id}`, item); }
  deleteDepartment(id: number) { return this.http.delete<void>(`${this.base}/departments/${id}`); }

  getDesignations() { return this.http.get<Designation[]>(`${this.base}/designations`); }
  createDesignation(item: Partial<Designation>) { return this.http.post<Designation>(`${this.base}/designations`, item); }
  updateDesignation(id: number, item: Designation) { return this.http.put<void>(`${this.base}/designations/${id}`, item); }
  deleteDesignation(id: number) { return this.http.delete<void>(`${this.base}/designations/${id}`); }

  getHolidays() { return this.http.get<Holiday[]>(`${this.base}/holidays`); }
  createHoliday(item: Partial<Holiday>) { return this.http.post<Holiday>(`${this.base}/holidays`, item); }
  updateHoliday(id: number, item: Holiday) { return this.http.put<void>(`${this.base}/holidays/${id}`, item); }
  deleteHoliday(id: number) { return this.http.delete<void>(`${this.base}/holidays/${id}`); }

  getPerformanceReviews() { return this.http.get<PerformanceReview[]>(`${this.base}/performancereviews`); }
  createPerformanceReview(item: Partial<PerformanceReview>) { return this.http.post<PerformanceReview>(`${this.base}/performancereviews`, item); }
  updatePerformanceReview(id: number, item: PerformanceReview) { return this.http.put<void>(`${this.base}/performancereviews/${id}`, item); }
  deletePerformanceReview(id: number) { return this.http.delete<void>(`${this.base}/performancereviews/${id}`); }

  getJobOpenings() { return this.http.get<JobOpening[]>(`${this.base}/jobopenings`); }
  createJobOpening(item: Partial<JobOpening>) { return this.http.post<JobOpening>(`${this.base}/jobopenings`, item); }
  updateJobOpening(id: number, item: JobOpening) { return this.http.put<void>(`${this.base}/jobopenings/${id}`, item); }
  deleteJobOpening(id: number) { return this.http.delete<void>(`${this.base}/jobopenings/${id}`); }

  getCandidates() { return this.http.get<Candidate[]>(`${this.base}/candidates`); }
  createCandidate(item: Partial<Candidate>) { return this.http.post<Candidate>(`${this.base}/candidates`, item); }
  updateCandidate(id: number, item: Candidate) { return this.http.put<void>(`${this.base}/candidates/${id}`, item); }
  deleteCandidate(id: number) { return this.http.delete<void>(`${this.base}/candidates/${id}`); }
}
