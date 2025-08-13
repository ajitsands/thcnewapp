import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
import {Platform} from 'react-native';
const initialState = {
  completeJobData: null,
  completeJobLoading: false,
  completeJobStatus: '',
  completeJobError: '',
};
interface completeJob {
  action: string;
  amc_ticket: string;
  ticket_service_id: string;
  APIKEY: string;
  emp_code: string;
  tech_remarks: string;
  tech_audio: string;
}
export const completeJob = createAsyncThunk(
  'service/completeJob',
  async (params: completeJob, {rejectWithValue}) => {
    try {
      const formData = new FormData();
      const fileUri = params.tech_audio;
      const fileName = fileUri?.split('/').pop();
      const fileType = fileName?.split('.').pop();
      formData.append('action', params.action);
      formData.append('ticket_service_id', params.ticket_service_id);
      formData.append('amc_ticket', params.amc_ticket);
      formData.append('APIKEY', params.APIKEY);
      formData.append('emp_code', params.emp_code);
      formData.append('tech_remarks', params.tech_remarks);
      if (params?.tech_audio) {
        formData.append('tech_audio', {
          uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
          type: fileType === 'mp4' ? 'audio/mp4' : 'audio/mpeg',
          name: fileName,
        });
      } else {
        formData.append('tech_audio', params.tech_audio);
      }

      const response = await postRequest(ApiUrl.getScheduleURL, formData);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Something went wrong');
    }
  },
);

const completeJobAction = createSlice({
  name: 'completeJob',
  initialState,
  reducers: {
    resetCompleteStatus: state => {
      state.completeJobStatus = initialState.completeJobStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(completeJob.pending, (state, action) => {
        state.completeJobLoading = true;
        state.completeJobStatus = 'loading';
        state.completeJobData = null;
      })
      .addCase(completeJob.fulfilled, (state, action) => {
        console.log('action', action);
        state.completeJobStatus = 'success';
        state.completeJobData = action.payload;
        state.completeJobError = '';
        state.completeJobLoading = false;
      })
      .addCase(completeJob.rejected, (state, action) => {
        state.completeJobStatus = 'failed';
        state.completeJobError = action.payload;
        state.completeJobData = null;
        state.completeJobLoading = false;
      });
  },
});
export const {resetCompleteStatus} = completeJobAction.actions;
export default completeJobAction.reducer;
