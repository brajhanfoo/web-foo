import { create } from "zustand";

type ProgramsAdminState = {
  search: string;
  setSearch: (v: string) => void;

  programId: string | null;
  setProgramId: (v: string | null) => void;

  editionId: string | null;
  setEditionId: (v: string | null) => void;
};

export const useProgramsAdminStore = create<ProgramsAdminState>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),

  programId: null,
  setProgramId: (programId) => set({ programId }),

  editionId: null,
  setEditionId: (editionId) => set({ editionId }),
}));
