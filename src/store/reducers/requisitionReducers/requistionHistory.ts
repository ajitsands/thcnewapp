import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

export interface WorkorderRequisition {
  workorder_id?: number | string;
  id?: number | string;
  workorder_ref?: string;
  workorder_no?: string;
  wo_number?: string;
  ticket_no?: string;
  ticket_id?: number | string;
  ticket_ref_no?: string;
  customer_name?: string;
  customer_id?: number | string;
  location_name?: string;
  building_name?: string;
  status?: string;
  req_status?: string;
  requisition_count?: number | string;
  items_count?: number | string;
  requisition_date?: string;
  created_at?: string;
  date?: string;
  service_name?: string;
  [key: string]: any;
}

export interface RequisitionRequestRecord {
  request_id?: number | string;
  id?: number | string;
  workorder_id?: number | string;
  workorder_ref?: string;
  customer_id?: number | string;
  customer_name?: string;
  request_date?: string;
  status?: string;
  created_by?: number | string;
  attachment_path?: string | null;
  items?: RequisitionItemDetail[];
  [key: string]: any;
}

export interface RequisitionItemDetail {
  request_item_id?: number | string;
  id?: number | string;
  request_id?: number | string;
  item_id?: number | string;
  item_code?: string;
  item_name?: string;
  name?: string;
  category_name?: string;
  category?: string;
  requested_qty?: number | string;
  quantity?: number | string;
  qty?: number | string;
  supplied_qty?: number | string;
  balance_qty?: number | string;
  unit?: string;
  remarks?: string;
  status?: string;
  item_status?: string;
  created_at?: string;
  date?: string;
  [key: string]: any;
}

interface RequisitionHistoryState {
  workorders: WorkorderRequisition[];
  loading: boolean;
  error: string;
  status: string;

  // Selected workorder & detail modal
  selectedWorkorder: WorkorderRequisition | null;
  isDetailsModalVisible: boolean;
  requisitionRequests: RequisitionRequestRecord[];
  requisitionList: RequisitionItemDetail[];
  requisitionListLoading: boolean;
  requisitionListError: string;
}

const initialState: RequisitionHistoryState = {
  workorders: [],
  loading: false,
  error: '',
  status: '',

  selectedWorkorder: null,
  isDetailsModalVisible: false,
  requisitionRequests: [],
  requisitionList: [],
  requisitionListLoading: false,
  requisitionListError: '',
};

