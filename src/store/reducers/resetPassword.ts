import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
};

interface passwordUpdate {
  action: string;
  APIKEY: string;
  old_password: string;
  new_password: string;
  emp_code: string;
}

export const updatePassword = createAsyncThunk(
  'authentication/updatePassword',
  async (params: passwordUpdate, thunkAPI) => {
    try {
      const response = await getRequest(ApiUrl.getProfileURL, params);
      console.log(response);
      if (typeof response.data === 'number') {
        return response.data;
      } else if (response.data.status == 'Failed') {
        throw new Error(response.data.api_message);
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const passwordResetSlice = createSlice({
  name: 'resetPassword',
  initialState,
  reducers: {
    resetError: state => {
      state.error = '';
    },
    resetPasswordStatus: state => {
      state.status = '';
    },
  },
  extraReducers: builder => {
    builder
      .addCase(updatePassword.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.status = 'success';
        state.data = action.payload[0];
        state.loading = false;
        state.error = '';
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.status = 'Failed';
        state.error = action.payload;
        state.data = null;
        state.loading = false;
      });
  },
});
export const {resetError, resetPasswordStatus} = passwordResetSlice.actions;
export default passwordResetSlice.reducer;
