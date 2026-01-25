export type ApplicationStatus =
  | "received"
  | "in_review"
  | "approved"
  | "rejected"
  | "enrolled";

export type ApplicationRowForAdminTable = {
  id: string;
  created_at: string;
  status: ApplicationStatus;
  applied_role: string | null;
  cv_url: string | null;

  programs: { title: string; slug: string } | null;
  editions: { edition_name: string } | null;

  applicant: {
    first_name: string | null;
    last_name: string | null;
    whatsapp_e164: string | null;
    linkedin_url: string | null;
  } | null;
};
