import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../navigators';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
};
interface historyDetails {
  action: string;
  APIKEY: string;
  emp_code: string;
}

export const getWorkHistory = createAsyncThunk(
  'work/getHistory',
  async (params: any, {rejectWithValue, getState}) => {
    try {
      console.log(params);
      const state: any = getState();
      const isJanitor =
        (state?.app?.employeeType || '').toLowerCase().includes('janitor') ||
        String(params?.emp_code || state?.app?.employeeCode || '').toUpperCase().startsWith('CG-THC');

      const targetUrl = isJanitor ? ApiUrl.janitorURL : ApiUrl.getRequisitionURL;
      const targetParams = isJanitor
        ? {
            action: 'get_execution_history',
            APIKEY: params?.APIKEY || state?.app?.apiKey || ApiUrl.janitorApiKey,
            emp_code: params?.emp_code || state?.app?.employeeCode,
          }
        : params;

      const response = await getRequest(targetUrl, targetParams);
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
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const historyDetails = createSlice({
  name: 'historyDetails',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getWorkHistory.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getWorkHistory.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getWorkHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError} = historyDetails.actions;
export default historyDetails.reducer;
