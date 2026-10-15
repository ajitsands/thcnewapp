import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {postRequest, getRequest} from '../../network/services';
import {ApiUrl} from '../../network/endpoints';

interface JanitorExecutionState {
  verificationLoading: boolean;
  verificationData: any;
  verificationError: string;

  checklistLoading: boolean;
  checklistData: any;
  checklistError: string;

  uploadLoading: boolean;
  uploadedPhotoUrl: string;
  uploadError: string;

  submitLoading: boolean;
  submitSuccess: boolean;
  submitError: string;
}

const initialState: JanitorExecutionState = {
  verificationLoading: false,
  verificationData: null,
  verificationError: '',

  checklistLoading: false,
  checklistData: null,
  checklistError: '',

  uploadLoading: false,
  uploadedPhotoUrl: '',
  uploadError: '',

  submitLoading: false,
  submitSuccess: false,
  submitError: '',
};

/**
 * Endpoint 4: QR Scan, Geo-fence Verification & Attendance
 */
export const verifyAssetAndLocation = createAsyncThunk(
  'janitorExecution/verifyAssetAndLocation',
  async (params: any, {rejectWithValue, getState}) => {
    try {
      const state: any = getState();
      const appState = state?.app || {};
      const loginData = state?.userLogin?.data || {};

      const apiKey =
        params?.APIKEY ||
        appState?.apiKey ||
        loginData?.APIKEY ||
        ApiUrl.janitorApiKey;

      const empCode =
        params?.emp_code ||
        appState?.employeeCode ||
        loginData?.employee_code ||
        loginData?.emp_code ||
        '';

      const formData = new FormData();
      formData.append('action', 'scan_asset_and_verify_location');
      formData.append('APIKEY', apiKey);
      formData.append('emp_code', empCode);
      formData.append('asset_code', String(params?.asset_code || ''));
      formData.append('latitude', String(params?.latitude || ''));
      formData.append('longitude', String(params?.longitude || ''));
      formData.append('allowed_radius_meters', String(params?.allowed_radius_meters || 10));

      console.log('[verifyAssetAndLocation] Sending verification:', {
        asset_code: params?.asset_code,
        lat: params?.latitude,
        lng: params?.longitude,
      });

      const response = await postRequest(ApiUrl.janitorURL, formData);
      console.log('[verifyAssetAndLocation] Response:', response?.data);

      if (response?.data?.status === 'Failed' || response?.data?.rule_status === 'FAILED') {
        return rejectWithValue(
          response?.data?.api_message || 'Verification failed. Please ensure you are within 10m of the asset.',
        );
      }

      return response?.data;
    } catch (err: any) {
      console.log('[verifyAssetAndLocation] Error:', err);
      return rejectWithValue(err?.message || 'Failed to verify location and asset');
    }
  },
);

/**
 * Endpoint 5: Checklist Inspection & Cleaning Points
 */
export const getChecklistItems = createAsyncThunk(
  'janitorExecution/getChecklistItems',
  async (params: any, {rejectWithValue, getState}) => {
    try {
      const state: any = getState();
      const appState = state?.app || {};
      const loginData = state?.userLogin?.data || {};

      const apiKey =
        params?.APIKEY ||
        appState?.apiKey ||
        loginData?.APIKEY ||
        ApiUrl.janitorApiKey;

      const queryParams: any = {
        action: 'get_checklist_items',
        APIKEY: apiKey,
        checklist_id: params?.checklist_id,
        assignment_id: params?.assignment_id,
      };

      console.log('[getChecklistItems] Fetching checklist items:', queryParams);
      const response = await getRequest(ApiUrl.janitorURL, queryParams);
      console.log('[getChecklistItems] Response:', response?.data);

      if (response?.data?.status === 'Failed') {
        return rejectWithValue(response?.data?.api_message || 'Failed to load checklist items');
      }

      return response?.data;
    } catch (err: any) {
      console.log('[getChecklistItems] Error:', err);
      return rejectWithValue(err?.message || 'Error fetching checklist');
    }
  },
);

/**
 * Endpoint 6: Upload Proof Photo
 */
export const uploadExecutionPhoto = createAsyncThunk(
  'janitorExecution/uploadPhoto',
  async (params: {photo?: any; photo_base64?: string}, {rejectWithValue, getState}) => {
    try {
      const state: any = getState();
      const appState = state?.app || {};
      const apiKey = appState?.apiKey || ApiUrl.janitorApiKey;

      const formData = new FormData();
      formData.append('action', 'upload_execution_photo');
      formData.append('APIKEY', apiKey);

      if (params.photo) {
        formData.append('photo', params.photo);
      } else if (params.photo_base64) {
        formData.append('photo_base64', params.photo_base64);
      }

      console.log('[uploadExecutionPhoto] Uploading photo...');
      const response = await postRequest(ApiUrl.janitorURL, formData);
      console.log('[uploadExecutionPhoto] Response:', response?.data);

      if (response?.data?.status === 'Failed' || !response?.data?.photo_url) {
        return rejectWithValue(response?.data?.api_message || 'Photo upload failed');
      }

      return response?.data?.photo_url;
    } catch (err: any) {
      console.log('[uploadExecutionPhoto] Error:', err);
      return rejectWithValue(err?.message || 'Failed to upload photo');
    }
  },
);

