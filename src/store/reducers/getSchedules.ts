import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../navigators';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
};
interface scheduleDates {
  action: string;
  APIKEY: string;
  emp_code: string;
}

export const getScheduleDates = createAsyncThunk(
  'schedules/getScheduleDates',
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
        loginData?.emp_id ||
        profileData?.id ||
        '';

      const queryParams: any = {
        action: 'get_schedule_dates',
        APIKEY: apiKey,
        emp_code: empCode,
        employee_code: empCode,
        emp_id: empId,
        employee_id: empId,
        ...params,
      };

      const isJanitor =
        (appState?.employeeType || loginData?.employee_type || '').toLowerCase().includes('janitor') ||
        empCode.toUpperCase().startsWith('CG-THC');
      const targetScheduleUrl = isJanitor ? ApiUrl.janitorURL : ApiUrl.getScheduleURL;
      if (isJanitor && !queryParams.APIKEY) {
        queryParams.APIKEY = ApiUrl.janitorApiKey;
      }

      console.log('[getScheduleDates] Request params:', queryParams, 'Target:', targetScheduleUrl);

      let response: any = null;
      try {
        response = await getRequest(targetScheduleUrl, queryParams);
        console.log('[getScheduleDates] GET Response:', JSON.stringify(response?.data));
      } catch (getErr) {
        console.log('[getScheduleDates] GET failed:', getErr);
      }

      if (
        !response?.data ||
        response?.data?.status === 'Failed' ||
        response?.data?.status === 'error'
      ) {
        try {
          const formData = new FormData();
          Object.keys(queryParams).forEach(key => {
            if (queryParams[key] !== undefined && queryParams[key] !== null) {
              formData.append(key, String(queryParams[key]));
            }
          });
          const postRes = await postRequest(targetScheduleUrl, formData);
          console.log('[getScheduleDates] POST Response:', JSON.stringify(postRes?.data));
          if (
            postRes?.data &&
            postRes?.data?.status !== 'Failed' &&
            postRes?.data?.status !== 'error'
          ) {
            response = postRes;
          }
        } catch (postErr) {
          console.log('[getScheduleDates] POST fallback failed:', postErr);
        }
      }

      if (response?.data?.status === 'Failed') {
        console.log('[getScheduleDates] Failed message:', response?.data?.api_message);
        throw new Error(response?.data?.api_message || 'Failed to fetch schedule dates');
      }
      return response?.data;
    } catch (error: any) {
      console.log('[getScheduleDates] Error:', error);
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const schedules = createSlice({
  name: 'scheduleList',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getScheduleDates.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getScheduleDates.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getScheduleDates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.data = null;
        state.loading = false;
      });
  },
});
export const {resetError} = schedules.actions;
export default schedules.reducer;
