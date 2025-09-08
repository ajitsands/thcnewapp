import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../navigators';
import { getRequest, postRequest } from '../../network/services';
import { ApiUrl } from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
};
interface contactParams {
  action: string;
  APIKEY: string;
  emp_code: string;
}

export const getCustomerCareContact = createAsyncThunk(
  'customerCare/getContact',
  async (params: contactParams, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL,params);
      if(response.data.status=='Failed'){
        console.log(response?.data?.api_message)
        throw new Error(response?.data?.api_message)
      }
       return response.data;
    } catch (error) {
    
     return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const getContact = createSlice({
  name: 'customerCaret',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getCustomerCareContact.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getCustomerCareContact.fulfilled, (state, action) => {
        console.log("action",action)
        state.status = 'success';
        state.data = action.payload
        state.error = '';
        state.loading = false;
      })
      .addCase(getCustomerCareContact.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError} = getContact.actions;
export default getContact.reducer;
