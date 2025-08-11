export type CourseOutput = {
  id: string;
  name: string;
  coordinator: string;
  outline?: string | null;
  unitLoad: number;
  semester: number;
}; 