import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarExpanded: boolean;
  theme: 'light' | 'dark';
  currentLocale: string;
}

const initialState: UiState = {
  sidebarExpanded: true,
  theme: 'light',
  currentLocale: 'en',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    setSidebarExpanded(state, action: PayloadAction<boolean>) {
      state.sidebarExpanded = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    setLocale(state, action: PayloadAction<string>) {
      state.currentLocale = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarExpanded, toggleTheme, setTheme, setLocale } = uiSlice.actions;
export default uiSlice.reducer;
