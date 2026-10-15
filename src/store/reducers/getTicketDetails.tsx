import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {navigate} from '../../navigators';
import {getRequest, postRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

const initialState = {
  data: null,
  status: '',
  error: '',
  loading: false,
  ticketType: '',
};
interface ticketDetails {
  action: string;
  APIKEY: string;
  emp_code: string;
  visit_date: string;
  amc_ticket_ref_no: string;
  slot_number?: string | number;
  slot_id?: string | number;
}

export const getTicketDetails = createAsyncThunk(
  'tickets/getTicketDetails',
  async (params: ticketDetails | any, {rejectWithValue}) => {
    try {
      console.log('[getTicketDetails] Request params:', params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log('[getTicketDetails] Response:', response?.data);
      if (response?.data?.status == 'Failed' || response?.data?.status == 'failed') {
        throw new Error(response?.data?.api_message || 'Failed to fetch ticket details');
      } else {
        navigate('WorkDetails', {date: params.visit_date});
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const ticketDetails = createSlice({
  name: 'ticketDetails',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getTicketDetails.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getTicketDetails.fulfilled, (state, action) => {
        state.status = 'success';

        state.ticketType = action.payload.data[0].amc_ticket;
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getTicketDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.loading = false;
      });
  },
});
export const {resetError} = ticketDetails.actions;
export default ticketDetails.reducer;
