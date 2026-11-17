
console.log("API URL:", import.meta.env.VITE_AUTH_URL);
export const devViewerServiceUrl=import.meta.env.VITE_VIEWER_SERVICE
export const devApiBaseUrl=import.meta.env.VITE_AUTH_URL
export const devApi2BaseUrl=import.meta.env.VITE_CORP_URL
export const annotationsurl=import.meta.env.VITE_ANNOTATIONS_URL
export const boturl=import.meta.env.VITE_BOT_URL
// Temporary public-link service (same as Alignsys EDMS: POST {url}/api/PublicLink -> { file_url }).
// Used to preview Office files with Microsoft Office Online before upload. Unset = no Office preview.
export const publicFileUrl=import.meta.env.VITE_PUBLIC_FILE_URL

// export const devViewerServiceUrl="https://mfilesdsscorppreviewer.techedge.dev"
// export const devApiBaseUrl="https://dssauthcorp.techedge.dev"
// export const devApi2BaseUrl="https://dsscallcorp.techedge.dev"
// export const annotationsurl="https://annotationsdk.techedge.dev"

// export const devApiBaseUrl="http://localhost:8000"

// export const devViewerServiceUrl="https://mfilesdsscorppreviewerdev1sdk.techedge.dev"
// export const devApiBaseUrl="https://dssauthcorpdevsdk.techedge.dev"
// export const devApi2BaseUrl="https://dsscallcorpdevsdk.techedge.dev"
// export const annotationsurl="https://annotationdevsdk.techedge.dev"



//PSPDFKIT License
export const license=import.meta.env.VITE_PSPDFKIT
