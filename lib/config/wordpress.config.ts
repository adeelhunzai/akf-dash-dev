export const WORDPRESS_API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ??
  process.env.WORDPRESS_API_URL ??
  '';

export const WORDPRESS_ADMIN_USERNAME = "masroor748@gmail.com"

export const WORDPRESS_ADMIN_PASSWORD = "wag5 PmRM dV0A dPNn saOV WZZk"

// Optional for later
export const WORDPRESS_LEARNER_USERNAME =
  process.env.WORDPRESS_LEARNER_USERNAME ?? '';
export const WORDPRESS_LEARNER_PASSWORD =
  process.env.WORDPRESS_LEARNER_PASSWORD ?? '';

// Helpful base paths
export const WP_CORE_BASE = `${WORDPRESS_API_URL}/wp/v2`;
export const WP_LD_BASE = `${WORDPRESS_API_URL}/ldlms/v2`;
export const WP_CUSTOM_BASE = `${WORDPRESS_API_URL}/akf/v1`; 