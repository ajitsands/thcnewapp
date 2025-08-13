import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../../navigators';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

const initialState = {
  reqisitionData: null,
  status: '',
  error: null,
  loading: false,
  selectedCategory: '',
};
interface categoryDetails {
  action: string;
  APIKEY: string;
  emp_code: string;
}

export const getCategoryDetails = createAsyncThunk(
  'requisition/getCategories',
  async (params: categoryDetails, {rejectWithValue}) => {
    try {
      const response = await getRequest(ApiUrl.getRequisitionURL, params);
      console.log(response.data.status);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Something went wrong');
    }
  },
);

const categoryDetails = createSlice({
  name: 'categoryDetails',
  initialState,
  reducers: {
    resetCategoryError: state => {
      state.error = initialState.error;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    resetSelectedCategory: state => {
      state.selectedCategory = initialState.selectedCategory;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getCategoryDetails.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getCategoryDetails.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.reqisitionData = action.payload;
        state.error = null;
        state.loading = false;
      })
      .addCase(getCategoryDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetCategoryError, setSelectedCategory, resetSelectedCategory} =
  categoryDetails.actions;
export default categoryDetails.reducer;
