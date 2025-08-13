import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {logout, setLoggedIn, setUserData} from './appReducer';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
};
interface LoginUser {
  // api_key:string;
  username: string;
  password: string;
  action: string;
}

export const userLogin = createAsyncThunk(
  'authentication/userLogin',
  async (params: LoginUser, thunkAPI) => {
    try {
      const response = await getRequest(ApiUrl.signInURL, params);
      if (response.data.status == 'Success') {
        thunkAPI.dispatch(setLoggedIn(true));
        thunkAPI.dispatch(setUserData(response.data));
        //  navigate('HomeScreen')
      } else {
        console.log(response.data.api_message);
        return thunkAPI.rejectWithValue(response.data.api_message);
      }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const loginSlice = createSlice({
  name: 'userLogin',
  initialState,
  reducers: {
    resetError: state => {
      state.error = '';
    },
    resetloginStatus: state => {
      state.status = '';
    },
  },
  extraReducers: builder => {
    builder
      .addCase(userLogin.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.status = 'success';
        state.data = action.payload[0];
        state.loading = false;
        state.error = '';
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.status = 'Failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {
  resetError,
  resetloginStatus,
} = loginSlice.actions;
export default loginSlice.reducer;
