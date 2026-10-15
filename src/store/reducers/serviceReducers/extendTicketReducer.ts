import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
const initialState = {
  extendTicketData: null,
  extendTicketLoading: false,
  extendTicketStatus: '',
  extendTicketError: '',
};
interface extendTicket {
  action: string;
  amc_ticket: string;
  amc_ticket_ref_no: string;
  amc_tkt_id: string;
  visit_date: string;
  APIKEY: string;
  emp_code: string;
  emp_name: string;
}
export const extendTicketAction = createAsyncThunk(
  'service/extendTicket',
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

      const empId =
        params?.emp_id ||
        appState?.employeeId ||
        loginData?.id ||
        loginData?.emp_id ||
        profileData?.id ||
        '';

      const empName =
        params?.emp_name ||
        appState?.empName ||
        loginData?.employee_name ||
        profileData?.employee_name ||
        '';

      const apiKey =
        params?.APIKEY ||
        appState?.apiKey ||
        loginData?.APIKEY ||
        profileData?.APIKEY ||
        '';

      const queryParams: any = {
        action: 'extend_ticket',
        APIKEY: apiKey,
        emp_id: empId,
        employee_id: empId,
        emp_code: empCode,
        employee_code: empCode,
        technician_code: empCode,
        emp_name: empName,
        employee_name: empName,
        technician_name: empName,
        amc_ticket: params?.amc_ticket || '',
        ticket_type: params?.amc_ticket || '',
        amc_tkt_id: params?.amc_tkt_id || params?.ticket_id || '',
        ticket_id: params?.amc_tkt_id || params?.ticket_id || '',
        amc_ticket_ref_no: params?.amc_ticket_ref_no || params?.ticket_ref_code || '',
        ticket_ref_code: params?.amc_ticket_ref_no || params?.ticket_ref_code || '',
        visit_date: params?.visit_date || params?.date || '',
        date: params?.visit_date || params?.date || '',
        ...params,
      };

      console.log('[extendTicketAction] Outgoing params:', queryParams);

      // 1. Try GET request
      let resData: any = null;
      try {
        const getRes = await getRequest(ApiUrl.getScheduleURL, queryParams);
        resData = getRes?.data;
        console.log('[extendTicketAction] GET response:', resData);
      } catch (getErr) {
        console.log('[extendTicketAction] GET failed:', getErr);
      }

      // 2. Try POST FormData fallback if needed
      const isFailedGet =
        !resData ||
        resData === 0 ||
        resData === '0' ||
        resData?.status === 'Failed' ||
        resData?.status === 'failed' ||
        resData?.status === 'error';

      if (isFailedGet) {
        try {
          const formData = new FormData();
          Object.keys(queryParams).forEach(key => {
            if (queryParams[key] !== undefined && queryParams[key] !== null) {
              formData.append(key, String(queryParams[key]));
            }
          });
          const postRes = await postRequest(ApiUrl.getScheduleURL, formData);
          console.log('[extendTicketAction] POST response:', postRes?.data);
          if (
            postRes?.data &&
            postRes?.data?.status !== 'Failed' &&
            postRes?.data !== 0 &&
            postRes?.data !== '0'
          ) {
            resData = postRes.data;
          }
        } catch (postErr) {
          console.log('[extendTicketAction] POST fallback failed:', postErr);
        }
      }

      if (
        resData?.status === 'Failed' ||
        resData?.status === 'failed' ||
        resData?.status === 'error' ||
        resData === '0' ||
        resData === 0
      ) {
        const msg =
          resData?.api_message ||
          resData?.message ||
          'Failed to extend job on server';
        return rejectWithValue(msg);
      }

      return resData || {status: 'Success', message: 'Job extended successfully'};
    } catch (error: any) {
      console.log('[extendTicketAction] Error:', error);
      const errorMsg =
        error?.response?.data?.api_message ||
        error?.response?.data?.message ||
        error?.api_message ||
        (typeof error === 'string'
          ? error
          : typeof error?.message === 'string' && !error?.message?.includes('status code')
          ? error.message
          : 'Failed to extend job on server');
      return rejectWithValue(errorMsg);
    }
  },
);

const extendTicket = createSlice({
  name: 'extendTicket',
  initialState,
  reducers: {
    extendTicketStatus: state => {
      state.extendTicketStatus = initialState.extendTicketStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(extendTicketAction.pending, (state, action) => {
        state.extendTicketLoading = true;
        state.extendTicketStatus = 'loading';
        state.extendTicketData = null;
      })
      .addCase(extendTicketAction.fulfilled, (state, action) => {
        console.log('action', action);
        state.extendTicketStatus = 'success';
        state.extendTicketData = action.payload;
        state.extendTicketError = '';
        state.extendTicketLoading = false;
      })
      .addCase(extendTicketAction.rejected, (state, action) => {
        state.extendTicketStatus = 'failed';
        state.extendTicketData = action.payload;
        state.extendTicketLoading = false;
      });
  },
});
export const {extendTicketStatus} = extendTicket.actions;
export default extendTicket.reducer;
