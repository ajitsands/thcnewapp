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
  amc_tkt_id?: string;
  amc_ticket_ref_no?: string;
  visit_date?: string;
}
export const completeJob = createAsyncThunk(
  'service/completeJob',
  async (params: completeJob, {rejectWithValue}) => {
    try {
      const formData = new FormData();
      const fileUri = params.tech_audio;
      formData.append('action', params.action);
      formData.append('ticket_service_id', params.ticket_service_id);
      formData.append('amc_ticket', params.amc_ticket);
      formData.append('APIKEY', params.APIKEY);
      formData.append('emp_code', params.emp_code);
      formData.append('tech_remarks', params.tech_remarks || '');
      if (params.amc_tkt_id) formData.append('amc_tkt_id', params.amc_tkt_id);
      if (params.amc_ticket_ref_no) formData.append('amc_ticket_ref_no', params.amc_ticket_ref_no);
      if (params.visit_date) formData.append('visit_date', params.visit_date);

      const isLocalFile =
        fileUri &&
        typeof fileUri === 'string' &&
        (fileUri.startsWith('/') ||
          fileUri.startsWith('file://') ||
          fileUri.startsWith('content://'));

      if (isLocalFile) {
        const fileName = fileUri.split('/').pop() || 'recorded_audio.mp4';
        const fileExt = fileName.split('.').pop()?.toLowerCase();
        const mimeType =
          fileExt === 'mp4'
            ? 'audio/mp4'
            : fileExt === 'm4a'
            ? 'audio/m4a'
            : fileExt === 'aac'
            ? 'audio/aac'
            : fileExt === 'mp3'
            ? 'audio/mpeg'
            : 'audio/mp4';

        const uploadUri =
          Platform.OS === 'ios'
            ? fileUri.replace('file://', '')
            : fileUri.startsWith('file://')
            ? fileUri
            : `file://${fileUri}`;

        formData.append('tech_audio', {
          uri: uploadUri,
          type: mimeType,
          name: fileName,
        } as any);
      } else if (fileUri && typeof fileUri === 'string' && fileUri.trim() !== '') {
        formData.append('tech_audio', fileUri);
      } else {
        formData.append('tech_audio', '');
      }

      const response = await postRequest(ApiUrl.getScheduleURL, formData);
      console.log('completeJob response:', response?.status, response?.data);
      const resData = response?.data;

      if (resData?.status === 'Failed' || resData?.status === 'failed') {
        throw new Error(resData?.api_message || 'Failed to complete service');
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
      console.warn('completeJob error:', error);
      const msg =
        error?.response?.data?.api_message ||
        error?.response?.data?.message ||
        error?.api_message ||
        error?.message ||
        'Something went wrong';
      return rejectWithValue(msg);
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
        state.completeJobError = (action.payload as string) || 'Something went wrong';
        state.completeJobData = null;
        state.completeJobLoading = false;
      });
  },
});
export const {resetCompleteStatus} = completeJobAction.actions;
export default completeJobAction.reducer;
