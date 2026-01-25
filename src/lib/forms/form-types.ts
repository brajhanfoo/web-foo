export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "date"
  | "checkbox";

export type FormFieldBase = {
  id: string; // uuid-ish o nanoid
  label: string;
  type: FormFieldType;
  required?: boolean;
  helperText?: string | null;
};

export type SelectOption = { value: string; label: string };

export type FormField =
  | (FormFieldBase & { type: "text" | "textarea"; placeholder?: string | null })
  | (FormFieldBase & { type: "number"; min?: number | null; max?: number | null })
  | (FormFieldBase & { type: "date" })
  | (FormFieldBase & { type: "checkbox" })
  | (FormFieldBase & {
      type: "select" | "multiselect";
      options: SelectOption[];
    });

export type ApplicationFormSchema = {
  version: "v1";
  title?: string | null;
  description?: string | null;
  fields: FormField[];
};
