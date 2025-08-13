import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../../navigators';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
  serviceStatusData: null,
  serviceStatusLoading: false,
  serviceStatusError: '',
  serviceStatus: '',
  serviceSlotsData: null,
  serviceSlotsLoading: false,
  serviceSlotsStatus: '',
  serviceSlotsError: '',
};
interface serviceDetails {
  action: string;
  visit_date: string;
  amc_tkt_id: string;
  amc_ticket: string;
  APIKEY: string;
  emp_code: string;
}
interface serviceTypes {
  action: string;
  amc_tkt_id: string;
  amc_ticket: string;
  APIKEY: string;
  emp_code: string;
}
interface serviceStatus extends serviceDetails {
  ticket_service_id: string;
  amc_ticket_ref_no: string;
}

export const getServiceTypes = createAsyncThunk(
  'service/getTypes',
  async (params: serviceTypes, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log('serviceTypesResponse', response);
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

export const getServiceSlots = createAsyncThunk(
  'service/getSlots',
  async (params: serviceDetails, {rejectWithValue}) => {
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
      return rejectWithValue(error.message);
    }
  },
);

export const getServiceDetails = createAsyncThunk(
  'service/getDetails',
  async (params: serviceDetails, {rejectWithValue}) => {
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
      return rejectWithValue(error.message);
    }
  },
);

export const getServiceStatusDetails = createAsyncThunk(
  'service/getServiceStatusDetails',
  async (params: serviceStatus, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log('uphjabcajkdhcjkadhcjkadklcvjadlkjvc', response);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      } else {
        // navigate('TeamDetails',{visitDate:params.visit_date})
        if (response.data?.length == 0) {
          throw new Error('No Data Found');
        } else {
        }
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const serviceDetails = createSlice({
  name: 'serviceDetails',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getServiceDetails.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getServiceDetails.fulfilled, (state, action) => {
        console.log('action  +++++++++=   service details', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getServiceDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(getServiceTypes.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getServiceTypes.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getServiceTypes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(getServiceSlots.pending, (state, action) => {
        state.serviceSlotsLoading = true;
        state.serviceSlotsStatus = 'loading';
        state.serviceSlotsError = '';
      })
      .addCase(getServiceSlots.fulfilled, (state, action) => {
        console.log('action', action);
        state.serviceSlotsStatus = 'success';
        state.serviceSlotsData = action.payload;
        state.serviceSlotsError = '';
        state.serviceSlotsLoading = false;
      })
      .addCase(getServiceSlots.rejected, (state, action) => {
        state.serviceSlotsStatus = 'failed';
        state.serviceSlotsData = action.payload;
        state.serviceSlotsLoading = false;
      })
      .addCase(getServiceStatusDetails.pending, (state, action) => {
        state.serviceStatusLoading = true;
        state.serviceStatus = 'loading';
        state.serviceStatusError = '';
      })
      .addCase(getServiceStatusDetails.fulfilled, (state, action) => {
        console.log('action', action);
        state.serviceStatus = 'success';
        state.serviceStatusData = action.payload;
        state.serviceStatusError = '';
        state.serviceStatusLoading = false;
      })
      .addCase(getServiceStatusDetails.rejected, (state, action) => {
        state.serviceStatus = 'failed';
        state.serviceStatusError = action.payload;
        state.serviceStatusLoading = false;
      });
  },
});
export const {resetError} = serviceDetails.actions;
export default serviceDetails.reducer;
