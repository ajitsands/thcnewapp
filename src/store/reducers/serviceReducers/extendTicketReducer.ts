import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';
const initialState = {
  extendTicketData: null,
  extendTicketLoading: false,
  extendTicketStatus: '',
  extendTicketError: '',
};
interface extendTicket {
  action: string;
  amc_ticket: string;
  amc_ticket_ref_no: string;
  amc_tkt_id: string;
  visit_date: string;
  APIKEY: string;
  emp_code: string;
  emp_name: string;
}
export const extendTicketAction = createAsyncThunk(
  'service/extendTicket',
  async (params: extendTicket, {rejectWithValue}) => {
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

const extendTicket = createSlice({
  name: 'extendTicket',
  initialState,
  reducers: {
    extendTicketStatus: state => {
      state.extendTicketStatus = initialState.extendTicketStatus;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(extendTicketAction.pending, (state, action) => {
        state.extendTicketLoading = true;
        state.extendTicketStatus = 'loading';
        state.extendTicketData = null;
      })
      .addCase(extendTicketAction.fulfilled, (state, action) => {
        console.log('action', action);
        state.extendTicketStatus = 'success';
        state.extendTicketData = action.payload;
        state.extendTicketError = '';
        state.extendTicketLoading = false;
      })
      .addCase(extendTicketAction.rejected, (state, action) => {
        state.extendTicketStatus = 'failed';
        state.extendTicketData = action.payload;
        state.extendTicketLoading = false;
      });
  },
});
export const {extendTicketStatus} = extendTicket.actions;
export default extendTicket.reducer;
