import axios from 'axios';
import store from '../store';
import {ApiUrl} from './endpoints';
import NetInfo from '@react-native-community/netinfo';

const API = axios.create({
  baseURL: ApiUrl.devURL,
  timeout: 35000,
  headers: {
    accept: 'application/json',
    'Content-Type': 'multipart/form-data',
  },
  validateStatus: status => status < 600,
});

API.interceptors.request.use(async request => {
  try {
    const connection = await NetInfo.fetch();
    if (connection.isConnected === false) {
      return Promise.reject(new Error('No Internet connection'));
    }
  } catch (e) {
    // Continue if NetInfo check fails
  }

  console.log('Starting Request:', request?.url, request?.params || request?.data);
  return request;
});

API.interceptors.response.use(
  response => {
    console.log('Response:', response?.config?.url, response?.status, response?.data);
    return response;
  },
  error => {
    console.warn('API Error:', error?.message);
    return Promise.reject(error);
  },
);

export const postRequest = async (url: string, data: {}, token?: string) => {
  if (token && typeof token === 'string') {
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