/**
 * Endpoint 7: Submit Completed Checklist Execution
 */
export const submitChecklistExecution = createAsyncThunk(
  'janitorExecution/submitExecution',
  async (
    params: {
      assignment_id: number | string;
      slot: string;
      date?: string;
      status?: string;
      remarks?: string;
      points: Array<{
        checklist_item_id: number | string;
        is_completed: 'Yes' | 'No';
        remarks?: string;
        photo_url?: string;
      }>;
    },
    {rejectWithValue, getState},
  ) => {
    try {
      const state: any = getState();
      const appState = state?.app || {};
      const loginData = state?.userLogin?.data || {};

      const apiKey = appState?.apiKey || loginData?.APIKEY || ApiUrl.janitorApiKey;
      const empCode =
        appState?.employeeCode || loginData?.employee_code || loginData?.emp_code || '';

      const formData = new FormData();
      formData.append('action', 'submit_checklist_execution');
      formData.append('APIKEY', apiKey);
      formData.append('emp_code', empCode);
      formData.append('assignment_id', String(params.assignment_id));
      formData.append('slot', params.slot);
      if (params.date) {
        formData.append('date', params.date);
      }
      if (params.status) {
        formData.append('status', params.status);
      }
      if (params.remarks) {
        formData.append('remarks', params.remarks);
      }
      formData.append('points', JSON.stringify(params.points));

      console.log('[submitChecklistExecution] Submitting execution:', {
        assignment_id: params.assignment_id,
        slot: params.slot,
        status: params.status,
        pointsCount: params.points.length,
      });

      const response = await postRequest(ApiUrl.janitorURL, formData);
      console.log('[submitChecklistExecution] Response:', response?.data);

      if (response?.data?.status === 'Failed') {
        return rejectWithValue(response?.data?.api_message || 'Failed to submit execution');
      }

      return response?.data;
    } catch (err: any) {
      console.log('[submitChecklistExecution] Error:', err);
      return rejectWithValue(err?.message || 'Failed to submit checklist');
    }
  },
);

const janitorExecutionSlice = createSlice({
  name: 'janitorExecution',
  initialState,
  reducers: {
    resetVerification: state => {
      state.verificationLoading = false;
      state.verificationData = null;
      state.verificationError = '';
    },
    resetSubmitState: state => {
      state.submitLoading = false;
      state.submitSuccess = false;
      state.submitError = '';
    },
  },
  extraReducers: builder => {
    // Verify Asset and Location
    builder
      .addCase(verifyAssetAndLocation.pending, state => {
        state.verificationLoading = true;
        state.verificationError = '';
      })
      .addCase(verifyAssetAndLocation.fulfilled, (state, action) => {
        state.verificationLoading = false;
        state.verificationData = action.payload;
        state.verificationError = '';
      })
      .addCase(verifyAssetAndLocation.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = (action.payload as string) || 'Verification failed';
      });

    // Get Checklist Items
    builder
      .addCase(getChecklistItems.pending, state => {
        state.checklistLoading = true;
        state.checklistError = '';
      })
      .addCase(getChecklistItems.fulfilled, (state, action) => {
        state.checklistLoading = false;
        state.checklistData = action.payload;
        state.checklistError = '';
      })
      .addCase(getChecklistItems.rejected, (state, action) => {
        state.checklistLoading = false;
        state.checklistError = (action.payload as string) || 'Failed to load checklist';
      });

    // Upload Execution Photo
    builder
      .addCase(uploadExecutionPhoto.pending, state => {
        state.uploadLoading = true;
        state.uploadError = '';
      })
      .addCase(uploadExecutionPhoto.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.uploadedPhotoUrl = action.payload as string;
      })
      .addCase(uploadExecutionPhoto.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = (action.payload as string) || 'Photo upload failed';
      });

    // Submit Execution
    builder
      .addCase(submitChecklistExecution.pending, state => {
        state.submitLoading = true;
        state.submitSuccess = false;
        state.submitError = '';
      })
      .addCase(submitChecklistExecution.fulfilled, state => {
        state.submitLoading = false;
        state.submitSuccess = true;
        state.submitError = '';
      })
      .addCase(submitChecklistExecution.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitSuccess = false;
        state.submitError = (action.payload as string) || 'Submission failed';
      });
  },
});

export const {resetVerification, resetSubmitState} = janitorExecutionSlice.actions;
export default janitorExecutionSlice.reducer;
