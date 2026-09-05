export type UpdateProfileInput = {
  fullName?: string;
  fullname?: string;
  firstname?: string;
  lastname?: string;
  middlename?: string | null;
  phone?: string | null;
  regNumber?: string | null;
  nin?: string | null;
  department?: string | null;
  faculty?: string | null;
  level?: number | string | null;
  semester?: string | null;
  university?: string | null;
  avatarUrl?: string | null;
  programme?: string | null;
};

export type VerifyFieldInput = {
  email?: boolean;
  phone?: boolean;
  nin?: boolean;
  regNumber?: boolean;
};

