export type UpdateProfileInput = {
  fullName?: string;
  phone?: string;
  department?: string;
  faculty?: string;
  level?: number;
  semester?: string;
};

export type VerifyFieldInput = {
  email?: boolean;
  phone?: boolean;
  nin?: boolean;
  regNumber?: boolean;
};
