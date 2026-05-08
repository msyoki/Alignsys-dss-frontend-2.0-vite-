// Dashboard API service
import axios from 'axios';
import * as constants from '../components/constants/constants';

export const getWorkflows = async (authToken) => {
  const headers = { 'Authorization': `Bearer ${authToken}` };
  const endpoints = [
    `${constants.devApiBaseUrl}/api/workflows/`,
    `${constants.devApiBaseUrl}/api/organization/workflows/`
  ];
  const [workflowsRes, orgWorkflowsRes] = await Promise.all(
    endpoints.map(url => axios.get(url, { headers, maxBodyLength: Infinity }))
  );
  return {
    workflows: workflowsRes.data,
    organizationWorkflows: orgWorkflowsRes.data
  };
};

export const getCompanyLogo = async (authToken) => {
  const res = await axios.get(`${constants.devApiBaseUrl}/api/logo/`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  return `${constants.devApiBaseUrl}${res.data['logo_url']}`;
};

export const getAvatar = async (authToken) => {
  const res = await axios.get(`${constants.devApiBaseUrl}/api/avatar/`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  return `${constants.devApiBaseUrl}${res.data['avatar_url']}`;
};

export const fetchList = async (url, authToken) => {
  const config = { headers: { 'Authorization': `Bearer ${authToken}` } };
  const res = await axios.get(url, config);
  return res.data;
};
