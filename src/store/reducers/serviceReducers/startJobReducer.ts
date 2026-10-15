import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  startJobData: null,
  startJobLoading: false,
  startJobStatus: '',
  startJobError: '',
};

interface startJob {
  action: string;
  amc_ticket: string;
  ticket_service_id: string;
  APIKEY: string;
  emp_code: string;
  amc_tkt_id?: string;
  amc_ticket_ref_no?: string;
  visit_date?: string;
}

export const startJob = createAsyncThunk(
  'service/startJob',
  async (params: startJob, {rejectWithValue}) => {
    try {
      console.log('startJob params:', params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log('startJob response:', response?.data);
      if (response?.data?.status === 'Failed' || response?.data?.status === 'failed') {
        return rejectWithValue(response?.data?.api_message || 'Failed to start service');
      }
      return response.data;
    } catch (error: any) {
      const msg =
        error?.response?.data?.api_message ||
        error?.response?.data?.message ||
        error?.api_message ||
        (typeof error === 'string' ? error : error?.message || 'Failed to start service');
      return rejectWithValue(msg);
    }
  },
);

const startJobAction = createSlice({
  name: 'startJob',
  initialState,
  reducers: {
    resetStatus: state => {
      state.startJobStatus = initialState.startJobStatus;
      state.startJobError = '';
    },
  },
  extraReducers: builder => {
    builder
      .addCase(startJob.pending, state => {
        state.startJobLoading = true;
        state.startJobStatus = 'loading';
        state.startJobError = '';
        state.startJobData = null;
      })
      .addCase(startJob.fulfilled, (state, action) => {
        state.startJobStatus = 'success';
        state.startJobData = action.payload;
        state.startJobError = '';
        state.startJobLoading = false;
      })
      .addCase(startJob.rejected, (state, action) => {
        state.startJobStatus = 'failed';
        state.startJobError = (action.payload as string) || 'Failed to start service';
        state.startJobData = null;
        state.startJobLoading = false;
      });
  },
});

export const {resetStatus} = startJobAction.actions;
export default startJobAction.reducer;
