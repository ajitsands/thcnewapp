import axios, {AxiosRequestConfig} from 'axios';
import NetInfo from '@react-native-community/netinfo';
import {useToast} from 'react-native-toast-notifications'; // or use react-native-toast-notifications
import {ApiUrl} from './endpoints';

export enum RequestType {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  DELETE = 'delete',
}

export enum ResponseStatus {
  success200,
  error404,
  error500,
  error401,
  error403,
  uploading,
}

export class ResponseModel {
  constructor(public data: any, public status: ResponseStatus) {}
}

const BASE_URL = ApiUrl.devURL; // change to ApiURL.baseURL

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const validateResponse = (status: number, data: any) => {
  if (status === 400) return new ResponseModel(data, ResponseStatus.error404);
  if (status === 401) return new ResponseModel(data, ResponseStatus.error401);
  if (status === 403) return new ResponseModel(data, ResponseStatus.error403);
  if (status >= 500) return new ResponseModel(data, ResponseStatus.error500);
  return new ResponseModel(data, ResponseStatus.success200);
};

export async function request({
  url,
  method,
  data,
  params,
  token,
  onUploadProgress,
}: {
  url: string;
  method: RequestType;
  data?: any;
  params?: any;
  token?: string;
  onUploadProgress?: (progress: number) => void;
}): Promise<ResponseModel | null> {
  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `JWT ${token}`} : {}),
    },
    params,
    data,
    onUploadProgress: onUploadProgress
      ? (progressEvent: ProgressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onUploadProgress(progress);
        }
      : undefined,
  };

  try {
    const res = await apiClient(config);
    return validateResponse(res.status, res.data);
  } catch (err: any) {
    console.error('API Error:', err?.message || err);
    return new ResponseModel(null, ResponseStatus.error500);
  }
}
