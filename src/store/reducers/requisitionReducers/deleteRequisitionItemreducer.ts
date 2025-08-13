import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
import {removeRequisitionSerialNumber} from '../requisitionReducers/sharedAction';

const initialState = {
  deleteitemDetails: null,
  deleteitemStatus: '',
  deleteitemError: '',
  deleteitemLoading: false,
};
interface deleteItemDetails {
  action: string;
  APIKEY: string;
  emp_code: string;
  product_item_id: string;
  requisition_serial_no: string;
}

export const deleteItemDetails = createAsyncThunk(
  'requisition/deleteItemDetails',
  async (params: deleteItemDetails, thunkAPI: any) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getRequisitionURL, params);
      console.log(response);
      if (response?.data?.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      } else if (
        typeof response.data === 'number' &&
        Number.isFinite(response.data)
      ) {
        thunkAPI.dispatch(removeRequisitionSerialNumber(params));
      }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue('Something went wrong');
    }
  },
);

const deleteRequisitionItemDetails = createSlice({
  name: 'deleteItemDetails',
  initialState,
  reducers: {
    resetDeleteItemError: state => {
      state.deleteitemError = initialState.deleteitemError;
    },
    resetDeleteItemStatus: state => {
      state.deleteitemStatus = initialState.deleteitemStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(deleteItemDetails.pending, (state, action) => {
        state.deleteitemLoading = true;
        state.deleteitemStatus = 'loading';
        state.deleteitemError = '';
      })
      .addCase(deleteItemDetails.fulfilled, (state, action) => {
        state.deleteitemStatus = 'success';
        state.deleteitemDetails = action.payload;
        state.deleteitemError = '';
        state.deleteitemLoading = false;
      })
      .addCase(deleteItemDetails.rejected, (state, action) => {
        state.deleteitemStatus = 'failed';
        state.deleteitemError = action.payload;
        state.deleteitemLoading = false;
      });
  },
});
export const {resetDeleteItemError, resetDeleteItemStatus} =
  deleteRequisitionItemDetails.actions;
export default deleteRequisitionItemDetails.reducer;
