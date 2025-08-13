import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
import {removeRequisitionSerialNumber} from '../requisitionReducers/sharedAction';
const initialState = {
  additemDetails: null,
  additemStatus: '',
  additemError: '',
  additemLoading: false,
  requisitionSerialNos: [],
};
interface addItemDetails {
  action: string;
  APIKEY: string;
  emp_code: string;
  product_type_id: string;
  asset_code: string;
  customer_name: string;
  building_name: string;
  location_name: string;
  building_id: string;
  customer_id: string;
  location_id: string;
  amc_ticket: string;
  requisition_serial_no: string;
  product_category_name: string;
  product_category_id: string;
  product_type_name: string;
  product_item_name: string;
  product_item_id: string;
  product_quantity: string;
  amc_tkt_ref: string;
}

export const addItemDetails = createAsyncThunk(
  'requisition/addItemDetails',
  async (params: addItemDetails, thunkAPI: any) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getRequisitionURL, params);
      console.log(response);
      if (response?.data?.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      } else if (response.data?.data?.length !== 0) {
        let requisitionSerialNumber = response.data.data[0];
        requisitionSerialNumber.productItemId = params.product_item_id;
        const updatedData = requisitionSerialNumber;
        thunkAPI.dispatch(updateRequisitionDetails(updatedData));
      }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const addRequisitionItemDetails = createSlice({
  name: 'addItemDetails',
  initialState,
  reducers: {
    resetAddItemError: state => {
      state.additemError = initialState.additemError;
    },
    resetAddItemStatus: state => {
      state.additemStatus = initialState.additemStatus;
    },
    updateRequisitionDetails: (state, action) => {
      state.requisitionSerialNos.push(action.payload);
    },
    resetRequisitionSerialNos: state => {
      state.requisitionSerialNos = initialState.requisitionSerialNos;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(addItemDetails.pending, (state, action) => {
        state.additemLoading = true;
        state.additemStatus = 'loading';
        state.additemError = '';
      })
      .addCase(addItemDetails.fulfilled, (state, action) => {
        state.additemStatus = 'success';
        state.additemDetails = action.payload;
        state.additemError = '';
        state.additemLoading = false;
      })
      .addCase(addItemDetails.rejected, (state, action) => {
        state.additemStatus = 'failed';
        state.additemError = action.payload;
        state.additemLoading = false;
      })
      .addCase(removeRequisitionSerialNumber, (state, action) => {
        const serialNo = action.payload.requisition_serial_no;
        const id = action.payload.product_item_id;
        console.log(serialNo, id);
        state.requisitionSerialNos = state.requisitionSerialNos.filter(
          item =>
            !(
              item.requisition_serial_no === serialNo &&
              item.productItemId === id
            ),
        );
      });
  },
});
export const {
  resetAddItemError,
  updateRequisitionDetails,
  resetAddItemStatus,
  resetRequisitionSerialNos,
} = addRequisitionItemDetails.actions;
export default addRequisitionItemDetails.reducer;
