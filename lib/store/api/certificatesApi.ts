import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import {
    CPDCertificatesResponse,
    CPDCheckoutSessionResponse,
} from '@/lib/types/cpd-certificate.types';

export const certificatesApi = createApi({
    reducerPath: 'certificatesApi',
    baseQuery: createWordpressBaseQuery('token'),
    tagTypes: ['CPDCertificates'],
    endpoints: (build) => ({
        // Get all certificates (enhanced data from CPD plugin)
        getCPDCertificates: build.query<CPDCertificatesResponse, void>({
            query: () => '/cpd/v1/user/certificates',
            providesTags: ['CPDCertificates'],
            keepUnusedDataFor: 300,
        }),

        // Create Stripe Checkout Session for purchasing a CPD certificate
        createCheckoutSession: build.mutation<
            CPDCheckoutSessionResponse,
            { course_id: number }
        >({
            query: (body) => ({
                url: '/cpd/v1/user/checkout',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['CPDCertificates'],
        }),
    }),
});

export const {
    useGetCPDCertificatesQuery,
    useCreateCheckoutSessionMutation,
} = certificatesApi;
