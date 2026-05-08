// axiosConfig.js
import axios from 'axios';
import Cookies from 'js-cookie';
import * as constants from './constants/constants'
const axiosInstance = axios.create({
  baseURL: `${constants.devApiBaseUrl}`,  // Update with your backend URL
  withCredentials: true,  // Include cookies in requests
});

axiosInstance.defaults.xsrfHeaderName = 'X-CSRFToken';
axiosInstance.defaults.xsrfCookieName = 'csrftoken';
axiosInstance.defaults.headers.common['X-CSRFToken'] = Cookies.get('csrftoken');

export default axiosInstance;
