import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../navigators';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
  activeSlots: '',
  visitDate: '',
};
interface scheduleSlots {
  action: string;
  APIKEY: string;
  emp_code: string;
  visit_date: string;
}

export const getScheduleSlots = createAsyncThunk(
  'schedules/getSlots',
  async (params: any, {rejectWithValue, getState}) => {
    try {
      const state: any = getState();
      const appState = state?.app || {};
      const loginData = state?.userLogin?.data || {};
      const profileData =
        state?.profile?.profileDetails?.data ||
        state?.profile?.profileDetails ||
        {};

      const empCode =
        params?.emp_code ||
        appState?.employeeCode ||
        loginData?.employee_code ||
        loginData?.emp_code ||
        profileData?.employee_code ||
        '';
      const apiKey =
        params?.APIKEY ||
        appState?.apiKey ||
        loginData?.APIKEY ||
        profileData?.APIKEY ||
        '';
      const empId =
        params?.emp_id ||
        appState?.employeeId ||
        loginData?.id ||
        loginData?.employee_id ||
        profileData?.id ||
        '';

      const isJanitor =
        (appState?.employeeType || loginData?.employee_type || '').toLowerCase().includes('janitor') ||
        empCode.toUpperCase().startsWith('CG-THC');

      const targetUrl = isJanitor ? ApiUrl.janitorURL : ApiUrl.getScheduleURL;
      const targetAction = isJanitor ? 'get_schedules_by_date' : 'get_date_slots';
      const effectiveApiKey = isJanitor ? (apiKey || ApiUrl.janitorApiKey) : apiKey;
      const targetDate = params?.visit_date || params?.date || '';

      const queryParams: any = {
        ...params,
        action: targetAction,
        APIKEY: effectiveApiKey,
        emp_code: empCode,
        employee_code: empCode,
        emp_id: empId,
        employee_id: empId,
        date: targetDate,
        visit_date: targetDate,
      };

      console.log('[getScheduleSlots] Request params:', queryParams, 'Target:', targetUrl);
      const response = await getRequest(targetUrl, queryParams);
      console.log('[getScheduleSlots] Response:', JSON.stringify(response?.data));
      if (response?.data?.status === 'Failed') {
        throw new Error(response?.data?.api_message || 'Failed to fetch slots');
      }
      return response.data;
    } catch (error: any) {
      console.log('[getScheduleSlots] Error:', error);
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const slots = createSlice({
  name: 'slotsList',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
    selectedSlots: (state, action) => {
      console.log(action.payload);
      state.activeSlots = action.payload.slots;
      state.visitDate = action.payload.visitDate;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getScheduleSlots.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getScheduleSlots.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getScheduleSlots.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError, selectedSlots} = slots.actions;
export default slots.reducer;
