import axios from 'axios';
import store from '../store';
import {ApiUrl} from './endpoints';
import NetInfo from '@react-native-community/netinfo';

const API = axios.create({
  baseURL: ApiUrl.devURL,
  timeout: 10000,
  headers: {
    accept: 'application/json',
    'Content-Type': 'multipart/form-data',
  },
  validateStatus: status => status < 500,
});
API.interceptors.request.use(async request => {
  const connection = await NetInfo.fetch();

  if (!connection.isConnected || !connection.isInternetReachable) {
    return Promise.reject(new Error('No Internet connection'));
  }

  console.log('Starting Request', request);
  return request;
});

// 🚀 Response logging
API.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    return Promise.reject(error);
  },
);
// Logging interceptor
API.interceptors.request.use(request => {
  console.log('Starting Request', request);
  return request;
});
API.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
export const postRequest = async (url: string, data: {}, token?: string) => {
  if (token) {
    API.defaults.headers.Authorization = `Bearer ${token}`;
  }
  const res = await API.post(url, data);
  return res;
};
export const getRequest = async (url: string, queries = {}) => {
  const response = await API.get(url, {
    params: queries,
  });

  return response;
};
