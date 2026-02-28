"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
  useCreatePricingRuleMutation,
  useUpdatePricingRuleMutation,
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetCurrenciesQuery,
  PricingRule
} from "@/lib/store/api/pricingApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const addCountrySchema = z.object({
  country_code: z.string().min(2, "Country is required"),
  region: z.string().min(1, "Type/Region is required"),
  currency: z.string().min(3, "Currency is required"),
  price: z.coerce.number().min(0, "CPD Price must be a positive number"),
  tax_rate: z.coerce.number().min(0, "Tax rate cannot be negative").default(0),
  effective_from: z.date({
    required_error: "Effective date is required",
  }),
})

type AddCountryFormValues = z.infer<typeof addCountrySchema>

interface AddCountryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: PricingRule | null
}

export function AddCountryModal({ open, onOpenChange, initialData }: AddCountryModalProps) {
  const isEditMode = !!initialData;
  const [createPricingRule, { isLoading: isCreating }] = useCreatePricingRuleMutation()
  const [updatePricingRule, { isLoading: isUpdating }] = useUpdatePricingRuleMutation()
  
  const { data: countriesResponse, isLoading: isLoadingCountries } = useGetCountriesQuery()
  const { data: regionsResponse, isLoading: isLoadingRegions } = useGetRegionsQuery()
  const { data: currenciesResponse, isLoading: isLoadingCurrencies } = useGetCurrenciesQuery()

  const countries = countriesResponse?.data || []
  const regions = regionsResponse?.data || []
  const currencies = currenciesResponse?.data || []

  const isFormLoading = isCreating || isUpdating || isLoadingCountries || isLoadingRegions || isLoadingCurrencies;

  const form = useForm<AddCountryFormValues>({
    resolver: zodResolver(addCountrySchema),
    defaultValues: {
      country_code: "",
      region: "",
      currency: "",
      price: 0,
      tax_rate: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          country_code: initialData.country_code,
          region: initialData.region,
          currency: initialData.currency,
          price: initialData.price,
          tax_rate: (initialData.tax_rate ?? 0) * 100, // Convert decimal back to percentage for form
          effective_from: (() => {
            if (!initialData.effective_from) return undefined;
            const date = new Date(initialData.effective_from);
            return isNaN(date.getTime()) ? undefined : date;
          })(),
        });
      } else {
        form.reset({
          country_code: "",
          region: "",
          currency: "",
          price: 0,
          tax_rate: 0,
        });
      }
    }
  }, [open, initialData, form]);

  async function onSubmit(data: AddCountryFormValues) {
    try {
      // The backend API expects these fields, but the UI design omits them.
      // We are passing hardcoded defaults so the API request doesn't fail.
      const payload = {
        ...data,
        tax_rate: (data.tax_rate ?? 0) / 100, // API expects decimal format (e.g. 0.15 for 15%)
        discount_percent: 0,
        is_active: true,
        effective_from: format(data.effective_from, "yyyy-MM-dd"),
      }

      if (isEditMode && initialData) {
        await updatePricingRule({ id: initialData.id, data: payload }).unwrap()
        toast.success("Pricing rule updated successfully!")
      } else {
        await createPricingRule(payload).unwrap()
        toast.success("Pricing rule created successfully!")
      }
      
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} pricing rule.`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-0 gap-0 shadow-lg bg-white rounded-xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-[22px] font-semibold tracking-tight text-gray-900">
            {isEditMode ? "Edit Country Pricing" : "Add New Country"}
          </DialogTitle>
          <p className="text-[15px] text-gray-500 mt-1">
            {isEditMode ? "Update pricing configuration for this region" : "Configure pricing for a new country or region"}
          </p>
        </DialogHeader>

        <div className="px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="country_code"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[14px] font-medium text-gray-700">
                      Country <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormLoading}>
                      <FormControl>
                        <SelectTrigger className="h-11 w-full bg-white border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors">
                          <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select a country"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                           <SelectItem key={country.code} value={country.code}>
                             {country.name}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[14px] font-medium text-gray-700">
                      Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormLoading}>
                      <FormControl>
                        <SelectTrigger className="h-11 w-full bg-white border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors">
                          <SelectValue placeholder={isLoadingRegions ? "Loading..." : "Select a region"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {regions.map((region) => (
                           <SelectItem key={region} value={region}>
                             {region}
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[14px] font-medium text-gray-700">
                      Currency <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormLoading}>
                      <FormControl>
                        <SelectTrigger className="h-11 w-full bg-white border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors">
                          <SelectValue placeholder={isLoadingCurrencies ? "Loading..." : "Select currency"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {currencies.map((currency) => (
                           <SelectItem key={currency.code} value={currency.code}>
                             {currency.name}
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-medium text-gray-700">
                        CPD Price <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" disabled={isFormLoading} {...field} className="h-11 w-full bg-white border-gray-200 text-gray-900 focus-visible:ring-[#00B44B] transition-shadow" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_rate"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-medium text-gray-700">
                        Tax Rate (%)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          disabled={isFormLoading}
                          {...field} 
                          className="h-11 w-full bg-white border-gray-200 text-gray-900 focus-visible:ring-[#00B44B] transition-shadow"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1.5">
                    <FormLabel className="text-[14px] font-medium text-gray-700">
                      Effective Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            disabled={isFormLoading}
                            className={cn(
                              "h-11 w-full pl-3 text-left font-normal border-gray-200 bg-white hover:bg-gray-50 focus-visible:ring-[#00B44B]",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value && !isNaN(new Date(field.value).getTime()) ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-gray-400" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-6 pb-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-11 px-6 font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 rounded-lg"
                  onClick={() => onOpenChange(false)}
                  disabled={isFormLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="h-11 px-6 font-medium bg-[#00B44B] hover:bg-[#009b40] text-white rounded-lg shadow-sm"
                  disabled={isFormLoading}
                >
                  {isEditMode 
                    ? (isUpdating ? "Saving..." : "Save Changes") 
                    : (isCreating ? "Saving..." : "Add Country")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
