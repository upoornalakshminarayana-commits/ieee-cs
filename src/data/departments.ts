// ============================================================
// University Study Years & Academic Departments Configuration
// Easy to modify, add, or rename departments
// ============================================================

export const YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
] as const;

export interface DepartmentOption {
  code: string;
  name: string;
}

export const DEPARTMENTS: DepartmentOption[] = [
  { code: 'AIML', name: 'AIML — Artificial Intelligence & Machine Learning' },
  { code: 'AIDS', name: 'AIDS — Artificial Intelligence & Data Science' },
  { code: 'CSE', name: 'CSE — Computer Science & Engineering' },
  { code: 'IT', name: 'IT — Information Technology' },
  { code: 'Cyber Security', name: 'Cyber Security' },
  { code: 'ECE', name: 'ECE — Electronics & Communication Engineering' },
  { code: 'EEE', name: 'EEE — Electrical & Electronics Engineering' },
  { code: 'Mechanical', name: 'Mechanical Engineering' },
  { code: 'Civil', name: 'Civil Engineering' },
  { code: 'Biotech', name: 'Biotechnology' },
  { code: 'Biomedical', name: 'Biomedical Engineering' },
  { code: 'Aerospace', name: 'Aerospace Engineering' },
  { code: 'Automobile', name: 'Automobile Engineering' },
  { code: 'Chemical', name: 'Chemical Engineering' },
  { code: 'Agriculture', name: 'Agricultural Engineering' },
  { code: 'BCA / MCA', name: 'BCA / MCA — Computer Applications' },
  { code: 'BBA / MBA', name: 'BBA / MBA — Management Studies' },
  { code: 'B.Arch', name: 'B.Arch — Architecture' },
  { code: 'Other', name: 'Other Department' },
];
