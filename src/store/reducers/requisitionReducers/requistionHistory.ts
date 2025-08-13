import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../../navigators';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

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

export const getRequisitionHistory = createAsyncThunk(
  'requisition/getHistory',
  async (params: historyDetails, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getRequisitionURL, params);
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

const requisitionHistoryDetails = createSlice({
  name: 'historyDetails',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getRequisitionHistory.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getRequisitionHistory.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getRequisitionHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError} = requisitionHistoryDetails.actions;
export default requisitionHistoryDetails.reducer;