// 1. Fetch workorders with requisitions for logged-in employee (Action: getEmployeeWorkordersWithRequisitions)
export const getEmployeeWorkordersWithRequisitions = createAsyncThunk(
  'requisition/getEmployeeWorkordersWithRequisitions',
  async (
    params: {
      APIKEY?: string;
      employee_id?: number | string;
      user_id?: number | string;
      emp_id?: number | string;
      emp_code?: string;
      employee_code?: string;
      action?: string;
    },
    {rejectWithValue, getState},
  ) => {
    try {
      const state: any = getState();
      const appState = state?.app || {};
      const loginData = state?.userLogin?.data || {};
      const profileData =
        state?.profile?.data?.data?.[0] ||
        state?.profile?.data?.[0] ||
        state?.profile?.profileDetails?.data ||
        state?.profile?.profileDetails ||
        state?.profile?.data ||
        {};

      const apiKey =
        params?.APIKEY ||
        appState?.apiKey ||
        loginData?.APIKEY ||
        loginData?.api_key ||
        profileData?.APIKEY ||
        '';

      const empCode =
        params?.emp_code ||
        params?.employee_code ||
        appState?.employeeCode ||
        loginData?.employee_code ||
        loginData?.emp_code ||
        profileData?.employee_code ||
        profileData?.emp_code ||
        '';

      // Extract numeric ID if available, or extract digits from employee code (e.g. CH-THC-0228 -> 228)
      let rawId =
        params?.employee_id ||
        params?.emp_id ||
        params?.user_id ||
        appState?.employeeId ||
        loginData?.employee_id ||
        loginData?.emp_id ||
        loginData?.id ||
        profileData?.employee_id ||
        profileData?.emp_id ||
        profileData?.id ||
        '';

      let numericId = '';
      if (rawId && /^\d+$/.test(String(rawId).trim())) {
        numericId = String(rawId).trim();
      } else if (rawId && /\d+/.test(String(rawId))) {
        const digits = String(rawId).replace(/\D/g, '');
        numericId = String(parseInt(digits, 10));
      } else if (empCode && /\d+/.test(String(empCode))) {
        const digits = String(empCode).replace(/\D/g, '');
        numericId = String(parseInt(digits, 10));
      }

      const finalEmpId = numericId || (rawId ? String(rawId).trim() : (empCode ? String(empCode).trim() : '228'));
      const finalEmpCode = (empCode && String(empCode).trim() !== '') ? String(empCode).trim() : (rawId ? String(rawId).trim() : 'CH-THC-0228');

      console.log('[getEmployeeWorkordersWithRequisitions] Sending POST FormData -> employee_id:', finalEmpId, 'emp_code:', finalEmpCode);

      const formData = new FormData();
      formData.append('action', params?.action || 'getEmployeeWorkordersWithRequisitions');
      formData.append('APIKEY', apiKey);
      formData.append('employee_id', finalEmpId);
      formData.append('emp_code', finalEmpCode);

      const response = await postRequest(ApiUrl.requisitionURL, formData);
      console.log('[getEmployeeWorkordersWithRequisitions] Response:', response?.data);

      if (response?.data?.status === 'error' || response?.data?.status === 'Failed') {
        return rejectWithValue(
          response?.data?.message || response?.data?.api_message || 'Failed to fetch requisitions',
        );
      }

      let list: WorkorderRequisition[] = [];
      if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        list = response.data.data;
      } else if (Array.isArray(response?.data?.workorders)) {
        list = response.data.workorders;
      } else if (Array.isArray(response?.data?.workorder_list)) {
        list = response.data.workorder_list;
      } else if (Array.isArray(response?.data?.requisitions)) {
        list = response.data.requisitions;
      } else if (Array.isArray(response?.data?.result)) {
        list = response.data.result;
      }

      return list;
    } catch (error: any) {
      console.log('[getEmployeeWorkordersWithRequisitions] Error:', error);
      return rejectWithValue(error?.message || 'Failed to load requisition workorders');
    }
  },
);

// 2. Fetch Requisition List for a workorder (Action: getRequisitionList) and auto-fetch items (Action: getRequisitionItems)
export const getRequisitionList = createAsyncThunk(
  'requisition/getRequisitionList',
  async (
    params: {
      APIKEY: string;
      workorder_id: number | string;
      action?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const formData = new FormData();
      formData.append('action', params.action || 'getRequisitionList');
      formData.append('APIKEY', params.APIKEY);
      formData.append('workorder_id', String(params.workorder_id));

      console.log('[getRequisitionList] POST for workorder_id:', params.workorder_id);

      const response = await postRequest(ApiUrl.requisitionURL, formData);
      console.log('[getRequisitionList] Response:', response?.data);

      if (response?.data?.status === 'error' || response?.data?.status === 'Failed') {
        return rejectWithValue(
          response?.data?.message || response?.data?.api_message || 'Failed to fetch requisition list',
        );
      }

      let requests: RequisitionRequestRecord[] = [];
      if (Array.isArray(response?.data)) {
        requests = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        requests = response.data.data;
      }

      // If requests were found, fetch the item details for each request_id using getRequisitionItems
      let allItems: RequisitionItemDetail[] = [];
      for (const req of requests) {
        const reqId = req.request_id || req.id;
        if (reqId) {
          try {
            const itemForm = new FormData();
            itemForm.append('action', 'getRequisitionItems');
            itemForm.append('APIKEY', params.APIKEY);
            itemForm.append('request_id', String(reqId));

            const itemsRes = await postRequest(ApiUrl.requisitionURL, itemForm);
            console.log(`[getRequisitionItems] Response for req ${reqId}:`, itemsRes?.data);
            const itemsData = itemsRes?.data?.data || (Array.isArray(itemsRes?.data) ? itemsRes.data : []);
            if (Array.isArray(itemsData) && itemsData.length > 0) {
              const taggedItems = itemsData.map((it: any) => ({
                ...it,
                request_id: reqId,
                request_date: req.request_date,
                status: it.status || req.status || 'Pending',
              }));
              allItems = allItems.concat(taggedItems);
            }
          } catch (e) {
            console.log(`[getRequisitionItems] Error for req ${reqId}:`, e);
          }
        }
      }

      return {
        requests,
        items: allItems.length > 0 ? allItems : (requests as any),
      };
    } catch (error: any) {
      console.log('[getRequisitionList] Error:', error);
      return rejectWithValue(error?.message || 'Failed to load requisition items');
    }
  },
);

