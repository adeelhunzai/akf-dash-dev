import PricingManagementContent from '@/components/admin/pricing/pricing-management-content';

export default function PricingManagementPage() {
  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
      <div className="space-y-6">
        <PricingManagementContent />
      </div>
    </div>
  );
}
