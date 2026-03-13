



export type apiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export interface ApiRequestConfig {
    url: string;
    method: apiMethod;
    body?: any;
    signal?: AbortSignal,
    thunkAPI: any;
  }

