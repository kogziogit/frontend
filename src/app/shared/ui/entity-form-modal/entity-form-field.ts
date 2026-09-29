export interface EntityFormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'time' | 'select' | 'readonly';
  tab?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Only render this field while another field currently holds the given value. */
  showWhen?: { field: string; value: unknown };
  /** For type 'readonly': derive the displayed text from the live form values. */
  compute?: (values: Record<string, unknown>) => string;
}
