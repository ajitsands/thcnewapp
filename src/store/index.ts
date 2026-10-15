import {combineReducers, configureStore} from '@reduxjs/toolkit';
import loginSlice from './reducers/loginReducer';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import {ignorePathRedux, whiteListRedux} from './config';
import appReducer from './reducers/appReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getPersistConfig} from 'redux-deep-persist';
import passwordResetSlice from './reducers/resetPassword';
import getSchedules from './reducers/getSchedules';
import getSlots from './reducers/getSlots';
import getTicketDetails from './reducers/getTicketDetails';
import getTeamDetails from './reducers/getTeam';
import markAttendance from './reducers/markPresentReducer';
import historyDetails from './reducers/workHistoryReducer';
import profileDetails from './reducers/profileReducer';
import serviceDetails from './reducers/serviceReducers/serviceDetailsReducer';
import serviceImages from './reducers/serviceReducers/getserviceImages';
import uploadServiceImages from './reducers/serviceReducers/uploadServiceImages';
import startJobReducer from './reducers/serviceReducers/startJobReducer';
import pauseJobReducer from './reducers/serviceReducers/pauseJobReducer';
import completeJobReducer from './reducers/serviceReducers/completeJobReducer';
import restartJobReducer from './reducers/serviceReducers/restartJobReducer';
import extendTicketReducer from './reducers/serviceReducers/extendTicketReducer';
import getAssetDetails from './reducers/assetReducers/getAssetDetails';
import getContact from './reducers/customerCare';
import requisitionHistoryDetails from './reducers/requisitionReducers/requistionHistory';
import categoryDetails from './reducers/requisitionReducers/getCategoryReducers';
import productTypeDetails from './reducers/requisitionReducers/getProductType';
import itemDetails from './reducers/requisitionReducers/itemDetailsReducer';
import addRequisitionItemDetails from './reducers/requisitionReducers/addRequisitionItemReducer';
import deleteItemDetails from './reducers/requisitionReducers/deleteRequisitionItemreducer';
import bookRequisitionReducer from './reducers/requisitionReducers/bookRequisitionReducer';
import janitorExecutionReducer from './reducers/janitorExecutionReducer';
const middleware: any = [];

const rootReducer = combineReducers({
  schedules: getSchedules,
  userLogin: loginSlice,
  slots: getSlots,
  tickets: getTicketDetails,
  app: appReducer,
  resetPassword: passwordResetSlice,
  team: getTeamDetails,
  markPresent: markAttendance,
  history: historyDetails,
  profile: profileDetails,
  service: serviceDetails,
  serviceImages: serviceImages,
  uploadServiceImages: uploadServiceImages,
  startJob: startJobReducer,
  stopJob: pauseJobReducer,
  completeJob: completeJobReducer,
  restartJob: restartJobReducer,
  extendTicket: extendTicketReducer,
  assetDetails: getAssetDetails,
  customerCare: getContact,
  requisitionHistory: requisitionHistoryDetails,
  requisitionCategories: categoryDetails,
  productType: productTypeDetails,
  itemDetails: itemDetails,
  addRequisitionItemDetails: addRequisitionItemDetails,
  deleteRequisition: deleteItemDetails,
  bookRequisition: bookRequisitionReducer,
  janitorExecution: janitorExecutionReducer,
});
const config = getPersistConfig({
  storage: AsyncStorage,
  rootReducer,
  key: 'root',
  whitelist: whiteListRedux,
});

const persistedReducer = persistReducer(config, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionPaths: ignorePathRedux,
        immutableCheck: false,
      },
    }).concat(middleware),
});
export const persistor = persistStore(store);
export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
