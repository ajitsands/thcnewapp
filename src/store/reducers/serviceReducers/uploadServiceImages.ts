import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  serviceUploadImages: null,
  imagesUploadLoading: false,
  imagesUploadStatus: '',
  imagesUploadError: '',
};
interface serviceImages {
  action: string;
  amc_tkt_id: string;
  amc_ticket: string;
  amc_ticket_ref_no: string;
  service_image: any;
  APIKEY: string;
  emp_code: string;
  asset_code: string;
}

export const uploadServiceImages = createAsyncThunk(
  'service/uploadImages',
  async (params: serviceImages, {rejectWithValue}) => {
    try {
      const formData = new FormData();
      const fileUri = params.service_image;
      const fileName = fileUri?.split('/').pop();
      const fileType = fileName?.split('.').pop();
      formData.append('action', params.action);
      formData.append('amc_tkt_id', params.amc_tkt_id);
      formData.append('amc_ticket', params.amc_ticket);
      formData.append('amc_ticket_ref_no', params.amc_ticket_ref_no);
      formData.append('APIKEY', params.APIKEY);
      formData.append('emp_code', params.emp_code);
      formData.append('asset_code', params.asset_code);
      formData.append('service_image', {
        uri: fileUri,
        name: fileName,
        type: `image/${fileType}`,
      });

      const response = await postRequest(ApiUrl.getScheduleURL, formData);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue('Something went wrong');
    }
  },
);

const serviceImagesUpload = createSlice({
  name: 'serviceImages',
  initialState,
  reducers: {
    resetError: state => {
      state.imagesUploadError = initialState.imagesUploadError;
    },
    resetStatusMessage: state => {
      state.imagesUploadStatus = initialState.imagesUploadStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(uploadServiceImages.pending, (state, action) => {
        state.imagesUploadLoading = true;
        state.imagesUploadStatus = 'loading';
        state.imagesUploadError = '';
      })
      .addCase(uploadServiceImages.fulfilled, (state, action) => {
        console.log('action', action);
        state.imagesUploadStatus = 'success';
        state.serviceUploadImages = action.payload;
        state.imagesUploadError = '';
        state.imagesUploadLoading = false;
      })
      .addCase(uploadServiceImages.rejected, (state, action) => {
        state.imagesUploadStatus = 'failed';
        state.imagesUploadError = action.payload;
        state.imagesUploadLoading = false;
      });
  },
});
export const {resetError, resetStatusMessage} = serviceImagesUpload.actions;
export default serviceImagesUpload.reducer;
