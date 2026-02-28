import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface PricingRule {
    id: number;
    country_code: string;
    country_name: string;
    region: string;
    currency: string;
    price: number;
    price_formatted: string;
    tax_rate: number;
    discount_percent: number;
    is_active: boolean;
    status: 'active' | 'inactive';
    effective_from: string;
    effective_to: string | null;
    created_at: string;
    updated_at: string;
}

interface PricingRulesResponse {
    success: boolean;
    data: PricingRule[];
    meta: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

interface UtilityCountry {
    code: string;
    name: string;
}

interface UtilityCurrency {
    code: string;
    name: string;
}

interface UtilityResponse<T> {
    success: boolean;
    data: T;
}

interface GetPricingRulesArgs {
    search?: string;
    region?: string;
    status?: string;
    page?: number;
    per_page?: number;
}

export interface AuditLog {
    id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    user_id: number;
    user_name: string;
    old_data: Record<string, any> | null;
    new_data: Record<string, any> | null;
    ip_address: string;
    created_at: string;
}

interface AuditLogsResponse {
    success: boolean;
    data: AuditLog[];
    meta: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

interface GetAuditLogsArgs {
    entity_type?: string;
    action?: string;
    page?: number;
    per_page?: number;
}

export const pricingApi = createApi({
    reducerPath: 'pricingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || '',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['PricingRule', 'AuditLog'],
    endpoints: (builder) => ({
        getPricingRules: builder.query<PricingRulesResponse, GetPricingRulesArgs>({
            query: (params) => ({
                url: '/cpd/v1/admin/pricing',
                params,
            }),
            providesTags: ['PricingRule'],
        }),
        createPricingRule: builder.mutation<PricingRulesResponse, Partial<PricingRule>>({
            query: (body) => ({
                url: '/cpd/v1/admin/pricing',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['PricingRule', 'AuditLog'],
        }),
        updatePricingRule: builder.mutation<PricingRulesResponse, { id: number; data: Partial<PricingRule> }>({
            query: ({ id, data }) => ({
                url: `/cpd/v1/admin/pricing/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['PricingRule', 'AuditLog'],
        }),
        getCountries: builder.query<UtilityResponse<UtilityCountry[]>, void>({
            query: () => '/cpd/v1/admin/countries',
            providesTags: []
        }),
        getCurrencies: builder.query<UtilityResponse<UtilityCurrency[]>, void>({
            query: () => '/cpd/v1/admin/currencies',
        }),
        getRegions: builder.query<UtilityResponse<string[]>, void>({
            query: () => '/cpd/v1/admin/regions',
        }),
        getAuditLogs: builder.query<AuditLogsResponse, GetAuditLogsArgs>({
            query: (params) => ({
                url: '/cpd/v1/admin/audit-log',
                params,
            }),
            providesTags: ['AuditLog'],
        }),
        bulkImportPricing: builder.mutation<{ success: boolean; message: string; rows_processed: number }, FormData>({
            query: (formData) => ({
                url: '/cpd/v1/admin/pricing/bulk-import',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['PricingRule', 'AuditLog'],
        }),
        exportPricing: builder.mutation<string, { format?: 'csv' | 'json' }>({
            query: (params) => ({
                url: '/cpd/v1/admin/pricing/export',
                params,
                responseHandler: (response) => response.text(),
            }),
        }),
    }),
});

export const {
    useGetPricingRulesQuery,
    useCreatePricingRuleMutation,
    useUpdatePricingRuleMutation,
    useGetCountriesQuery,
    useGetCurrenciesQuery,
    useGetRegionsQuery,
    useGetAuditLogsQuery,
    useBulkImportPricingMutation,
    useExportPricingMutation,
} = pricingApi;
