import {PayloadAction, createSlice} from '@reduxjs/toolkit';

const initialState = {
  userLoggedIn: false,
  apiKey: '',
  employeeId: '',
  employeeCode: '',
  empName:''
};

export const appReducer = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.userLoggedIn = action.payload;
    },
    setUserData: (state, action) => {
      {console.log(action.payload)}
    
      (state.apiKey = action.payload.APIKEY),
        (state.employeeId = action.payload.employeeId),
        (state.employeeCode = action.payload.employee_code),
        state.empName=action.payload.employee_name;
    },
    logout: state => {
      state.userLoggedIn = initialState.userLoggedIn;
      state.apiKey = initialState.apiKey;
      state.employeeId = initialState.employeeId;
      state.employeeCode = initialState.employeeCode;
    },
  },
  extraReducers(builder) {},
});

export const {setLoggedIn, logout, setUserData} = appReducer.actions;
export default appReducer.reducer;
