import * as constants from '../components/constants/constants';

// Turn the /api/logo/ response into a URL, or '' when the organisation hasn't
// uploaded a logo (callers then show the Alignsys logo).
// Older backends don't send `is_default`, so the placeholder path is checked too.
export const companyLogoUrl = (data) => {
  const path = data?.logo_url;
  if (!path || data?.is_default) return '';
  if (/\/(dafault|default)\.png$/i.test(path)) return '';
  return /^https?:\/\//i.test(path) ? path : `${constants.devApiBaseUrl}${path}`;
};
