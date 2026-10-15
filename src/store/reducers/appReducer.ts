import {PayloadAction, createSlice} from '@reduxjs/toolkit';

const initialState = {
  userLoggedIn: false,
  apiKey: '',
  employeeId: '',
  employeeCode: '',
  empName: '',
  employeeType: '',
};

export const appReducer = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.userLoggedIn = action.payload;
    },
    setUserData: (state, action) => {
      console.log('setUserData payload:', action.payload);
      const payload = action.payload || {};
      const firstItem = Array.isArray(payload?.data)
        ? payload.data[0]
        : Array.isArray(payload)
        ? payload[0]
        : payload?.data || {};

      state.apiKey = payload.APIKEY || firstItem.APIKEY || payload.api_key || firstItem.api_key || '';
      state.employeeId =
        payload.employeeId ||
        firstItem.employeeId ||
        payload.employee_id ||
        firstItem.employee_id ||
        payload.emp_id ||
        firstItem.emp_id ||
        payload.id ||
        firstItem.id ||
        payload.user_id ||
        firstItem.user_id ||
        '';
      state.employeeCode =
        payload.employee_code ||
        firstItem.employee_code ||
        payload.emp_code ||
        firstItem.emp_code ||
        payload.employeeCode ||
        firstItem.employeeCode ||
        payload.emp_id ||
        firstItem.emp_id ||
        '';
      state.empName =
        payload.employee_name ||
        firstItem.employee_name ||
        payload.emp_name ||
        firstItem.emp_name ||
        payload.employeeName ||
        firstItem.employeeName ||
        '';
      state.employeeType =
        payload.employee_type ||
        firstItem.employee_type ||
        payload.employee_type_name ||
        firstItem.employee_type_name ||
        payload.employeeType ||
        firstItem.employeeType ||
        payload.emp_type ||
        firstItem.emp_type ||
        '';
    },
    logout: state => {
      state.userLoggedIn = initialState.userLoggedIn;
      state.apiKey = initialState.apiKey;
      state.employeeId = initialState.employeeId;
      state.employeeCode = initialState.employeeCode;
      state.empName = initialState.empName;
      state.employeeType = initialState.employeeType;
    },
  },
  extraReducers(builder) {},
});

export const {setLoggedIn, logout, setUserData} = appReducer.actions;
export default appReducer.reducer;
