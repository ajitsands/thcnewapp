import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  stopJobData: null,
  stopJobLoading: false,
  stopJobStatus: '',
  stopJobError: '',
};

interface pauseJob {
  action: string;
  amc_ticket: string;
  ticket_service_id: string;
  APIKEY: string;
  emp_code: string;
  amc_tkt_id?: string;
  amc_ticket_ref_no?: string;
  visit_date?: string;
}

export const pauseJob = createAsyncThunk(
  'service/pauseJob',
  async (params: pauseJob, {rejectWithValue}) => {
    try {
      console.log('pauseJob params:', params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log('pauseJob response:', response?.data);
      if (response?.data?.status === 'Failed' || response?.data?.status === 'failed') {
        return rejectWithValue(response?.data?.api_message || 'Failed to pause service');
      }
      return response.data;
    } catch (error: any) {
      const msg =
        error?.response?.data?.api_message ||
        error?.response?.data?.message ||
        error?.api_message ||
        (typeof error === 'string' ? error : error?.message || 'Failed to pause service');
      return rejectWithValue(msg);
    }
  },
);

const pauseJobAction = createSlice({
  name: 'pauseJob',
  initialState,
  reducers: {
    resetStopStatus: state => {
      state.stopJobStatus = initialState.stopJobStatus;
      state.stopJobError = '';
    },
  },
  extraReducers: builder => {
    builder
      .addCase(pauseJob.pending, state => {
        state.stopJobLoading = true;
        state.stopJobStatus = 'loading';
        state.stopJobError = '';
        state.stopJobData = null;
      })
      .addCase(pauseJob.fulfilled, (state, action) => {
        state.stopJobStatus = 'success';
        state.stopJobData = action.payload;
        state.stopJobError = '';
        state.stopJobLoading = false;
      })
      .addCase(pauseJob.rejected, (state, action) => {
        state.stopJobStatus = 'failed';
        state.stopJobError = (action.payload as string) || 'Failed to pause service';
        state.stopJobData = null;
        state.stopJobLoading = false;
      });
  },
});

export const {resetStopStatus} = pauseJobAction.actions;
export default pauseJobAction.reducer;
