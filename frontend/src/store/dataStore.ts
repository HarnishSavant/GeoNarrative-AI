import { create } from 'zustand';
import { UploadedFile } from '@/lib/types';

interface DataState {
  osmData: Record<string, any>;
  isLoadingOSM: boolean;
  boundaryData: any | null;
  uploadedFiles: UploadedFile[];

  setOsmData: (data: Record<string, any>) => void;
  setIsLoadingOSM: (loading: boolean) => void;
  setBoundaryData: (data: any | null) => void;
  setUploadedFiles: (files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
}

export const useDataStore = create<DataState>((set) => ({
  osmData: {},
  isLoadingOSM: false,
  boundaryData: null,
  uploadedFiles: [],

  setOsmData: (data) => set({ osmData: data }),
  setIsLoadingOSM: (loading) => set({ isLoadingOSM: loading }),
  setBoundaryData: (data) => set({ boundaryData: data }),
  setUploadedFiles: (files) => set((state) => ({
    uploadedFiles: typeof files === 'function' ? files(state.uploadedFiles) : files
  })),
}));
