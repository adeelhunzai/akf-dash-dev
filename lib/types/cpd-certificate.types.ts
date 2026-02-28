/**
 * CPD Certificate Pro Plugin - Frontend Types
 * Maps to the /cpd/v1/user/certificates REST API response
 */

// Share URLs returned by the CPD plugin
export interface CPDShareUrls {
    linkedin: string;
    facebook: string;
    twitter: string;
    whatsapp: string;
    email: string;
    copy_link: string;
}

// Certificate data when a certificate has been purchased
export interface CPDCertificateData {
    id: number;
    uuid: string;
    credential_id: string;
    cpd_hours: number;
    status: 'active' | 'revoked' | 'expired' | 'pending';
    issued_date: string;
    download_url: string | null;
    verification_url: string;
    share_urls: CPDShareUrls;
}

// Pricing data when a CPD certificate is available for purchase
export interface CPDPricingData {
    price: number;
    price_formatted: string;
    currency: string;
}

// A single certificate item (one per completed course)
export interface CPDCertificateItem {
    course_id: number;
    course_name: string;
    type: 'CPD' | 'Standard';
    is_cpd: boolean;
    instructor: string | null;
    quiz_score: number | null;
    completion_date: string | null;
    has_certificate: boolean;
    certificate_purchased: boolean;
    certificate?: CPDCertificateData;
    pricing?: CPDPricingData;
}

// Response from GET /cpd/v1/user/certificates
export interface CPDCertificatesResponse {
    success: boolean;
    data: CPDCertificateItem[];
}

// Response from creating a Stripe checkout session
export interface CPDCheckoutSessionResponse {
    success: boolean;
    data: {
        transaction_id: number;
        session_id: string;
        checkout_url: string;
        publishable_key: string;
        pricing: CPDPricingData;
    };
}
