import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
const initialState = {
  serviceImages: null,
  imagesLoading: false,
  imagesStatus: '',
  imagesError: '',
};
interface serviceImages {
  action: string;
  amc_tkt_id: string;
  amc_ticket: string;
  APIKEY: string;
  emp_code: string;
}

export const getServiceImages = createAsyncThunk(
  'service/getImages',
  async (params: serviceImages, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
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

const serviceImages = createSlice({
  name: 'serviceImages',
  initialState,
  reducers: {
    resetError: state => {
      state.imagesError = initialState.imagesError;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getServiceImages.pending, (state, action) => {
        state.imagesLoading = true;
        state.imagesStatus = 'loading';
        state.imagesError = '';
      })
      .addCase(getServiceImages.fulfilled, (state, action) => {
        console.log('action', action);
        state.imagesStatus = 'success';
        state.serviceImages = action.payload;
        state.imagesError = '';
        state.imagesLoading = false;
      })
      .addCase(getServiceImages.rejected, (state, action) => {
        state.serviceImages = null;
        state.imagesStatus = 'failed';
        state.imagesError = action.payload;
        state.imagesLoading = false;
      });
  },
});
export const {resetError} = serviceImages.actions;
export default serviceImages.reducer;
