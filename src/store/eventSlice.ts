import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EventStatus, EventVisibility, IEvent } from '../types';

interface EventFiltersState {
  search: string;
  category: string;
  status: EventStatus | '';
  visibility: EventVisibility | '';
  tags: string[];
  startDate: string;
  endDate: string;
}

interface EventState {
  filters: EventFiltersState;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  activeEventId: string | null;
  activeEvent: IEvent | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  filters: {
    search: '',
    category: '',
    status: '',
    visibility: '',
    tags: [],
    startDate: '',
    endDate: '',
  },
  pagination: {
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  },
  activeEventId: null,
  activeEvent: null,
  loading: false,
  error: null,
};

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.filters.search = action.payload;
      state.pagination.page = 1; // Reset to page 1 on filter changes
    },
    setCategoryFilter(state, action: PayloadAction<string>) {
      state.filters.category = action.payload;
      state.pagination.page = 1;
    },
    setStatusFilter(state, action: PayloadAction<EventStatus | ''>) {
      state.filters.status = action.payload;
      state.pagination.page = 1;
    },
    setVisibilityFilter(state, action: PayloadAction<EventVisibility | ''>) {
      state.filters.visibility = action.payload;
      state.pagination.page = 1;
    },
    toggleTagFilter(state, action: PayloadAction<string>) {
      const tag = action.payload;
      const index = state.filters.tags.indexOf(tag);
      if (index > -1) {
        state.filters.tags.splice(index, 1);
      } else {
        state.filters.tags.push(tag);
      }
      state.pagination.page = 1;
    },
    clearTagFilters(state) {
      state.filters.tags = [];
      state.pagination.page = 1;
    },
    setDateRangeFilter(state, action: PayloadAction<{ startDate: string; endDate: string }>) {
      state.filters.startDate = action.payload.startDate;
      state.filters.endDate = action.payload.endDate;
      state.pagination.page = 1;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },
    setLimit(state, action: PayloadAction<number>) {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    setPaginationData(state, action: PayloadAction<{ total: number; totalPages: number }>) {
      state.pagination.total = action.payload.total;
      state.pagination.totalPages = action.payload.totalPages;
    },
    setActiveEventId(state, action: PayloadAction<string | null>) {
      state.activeEventId = action.payload;
    },
    setActiveEvent(state, action: PayloadAction<IEvent | null>) {
      state.activeEvent = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setSearch,
  setCategoryFilter,
  setStatusFilter,
  setVisibilityFilter,
  toggleTagFilter,
  clearTagFilters,
  setDateRangeFilter,
  resetFilters,
  setPage,
  setLimit,
  setPaginationData,
  setActiveEventId,
  setActiveEvent,
  setLoading,
  setError,
} = eventSlice.actions;

export default eventSlice.reducer;
