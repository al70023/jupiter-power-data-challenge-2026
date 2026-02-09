export const ERCOT_TOKEN_URL =
  "https://ercotb2c.b2clogin.com/ercotb2c.onmicrosoft.com/B2C_1_PUBAPI-ROPC-FLOW/oauth2/v2.0/token";
export const ERCOT_CLIENT_ID = "fec253ea-0d06-4272-a5e6-b478baeecd70";
export const ERCOT_SCOPE = `openid ${ERCOT_CLIENT_ID} offline_access`;
export const ERCOT_BASE_URL = "https://api.ercot.com/api/public-reports";
export const ERCOT_PRODUCT_PATH = "np6-905-cd/spp_node_zone_hub";

export const ERCOT_MAX_HTTP_RETRIES = 5;
export const ERCOT_BASE_RETRY_MS = 400;
