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
      // 1. First attempt standard technician/supervisor login via auth.php
      const response = await getRequest(ApiUrl.signInURL, params);
      if (response?.data?.status == 'Success') {
        thunkAPI.dispatch(setLoggedIn(true));
        thunkAPI.dispatch(setUserData(response.data));
        return response.data;
      }

      // 2. If rejected by auth.php (e.g. role check) or employee is a Janitor,
      // authenticate against dedicated Janitor API as per JANITOR MOBILE API DOCUMENTATION
      const apiMessage = String(response?.data?.api_message || '');
      const isRoleRestricted =
        apiMessage.includes('Technician') ||
        apiMessage.includes('Supervisor') ||
        apiMessage.includes('Team Leader') ||
        apiMessage.includes('Janitor') ||
        params.username.toUpperCase().startsWith('CG-THC');

      if (isRoleRestricted) {
        try {
          const janitorRes = await getRequest(ApiUrl.janitorURL, {
            action: 'janitor_login',
            emp_code: params.username,
            APIKEY: ApiUrl.janitorApiKey,
          });

          if (janitorRes?.data?.status === 'Success' && janitorRes?.data?.data) {
            const janitorData = janitorRes.data.data;
            const fullJanitorPayload = {
              status: 'Success',
              ...janitorData,
              employee_id: janitorData.employee_id,
              employee_code: janitorData.employee_code,
              employee_name: janitorData.employee_name,
              employee_type: 'Janitor',
              employee_type_name: 'Janitor',
              APIKEY: ApiUrl.janitorApiKey,
            };
            thunkAPI.dispatch(setLoggedIn(true));
            thunkAPI.dispatch(setUserData(fullJanitorPayload));
            return fullJanitorPayload;
          }
        } catch (janitorErr) {
          console.log('[userLogin] Janitor login check error:', janitorErr);
        }
      }

      console.log(response?.data?.api_message);
      return thunkAPI.rejectWithValue(response?.data?.api_message || 'Login failed');
    } catch (error: any) {
      // Fallback check against Janitor endpoint
      try {
        const janitorRes = await getRequest(ApiUrl.janitorURL, {
          action: 'janitor_login',
          emp_code: params.username,
          APIKEY: ApiUrl.janitorApiKey,
        });

        if (janitorRes?.data?.status === 'Success' && janitorRes?.data?.data) {
          const janitorData = janitorRes.data.data;
          const fullJanitorPayload = {
            status: 'Success',
            ...janitorData,
            employee_id: janitorData.employee_id,
            employee_code: janitorData.employee_code,
            employee_name: janitorData.employee_name,
            employee_type: 'Janitor',
            employee_type_name: 'Janitor',
            APIKEY: ApiUrl.janitorApiKey,
          };
          thunkAPI.dispatch(setLoggedIn(true));
          thunkAPI.dispatch(setUserData(fullJanitorPayload));
          return fullJanitorPayload;
        }
      } catch (e) {}

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
        state.data = Array.isArray(action.payload)
          ? action.payload[0]
          : (action.payload?.data && !Array.isArray(action.payload.data) ? action.payload.data : action.payload);
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