// 3. Fetch Requisition Items directly for a request (Action: getRequisitionItems)
export const getRequisitionItems = createAsyncThunk(
  'requisition/getRequisitionItems',
  async (
    params: {
      APIKEY: string;
      request_id: number | string;
    },
    {rejectWithValue},
  ) => {
    try {
      const formData = new FormData();
      formData.append('action', 'getRequisitionItems');
      formData.append('APIKEY', params.APIKEY);
      formData.append('request_id', String(params.request_id));

      const response = await postRequest(ApiUrl.requisitionURL, formData);
      if (response?.data?.status === 'error' || response?.data?.status === 'Failed') {
        return rejectWithValue(response?.data?.message || 'Failed to fetch items');
      }
      const data = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
      return data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch items');
    }
  },
);

export const getRequisitionHistory = getEmployeeWorkordersWithRequisitions;

const requisitionHistoryDetails = createSlice({
  name: 'requisitionHistory',
  initialState,
  reducers: {
    resetError: state => {
      state.error = '';
      state.requisitionListError = '';
    },
    setSelectedWorkorder: (state, action: PayloadAction<WorkorderRequisition | null>) => {
      state.selectedWorkorder = action.payload;
    },
    setDetailsModalVisible: (state, action: PayloadAction<boolean>) => {
      state.isDetailsModalVisible = action.payload;
      if (!action.payload) {
        state.requisitionRequests = [];
        state.requisitionList = [];
        state.requisitionListError = '';
      }
    },
    clearRequisitionItems: state => {
      state.requisitionRequests = [];
      state.requisitionList = [];
      state.requisitionListError = '';
      state.requisitionListLoading = false;
    },
  },
  extraReducers: builder => {
    // Workorders list
    builder
      .addCase(getEmployeeWorkordersWithRequisitions.pending, state => {
        state.loading = true;
        state.status = 'loading';
        state.error = '';
      })
      .addCase(getEmployeeWorkordersWithRequisitions.fulfilled, (state, action) => {
        state.status = 'success';
        state.workorders = action.payload || [];
        state.error = '';
        state.loading = false;
      })
      .addCase(getEmployeeWorkordersWithRequisitions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to fetch requisitions';
        state.loading = false;
      });

    // Requisition Requests & Items for selected workorder
    builder
      .addCase(getRequisitionList.pending, state => {
        state.requisitionListLoading = true;
        state.requisitionListError = '';
      })
      .addCase(getRequisitionList.fulfilled, (state, action) => {
        state.requisitionListLoading = false;
        state.requisitionRequests = action.payload.requests || [];
        state.requisitionList = action.payload.items || [];
        state.requisitionListError = '';
      })
      .addCase(getRequisitionList.rejected, (state, action) => {
        state.requisitionListLoading = false;
        state.requisitionListError = (action.payload as string) || 'Failed to fetch items';
      });

    // Requisition Items single request
    builder
      .addCase(getRequisitionItems.pending, state => {
        state.requisitionListLoading = true;
      })
      .addCase(getRequisitionItems.fulfilled, (state, action) => {
        state.requisitionListLoading = false;
        state.requisitionList = action.payload || [];
      })
      .addCase(getRequisitionItems.rejected, (state, action) => {
        state.requisitionListLoading = false;
        state.requisitionListError = action.payload as string;
      });
  },
});

export const {
  resetError,
  setSelectedWorkorder,
  setDetailsModalVisible,
  clearRequisitionItems,
} = requisitionHistoryDetails.actions;

export default requisitionHistoryDetails.reducer;
