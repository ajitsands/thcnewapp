import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
const initialState = {
  completeTicketData: null,
  completeTicketLoading: false,
  completeTicketStatus: '',
  completeTicketError: '',
};
interface completeTicket {
  action: string;
  amc_ticket: string;
  amc_ticket_ref_no: string;
  amc_tkt_id: string;
  visit_date: string;
  APIKEY: string;
  emp_code: string;
  emp_name: string;
}
export const completeTicketAction = createAsyncThunk(
  'service/completeTicket',
  async (params: completeTicket, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const completeTicket = createSlice({
  name: 'completeTicket',
  initialState,
  reducers: {
    completeTicketStatus: state => {
      state.completeTicketStatus = initialState.completeTicketStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(completeTicketAction.pending, (state, action) => {
        state.completeTicketLoading = true;
        state.completeTicketStatus = 'loading';
        state.completeTicketData = null;
      })
      .addCase(completeTicketAction.fulfilled, (state, action) => {
        console.log('action', action);
        state.completeTicketStatus = 'success';
        state.completeTicketData = action.payload;
        state.completeTicketError = '';
        state.completeTicketLoading = false;
      })
      .addCase(completeTicketAction.rejected, (state, action) => {
        state.completeTicketStatus = 'failed';
        state.completeTicketData = null;
        state.completeTicketError = action.payload;
        state.completeTicketLoading = false;
      });
  },
});
export const {completeTicketStatus} = completeTicket.actions;
export default completeTicket.reducer;
