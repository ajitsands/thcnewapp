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
interface teamDetails {
  action: string;
  APIKEY: string;
  // emp_code: string;
  visit_date: string;
  amc_ticket_ref_no: string;
  amc_tkt_id: string;
}

export const getTeamDetails = createAsyncThunk(
  'team/getTeamDetails',
  async (params: teamDetails, {rejectWithValue}) => {
    try {
      console.log(params);
      const response = await getRequest(ApiUrl.getScheduleURL, params);
      console.log(response);
      if (response.data.status == 'Failed') {
        throw new Error(response?.data?.api_message);
      } else {
        navigate('TeamDetails', {visitDate: params.visit_date});
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  },
);

const teamDetails = createSlice({
  name: 'teamDetails',
  initialState,
  reducers: {
    resetError: state => {
      state.error = initialState.error;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getTeamDetails.pending, (state, action) => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getTeamDetails.fulfilled, (state, action) => {
        console.log('action', action);
        state.status = 'success';
        state.data = action.payload;
        state.error = '';
        state.loading = false;
      })
      .addCase(getTeamDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.data = null;
        state.loading = false;
      });
  },
});
export const {resetError} = teamDetails.actions;
export default teamDetails.reducer;
