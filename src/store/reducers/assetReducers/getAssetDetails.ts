import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
import {navigate} from '../../../navigators';
const initialState = {
  assets: null,
  assetsLoading: false,
  assetsStatus: '',
  assetsError: '',
  assetServices: '',
  assetServiceLoading: false,
  assetServiceStatus: '',
  assetServiceError: '',
  assetServicesImages: '',
  assetServiceImagesLoading: false,
  assetServiceImagesStatus: '',
  assetServiceImagesError: '',
};
interface assetDetails {
  action: string;
  asset_code: string;
  APIKEY: string;
  emp_code: string;
}

export const getAssetDetails = createAsyncThunk(
  'assets/getAssetDetails',
  async (params: assetDetails, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log(response);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

export const getAssetServiceDetails = createAsyncThunk(
  'assets/getAssetServiceDetails',
  async (params: assetDetails, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log(response);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

export const getAssetServiceImages = createAsyncThunk(
  'assets/getAssetServiceImages',
  async (params: assetDetails, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log(response);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const assetDetails = createSlice({
  name: 'assetDetails',
  initialState,
  reducers: {
    resetError: state => {
      state.assetsError = initialState.assetsError;
    },
    resetAssetServiceError: state => {
      state.assetServiceError = initialState.assetServiceError;
    },
    resetAssetServiceImagesError: state => {
      state.assetServiceImagesError = initialState.assetServiceImagesError;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getAssetDetails.pending, (state, action) => {
        state.assetsLoading = true;
        state.assetsStatus = 'loading';
        state.assetsError = '';
      })
      .addCase(getAssetDetails.fulfilled, (state, action) => {
        console.log('action', action);
        state.assetsStatus = 'success';
        state.assets = action.payload;
        state.assetsError = '';
        state.assetsLoading = false;
      })
      .addCase(getAssetDetails.rejected, (state, action) => {
        state.assetsStatus = 'failed';
        state.assetsError = action.payload;
        state.assetsLoading = false;
      })
      .addCase(getAssetServiceDetails.pending, (state, action) => {
        state.assetServiceLoading = true;
        state.assetServiceStatus = 'loading';
        state.assetServiceError = '';
      })
      .addCase(getAssetServiceDetails.fulfilled, (state, action) => {
        console.log('action', action);
        state.assetServiceStatus = 'success';
        state.assetServices = action.payload;
        state.assetServiceError = '';
        state.assetServiceLoading = false;
      })
      .addCase(getAssetServiceDetails.rejected, (state, action) => {
        state.assetServiceStatus = 'failed';
        state.assetServiceError = action.payload;
        state.assetServiceLoading = false;
      })
      .addCase(getAssetServiceImages.pending, (state, action) => {
        state.assetServiceImagesLoading = true;
        state.assetServiceImagesStatus = 'loading';
        state.assetServiceImagesError = '';
      })
      .addCase(getAssetServiceImages.fulfilled, (state, action) => {
        console.log('action', action);
        state.assetServiceImagesStatus = 'success';
        state.assetServicesImages = action.payload;
        state.assetServiceImagesError = '';
        state.assetServiceImagesLoading = false;
      })
      .addCase(getAssetServiceImages.rejected, (state, action) => {
        state.assetServiceImagesStatus = 'failed';
        state.assetServiceImagesError = action.payload;
        state.assetServiceImagesLoading = false;
      });
  },
});
export const {
  resetError,
  resetAssetServiceError,
  resetAssetServiceImagesError,
} = assetDetails.actions;
export default assetDetails.reducer;
