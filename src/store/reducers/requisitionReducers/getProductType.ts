import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../../navigators';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  productTypes: null,
  productTypesStatus: '',
  productTypeError: null,
  productTypeLoading: false,
  selectedProduct: '',
};
interface productTypeDetails {
  action: string;
  APIKEY: string;
  emp_code: string;
  category_id: string;
}

export const getProductTypes = createAsyncThunk(
  'requisition/getProductType',
  async (params: productTypeDetails, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getRequisitionURL, params);
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

const productTypeDetails = createSlice({
  name: 'productTypeDetails',
  initialState,
  reducers: {
    resetProductError: state => {
      state.productTypeError = initialState.productTypeError;
    },
    resetProductStatus: state => {
      state.productTypesStatus = initialState.productTypesStatus;
    },
    setSelectedProductType: (state, action) => {
      state.selectedProduct = action.payload;
    },
    resetSelectedProductType: state => {
      state.selectedProduct = initialState.selectedProduct;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getProductTypes.pending, (state, action) => {
        state.productTypeLoading = true;
        state.productTypesStatus = 'loading';
        state.productTypeError = null;
      })
      .addCase(getProductTypes.fulfilled, (state, action) => {
        console.log('action', action);
        state.productTypesStatus = 'success';
        state.productTypes = action.payload;
        state.productTypeError = null;
        state.productTypeLoading = false;
      })
      .addCase(getProductTypes.rejected, (state, action) => {
        state.productTypesStatus = 'failed';
        state.productTypeError = action.payload;
        state.productTypeLoading = false;
      });
  },
});
export const {
  resetProductError,
  setSelectedProductType,
  resetProductStatus,
  resetSelectedProductType,
} = productTypeDetails.actions;
export default productTypeDetails.reducer;
