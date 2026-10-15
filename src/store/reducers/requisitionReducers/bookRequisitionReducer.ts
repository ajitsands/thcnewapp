import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {getRequest, postRequest} from '../../../network/services';
import {ApiUrl} from '../../../network/endpoints';

export interface RequisitionCategory {
  id: string;
  name: string;
}

export interface RequisitionItem {
  id: string;
  item_code: string;
  item_name: string;
  type_name: string;
  description?: string;
}

export interface StagedRequisitionItem {
  category_id?: string;
  category_name?: string;
  item_id: number | string;
  item_name: string;
  item_code?: string;
  quantity: number;
  unit: string;
  remarks: string;
}

interface BookRequisitionState {
  categories: RequisitionCategory[];
  categoriesLoading: boolean;
  categoriesError: string;

  items: RequisitionItem[];
  itemsLoading: boolean;
  itemsError: string;
  selectedCategory: string | null;

  submitLoading: boolean;
  submitSuccess: boolean;
  submitError: string;
  submitResponse: any;
}

const initialState: BookRequisitionState = {
  categories: [],
  categoriesLoading: false,
  categoriesError: '',

  items: [],
  itemsLoading: false,
  itemsError: '',
  selectedCategory: null,

  submitLoading: false,
  submitSuccess: false,
  submitError: '',
  submitResponse: null,
};

// 1. Fetch Categories: action = getCatogory
export const fetchRequisitionCategories = createAsyncThunk(
  'bookRequisition/fetchCategories',
  async (params: {APIKEY: string}, {rejectWithValue}) => {
    try {
      const query = {
        action: 'getCatogory',
        APIKEY: params.APIKEY,
      };
      console.log('[fetchRequisitionCategories] Query:', query);
      const response = await getRequest(ApiUrl.requisitionURL, query);
      console.log('[fetchRequisitionCategories] Response:', response?.data);
      if (response?.data?.status === 'error' || response?.data?.status === 'Failed') {
        return rejectWithValue(response?.data?.message || response?.data?.api_message || 'Failed to fetch categories');
      }
      const data = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
      return data;
    } catch (error: any) {
      console.log('[fetchRequisitionCategories] Error:', error);
      return rejectWithValue(error?.message || 'Failed to load categories');
    }
  },
);

// 2. Fetch Item List: action = getItemList, category = <Category Name>
export const fetchRequisitionItems = createAsyncThunk(
  'bookRequisition/fetchItems',
  async (params: {APIKEY: string; category: string}, {rejectWithValue}) => {
    try {
      const query = {
        action: 'getItemList',
        APIKEY: params.APIKEY,
        category: params.category,
      };
      console.log('[fetchRequisitionItems] Query:', query);
      const response = await getRequest(ApiUrl.requisitionURL, query);
      console.log('[fetchRequisitionItems] Response:', response?.data);
      if (response?.data?.status === 'error' || response?.data?.status === 'Failed') {
        return rejectWithValue(response?.data?.message || response?.data?.api_message || 'Failed to fetch items');
      }
      const data = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
      return {data, category: params.category};
    } catch (error: any) {
      console.log('[fetchRequisitionItems] Error:', error);
      return rejectWithValue(error?.message || 'Failed to load items');
    }
  },
);

// 3. Submit Requisition: action = bookRequestion
export interface SubmitRequisitionPayload {
  APIKEY: string;
  customer_id: number | string;
  workorder_id: number | string;
  user_id?: number | string;
  items: Array<{
    item_id: number | string;
    quantity: number | string;
    unit?: string;
    remarks?: string;
  }>;
  attachment?: {
    uri: string;
    name?: string;
    type?: string;
  } | null;
}

