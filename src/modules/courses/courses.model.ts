export type CourseOutput = {
  id: string;
  name: string;
  level: string;
  coordinator: string;
  outline?: string | null;
  unitLoad: number;
  semester: number;
}; 