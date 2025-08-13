import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../navigators';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
};
interface markPresent {
  action: string;
  APIKEY: string;
  emp_code: string;
  ticket_team_ids: string;
  amc_ticket: string;
}

export const markPresent = createAsyncThunk(
  'team/markPresent',
  async (params: markPresent, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log(response);
      if (typeof response.data === 'number') {
      } else {
        if (response.data.status == 'Failed') {
          throw new Error(response?.data?.api_message);
        }
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const markAttendance = createSlice({
  name: 'markPresent',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(markPresent.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(markPresent.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(markPresent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError} = markAttendance.actions;
export default markAttendance.reducer;