export const submitBookRequisition = createAsyncThunk(
  'bookRequisition/submitRequisition',
  async (payload: SubmitRequisitionPayload, {rejectWithValue}) => {
    try {
      const formData = new FormData();
      formData.append('action', 'bookRequestion');
      formData.append('APIKEY', payload.APIKEY);
      formData.append('customer_id', String(payload.customer_id));
      formData.append('workorder_id', String(payload.workorder_id));
      formData.append('user_id', String(payload.user_id || 1));

      // Clean items JSON format as required
      const formattedItems = payload.items.map(item => ({
        item_id: Number(item.item_id) || item.item_id,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Nos',
        remarks: item.remarks || '',
      }));
      formData.append('items', JSON.stringify(formattedItems));

      if (payload.attachment && payload.attachment.uri) {
        const fileUri = payload.attachment.uri;
        const filename = payload.attachment.name || fileUri.split('/').pop() || `req_attach_${Date.now()}.jpg`;
        const fileType = payload.attachment.type || (filename.endsWith('.png') ? 'image/png' : 'image/jpeg');

        formData.append('attachment', {
          uri: fileUri,
          name: filename,
          type: fileType,
        } as any);
      }

      console.log('[submitBookRequisition] Submitting FormData payload:');
      console.log('action: bookRequestion');
      console.log('customer_id:', payload.customer_id);
      console.log('workorder_id:', payload.workorder_id);
      console.log('user_id:', payload.user_id);
      console.log('items:', JSON.stringify(formattedItems));
      console.log('attachment:', payload.attachment?.uri ? 'Attached' : 'None');

      const response = await postRequest(ApiUrl.requisitionURL, formData);
      console.log('[submitBookRequisition] Response:', response?.data);

      if (
        response?.data?.status === 'error' ||
        response?.data?.status === 'Failed' ||
        response?.data?.status === 'failed'
      ) {
        const errorDetail = response?.data?.error ? ` (${response.data.error})` : '';
        const errorMsg = (response?.data?.message || response?.data?.api_message || 'Failed to save requisition') + errorDetail;
        return rejectWithValue(errorMsg);
      }

      return response?.data || {status: 'success', message: 'Requisition booked successfully'};
    } catch (error: any) {
      console.log('[submitBookRequisition] Error:', error);
      const serverErr = error?.response?.data?.error ? ` (${error.response.data.error})` : '';
      const errorMsg =
        (error?.response?.data?.message ||
        error?.response?.data?.api_message ||
        error?.message ||
        'Failed to submit material requisition') + serverErr;
      return rejectWithValue(errorMsg);
    }
  },
);

const bookRequisitionSlice = createSlice({
  name: 'bookRequisition',
  initialState,
  reducers: {
    resetRequisitionSubmitState: state => {
      state.submitLoading = false;
      state.submitSuccess = false;
      state.submitError = '';
      state.submitResponse = null;
    },
    clearRequisitionItemsList: state => {
      state.items = [];
      state.selectedCategory = null;
    },
  },
  extraReducers: builder => {
    // Categories
    builder
      .addCase(fetchRequisitionCategories.pending, state => {
        state.categoriesLoading = true;
        state.categoriesError = '';
      })
      .addCase(fetchRequisitionCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload || [];
        state.categoriesError = '';
      })
      .addCase(fetchRequisitionCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload as string;
      });

    // Items
    builder
      .addCase(fetchRequisitionItems.pending, state => {
        state.itemsLoading = true;
        state.itemsError = '';
      })
      .addCase(fetchRequisitionItems.fulfilled, (state, action) => {
        state.itemsLoading = false;
        state.items = action.payload.data || [];
        state.selectedCategory = action.payload.category;
        state.itemsError = '';
      })
      .addCase(fetchRequisitionItems.rejected, (state, action) => {
        state.itemsLoading = false;
        state.itemsError = action.payload as string;
      });

    // Submit
    builder
      .addCase(submitBookRequisition.pending, state => {
        state.submitLoading = true;
        state.submitSuccess = false;
        state.submitError = '';
      })
      .addCase(submitBookRequisition.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.submitSuccess = true;
        state.submitError = '';
        state.submitResponse = action.payload;
      })
      .addCase(submitBookRequisition.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitSuccess = false;
        state.submitError = action.payload as string;
      });
  },
});

export const {resetRequisitionSubmitState, clearRequisitionItemsList} = bookRequisitionSlice.actions;
export default bookRequisitionSlice.reducer;
