import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {CommonPost, getRequest, postRequest} from '../../../network/services';
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
}
export const pauseJob = createAsyncThunk(
  'service/pauseJob',
  async (params: pauseJob, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      if (typeof response.data === 'number') {
      }
      console.log(response);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      } else {
        // navigate('TeamDetails',{visitDate:params.visit_date})
        if (response.data?.length == 0) {
          throw new Error('No Data Found');
        }
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const pauseJobAction = createSlice({
  name: 'pauseJob',
  initialState,
  reducers: {
    resetStopStatus: state => {
      state.stopJobStatus = initialState.stopJobStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(pauseJob.pending, (state, action) => {
        state.stopJobLoading = true;
        state.stopJobStatus = 'loading';
        state.stopJobData = null;
      })
      .addCase(pauseJob.fulfilled, (state, action) => {
        console.log('action', action);
        state.stopJobStatus = 'success';
        state.stopJobData = action.payload;
        state.stopJobError = '';
        state.stopJobLoading = false;
      })
      .addCase(pauseJob.rejected, (state, action) => {
        state.stopJobStatus = 'failed';
        state.stopJobData = action.payload;
        state.stopJobLoading = false;
      });
  },
});
export const {resetStopStatus} = pauseJobAction.actions;
export default pauseJobAction.reducer;
