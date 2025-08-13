import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {CommonPost, getRequest, postRequest} from '../../../network/services';
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
}
export const restartJob = createAsyncThunk(
  'service/restartJob',
  async (params: restartJob, {rejectWithValue}) => {
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

const restartJobAction = createSlice({
  name: 'restartJob',
  initialState,
  reducers: {
    resetRestartStatus: state => {
      state.restartJobStatus = initialState.restartJobStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restartJob.pending, (state, action) => {
        state.restartJobLoading = true;
        state.restartJobStatus = 'loading';
        state.restartJobData = null;
      })
      .addCase(restartJob.fulfilled, (state, action) => {
        console.log('action', action);
        state.restartJobStatus = 'success';
        state.restartJobData = action.payload;
        state.restartJobError = '';
        state.restartJobLoading = false;
      })
      .addCase(restartJob.rejected, (state, action) => {
        state.restartJobStatus = 'failed';
        state.restartJobData = action.payload;
        state.restartJobLoading = false;
      });
  },
});
export const {resetRestartStatus} = restartJobAction.actions;
export default restartJobAction.reducer;
