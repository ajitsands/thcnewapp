import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
};
interface profile {
  action: string;
  APIKEY: string;
  emp_code: string;
}

export const getProfileDetails = createAsyncThunk(
  'profile/getProfileDetails',
  async (params: profile, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getProfileURL, params);
      console.log(response);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      } else {
      }
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const profileDetails = createSlice({
  name: 'profileDetails',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getProfileDetails.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getProfileDetails.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getProfileDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError} = profileDetails.actions;
export default profileDetails.reducer;
