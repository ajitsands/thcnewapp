import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  restartJobData: null,
  restartJobLoading: false,
  restartJobStatus: '',
  restartJobError: '',
};

interface restartJob {
  action: string;
  amc_ticket: string;
  ticket_service_id: string;
  APIKEY: string;
  emp_code: string;
  amc_tkt_id?: string;
  amc_ticket_ref_no?: string;
  visit_date?: string;
  date?: string;
}

export const restartJob = createAsyncThunk(
  'service/restartJob',
  async (params: restartJob, {rejectWithValue}) => {
    try {
      console.log('restartJob params:', params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log('restartJob response:', response?.data);
      if (response?.data?.status === 'Failed' || response?.data?.status === 'failed') {
        return rejectWithValue(response?.data?.api_message || 'Failed to undo service');
      }
      return response.data;
    } catch (error: any) {
      const msg =
        error?.response?.data?.api_message ||
        error?.response?.data?.message ||
        error?.api_message ||
        (typeof error === 'string' ? error : error?.message || 'Failed to undo service');
      return rejectWithValue(msg);
    }
  },
);

const restartJobAction = createSlice({
  name: 'restartJob',
  initialState,
  reducers: {
    resetRestartStatus: state => {
      state.restartJobStatus = initialState.restartJobStatus;
      state.restartJobError = '';
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restartJob.pending, state => {
        state.restartJobLoading = true;
        state.restartJobStatus = 'loading';
        state.restartJobError = '';
        state.restartJobData = null;
      })
      .addCase(restartJob.fulfilled, (state, action) => {
        console.log('restartJob fulfilled:', action);
        state.restartJobStatus = 'success';
        state.restartJobData = action.payload;
        state.restartJobError = '';
        state.restartJobLoading = false;
      })
      .addCase(restartJob.rejected, (state, action) => {
        console.log('restartJob rejected:', action.payload);
        state.restartJobStatus = 'failed';
        state.restartJobError = (action.payload as string) || 'Failed to undo service';
        state.restartJobData = null;
        state.restartJobLoading = false;
      });
  },
});

export const {resetRestartStatus} = restartJobAction.actions;
export default restartJobAction.reducer;
