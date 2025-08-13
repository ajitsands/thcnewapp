import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
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
}
export const startJob = createAsyncThunk(
  'service/startJob',
  async (params: startJob, {rejectWithValue}) => {
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

const startJobAction = createSlice({
  name: 'startJob',
  initialState,
  reducers: {
    resetStatus: state => {
      state.startJobStatus = initialState.startJobStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(startJob.pending, (state, action) => {
        state.startJobLoading = true;
        state.startJobStatus = 'loading';
        state.startJobData = null;
      })
      .addCase(startJob.fulfilled, (state, action) => {
        console.log('action', action);
        state.startJobStatus = 'success';
        state.startJobData = action.payload;
        state.startJobError = '';
        state.startJobLoading = false;
      })
      .addCase(startJob.rejected, (state, action) => {
        state.startJobStatus = 'failed';
        state.startJobData = action.payload;
        state.startJobLoading = false;
      });
  },
});
export const {resetStatus} = startJobAction.actions;
export default startJobAction.reducer;
