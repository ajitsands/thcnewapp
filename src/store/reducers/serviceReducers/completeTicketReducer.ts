import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
const initialState = {
  completeTicketData: null,
  completeTicketLoading: false,
  completeTicketStatus: '',
  completeTicketError: '',
};
interface completeTicket {
  action: string;
  amc_ticket: string;
  amc_ticket_ref_no: string;
  amc_tkt_id: string;
  visit_date: string;
  APIKEY: string;
  emp_code: string;
  emp_name: string;
  emp_id?: string;
}
export const completeTicketAction = createAsyncThunk(
  'service/completeTicket',
  async (params: completeTicket, {rejectWithValue}) => {
    try {
      console.log('========================================');
      console.log('[COMPLETE TICKET ACTION] Initiating API Call');
      console.log('Params Received:', JSON.stringify(params, null, 2));

      const requestParams: any = {
        action: 'complete_ticket',
        APIKEY: params.APIKEY,
        emp_id: params.emp_id || '',
        employee_id: params.emp_id || '',
        emp_code: params.emp_code,
        employee_code: params.emp_code,
        technician_code: params.emp_code,
        emp_name: params.emp_name || '',
        employee_name: params.emp_name || '',
        technician_name: params.emp_name || '',
        amc_ticket: params.amc_ticket,
        amc_tkt_id: params.amc_tkt_id,
        ticket_id: params.amc_tkt_id,
        amc_ticket_ref_no: params.amc_ticket_ref_no,
        ticket_ref_code: params.amc_ticket_ref_no,
        visit_date: params.visit_date,
        date: params.visit_date,
      };

      console.log('[COMPLETE TICKET ACTION] Outgoing Request Query/Body:');
      console.log(JSON.stringify(requestParams, null, 2));
      console.log('========================================');

      let response: any;
      try {
        response = await getRequest(ApiUrl.getScheduleURL, requestParams);
      } catch (getErr) {
        console.warn('[COMPLETE TICKET ACTION] GET failed, trying POST FormData:', getErr);
        const formData = new FormData();
        Object.keys(requestParams).forEach(key => {
          formData.append(key, requestParams[key] ?? '');
        });
        response = await postRequest(ApiUrl.getScheduleURL, formData);
      }

      console.log('completeTicketAction response:', response?.status, response?.data);

      const resData = response?.data;

      if (resData?.status === 'Failed' || resData?.status === 'failed') {
        return rejectWithValue(resData?.api_message || 'Failed to complete job on server');
      }

      if (
        resData === 1 ||
        resData === '1' ||
        resData?.status === 'Success' ||
        resData?.status === 'success' ||
        (typeof resData === 'string' && resData.toLowerCase().includes('success')) ||
        (response?.status >= 200 && response?.status < 300)
      ) {
        return typeof resData === 'object' && resData !== null
          ? resData
          : {status: 'Success', raw: resData};
      }

      return resData || {status: 'Success'};
    } catch (error: any) {
      console.warn('completeTicketAction error:', error);
      const serverMsg =
        error?.response?.data?.api_message ||
        error?.response?.data?.message ||
        error?.api_message;

      if (serverMsg) {
        return rejectWithValue(serverMsg);
      }

      return rejectWithValue(
        typeof error === 'string'
          ? error
          : error?.message || 'Failed to complete job on server',
      );
    }
  },
);

const completeTicket = createSlice({
  name: 'completeTicket',
  initialState,
  reducers: {
    completeTicketStatus: state => {
      state.completeTicketStatus = initialState.completeTicketStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(completeTicketAction.pending, (state, action) => {
        state.completeTicketLoading = true;
        state.completeTicketStatus = 'loading';
        state.completeTicketData = null;
      })
      .addCase(completeTicketAction.fulfilled, (state, action) => {
        console.log('action', action);
        state.completeTicketStatus = 'success';
        state.completeTicketData = action.payload;
        state.completeTicketError = '';
        state.completeTicketLoading = false;
      })
      .addCase(completeTicketAction.rejected, (state, action) => {
        state.completeTicketStatus = 'failed';
        state.completeTicketData = null;
        state.completeTicketError = action.payload;
        state.completeTicketLoading = false;
      });
  },
});
export const {completeTicketStatus} = completeTicket.actions;
export default completeTicket.reducer;
