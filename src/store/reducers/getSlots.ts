import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../navigators';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
  activeSlots: '',
  visitDate: '',
};
interface scheduleSlots {
  action: string;
  APIKEY: string;
  emp_code: string;
  visit_date: string;
}

export const getScheduleSlots = createAsyncThunk(
  'schedules/getSlots',
  async (params: scheduleSlots, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
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

const slots = createSlice({
  name: 'slotsList',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
    selectedSlots: (state, action) => {
      console.log(action.payload);
      state.activeSlots = action.payload.slots;
      state.visitDate = action.payload.visitDate;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getScheduleSlots.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getScheduleSlots.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getScheduleSlots.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError, selectedSlots} = slots.actions;
export default slots.reducer;
