import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../../navigators';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  itemDetails: null,
  itemStatus: '',
  itemError: '',
  itemLoading: false,
};
interface itemDetails {
  action: string;
  APIKEY: string;
  emp_code: string;
  product_type_id: string;
}

export const getItemDetails = createAsyncThunk(
  'requisition/getItemDetails',
  async (params: itemDetails, {rejectWithValue}) => {
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

const itemDetails = createSlice({
  name: 'itemDetails',
  initialState,
  reducers: {
    resetItemError: state => {
      state.itemError = initialState.itemError;
    },
    resetItemStatus: state => {
      state.itemStatus = initialState.itemStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getItemDetails.pending, (state, action) => {
        state.itemLoading = true;
        state.itemStatus = 'loading';
        state.itemError = '';
      })
      .addCase(getItemDetails.fulfilled, (state, action) => {
        console.log('action', action);
        state.itemStatus = 'success';
        state.itemDetails = action.payload;
        state.itemError = '';
        state.itemLoading = false;
      })
      .addCase(getItemDetails.rejected, (state, action) => {
        state.itemStatus = 'failed';
        state.itemError = action.payload;
        state.itemLoading = false;
      });
  },
});
export const {resetItemError, resetItemStatus} = itemDetails.actions;
export default itemDetails.reducer;
