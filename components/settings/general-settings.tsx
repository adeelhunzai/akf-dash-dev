"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { useGetGeneralSettingsQuery, useUpdateGeneralSettingsMutation } from "@/lib/store/api/settingsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppDispatch } from "@/lib/store/hooks"
// Removed unused imports - we now rely on cache invalidation to update the header

// Validation schema - make timezone, dateFormat, and language optional
const generalSettingsSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").optional(),
  adminEmail: z.string().email("Invalid email address").optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  language: z.string().optional(),
})

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>

// Comprehensive list of WordPress timezones (matching PHP timezone_identifiers_list)
// This includes the most commonly used timezones from WordPress
const TIMEZONES = [
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  
  // Africa
  { value: 'Africa/Abidjan', label: 'Africa - Abidjan' },
  { value: 'Africa/Accra', label: 'Africa - Accra' },
  { value: 'Africa/Addis_Ababa', label: 'Africa - Addis Ababa' },
  { value: 'Africa/Algiers', label: 'Africa - Algiers' },
  { value: 'Africa/Cairo', label: 'Africa - Cairo' },
  { value: 'Africa/Casablanca', label: 'Africa - Casablanca' },
  { value: 'Africa/Johannesburg', label: 'Africa - Johannesburg' },
  { value: 'Africa/Lagos', label: 'Africa - Lagos' },
  { value: 'Africa/Nairobi', label: 'Africa - Nairobi' },
  { value: 'Africa/Tunis', label: 'Africa - Tunis' },
  
  // America - North
  { value: 'America/New_York', label: 'America - New York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America - Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America - Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America - Los Angeles (Pacific Time)' },
  { value: 'America/Phoenix', label: 'America - Phoenix (Mountain Time - No DST)' },
  { value: 'America/Anchorage', label: 'America - Anchorage (Alaska Time)' },
  { value: 'America/Toronto', label: 'America - Toronto (Eastern Time)' },
  { value: 'America/Vancouver', label: 'America - Vancouver (Pacific Time)' },
  { value: 'America/Mexico_City', label: 'America - Mexico City (Central Time)' },
  { value: 'America/Montreal', label: 'America - Montreal (Eastern Time)' },
  { value: 'America/Detroit', label: 'America - Detroit (Eastern Time)' },
  { value: 'America/Indianapolis', label: 'America - Indianapolis (Eastern Time)' },
  { value: 'America/Halifax', label: 'America - Halifax (Atlantic Time)' },
  
  // America - Central & South
  { value: 'America/Bogota', label: 'America - Bogotá (Colombia)' },
  { value: 'America/Lima', label: 'America - Lima (Peru)' },
  { value: 'America/Caracas', label: 'America - Caracas (Venezuela)' },
  { value: 'America/Santiago', label: 'America - Santiago (Chile)' },
  { value: 'America/Buenos_Aires', label: 'America - Buenos Aires (Argentina)' },
  { value: 'America/Sao_Paulo', label: 'America - São Paulo (Brazil)' },
  { value: 'America/Rio_de_Janeiro', label: 'America - Rio de Janeiro (Brazil)' },
  
  // Asia - Middle East
  { value: 'Asia/Dubai', label: 'Asia - Dubai (UAE)' },
  { value: 'Asia/Kuwait', label: 'Asia - Kuwait' },
  { value: 'Asia/Riyadh', label: 'Asia - Riyadh (Saudi Arabia)' },
  { value: 'Asia/Tehran', label: 'Asia - Tehran (Iran)' },
  { value: 'Asia/Baghdad', label: 'Asia - Baghdad (Iraq)' },
  { value: 'Asia/Jerusalem', label: 'Asia - Jerusalem (Israel)' },
  { value: 'Asia/Beirut', label: 'Asia - Beirut (Lebanon)' },
  { value: 'Asia/Amman', label: 'Asia - Amman (Jordan)' },
  
  // Asia - South & Central
  { value: 'Asia/Kabul', label: 'Asia - Kabul (Afghanistan)' },
  { value: 'Asia/Karachi', label: 'Asia - Karachi (Pakistan)' },
  { value: 'Asia/Kolkata', label: 'Asia - Kolkata (India)' },
  { value: 'Asia/Dhaka', label: 'Asia - Dhaka (Bangladesh)' },
  { value: 'Asia/Colombo', label: 'Asia - Colombo (Sri Lanka)' },
  { value: 'Asia/Kathmandu', label: 'Asia - Kathmandu (Nepal)' },
  
  // Asia - Southeast
  { value: 'Asia/Bangkok', label: 'Asia - Bangkok (Thailand)' },
  { value: 'Asia/Singapore', label: 'Asia - Singapore' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia - Kuala Lumpur (Malaysia)' },
  { value: 'Asia/Jakarta', label: 'Asia - Jakarta (Indonesia)' },
  { value: 'Asia/Manila', label: 'Asia - Manila (Philippines)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia - Ho Chi Minh (Vietnam)' },
  
  // Asia - East
  { value: 'Asia/Hong_Kong', label: 'Asia - Hong Kong' },
  { value: 'Asia/Shanghai', label: 'Asia - Shanghai (China)' },
  { value: 'Asia/Beijing', label: 'Asia - Beijing (China)' },
  { value: 'Asia/Taipei', label: 'Asia - Taipei (Taiwan)' },
  { value: 'Asia/Tokyo', label: 'Asia - Tokyo (Japan)' },
  { value: 'Asia/Seoul', label: 'Asia - Seoul (South Korea)' },
  { value: 'Asia/Pyongyang', label: 'Asia - Pyongyang (North Korea)' },
  
  // Europe - Western
  { value: 'Europe/London', label: 'Europe - London (UK)' },
  { value: 'Europe/Lisbon', label: 'Europe - Lisbon (Portugal)' },
  { value: 'Europe/Dublin', label: 'Europe - Dublin (Ireland)' },
  { value: 'Europe/Paris', label: 'Europe - Paris (France)' },
  { value: 'Europe/Brussels', label: 'Europe - Brussels (Belgium)' },
  { value: 'Europe/Amsterdam', label: 'Europe - Amsterdam (Netherlands)' },
  { value: 'Europe/Luxembourg', label: 'Europe - Luxembourg' },
  
  // Europe - Central
  { value: 'Europe/Berlin', label: 'Europe - Berlin (Germany)' },
  { value: 'Europe/Rome', label: 'Europe - Rome (Italy)' },
  { value: 'Europe/Madrid', label: 'Europe - Madrid (Spain)' },
  { value: 'Europe/Vienna', label: 'Europe - Vienna (Austria)' },
  { value: 'Europe/Zurich', label: 'Europe - Zurich (Switzerland)' },
  { value: 'Europe/Prague', label: 'Europe - Prague (Czech Republic)' },
  { value: 'Europe/Warsaw', label: 'Europe - Warsaw (Poland)' },
  { value: 'Europe/Budapest', label: 'Europe - Budapest (Hungary)' },
  { value: 'Europe/Bratislava', label: 'Europe - Bratislava (Slovakia)' },
  
  // Europe - Northern
  { value: 'Europe/Stockholm', label: 'Europe - Stockholm (Sweden)' },
  { value: 'Europe/Oslo', label: 'Europe - Oslo (Norway)' },
  { value: 'Europe/Copenhagen', label: 'Europe - Copenhagen (Denmark)' },
  { value: 'Europe/Helsinki', label: 'Europe - Helsinki (Finland)' },
  { value: 'Europe/Riga', label: 'Europe - Riga (Latvia)' },
  { value: 'Europe/Tallinn', label: 'Europe - Tallinn (Estonia)' },
  { value: 'Europe/Vilnius', label: 'Europe - Vilnius (Lithuania)' },
  
  // Europe - Eastern & Southern
  { value: 'Europe/Athens', label: 'Europe - Athens (Greece)' },
  { value: 'Europe/Bucharest', label: 'Europe - Bucharest (Romania)' },
  { value: 'Europe/Sofia', label: 'Europe - Sofia (Bulgaria)' },
  { value: 'Europe/Istanbul', label: 'Europe - Istanbul (Turkey)' },
  { value: 'Europe/Kiev', label: 'Europe - Kiev (Ukraine)' },
  { value: 'Europe/Moscow', label: 'Europe - Moscow (Russia)' },
  { value: 'Europe/Minsk', label: 'Europe - Minsk (Belarus)' },
  
  // Australia/Oceania
  { value: 'Australia/Sydney', label: 'Australia - Sydney' },
  { value: 'Australia/Melbourne', label: 'Australia - Melbourne' },
  { value: 'Australia/Brisbane', label: 'Australia - Brisbane' },
  { value: 'Australia/Perth', label: 'Australia - Perth' },
  { value: 'Australia/Adelaide', label: 'Australia - Adelaide' },
  { value: 'Australia/Darwin', label: 'Australia - Darwin' },
  { value: 'Pacific/Auckland', label: 'Pacific - Auckland (New Zealand)' },
  { value: 'Pacific/Honolulu', label: 'Pacific - Honolulu (Hawaii)' },
  { value: 'Pacific/Fiji', label: 'Pacific - Fiji' },
]

// WordPress date formats (complete list matching WordPress General Settings)
// These are all the date formats WordPress supports in its settings
const DATE_FORMATS = [
  { value: 'F j, Y', label: 'F j, Y - December 6, 2025', preview: 'December 6, 2025' },
  { value: 'Y-m-d', label: 'Y-m-d - 2025-12-06', preview: '2025-12-06' },
  { value: 'm/d/Y', label: 'm/d/Y - 12/06/2025', preview: '12/06/2025' },
  { value: 'd/m/Y', label: 'd/m/Y - 06/12/2025', preview: '06/12/2025' },
  { value: 'd.m.Y', label: 'd.m.Y - 06.12.2025', preview: '06.12.2025' },
  { value: 'j F Y', label: 'j F Y - 6 December 2025', preview: '6 December 2025' },
  { value: 'Y/m/d', label: 'Y/m/d - 2025/12/06', preview: '2025/12/06' },
  { value: 'F j, Y g:i a', label: 'F j, Y g:i a - December 6, 2025 3:45 pm', preview: 'December 6, 2025 3:45 pm' },
  { value: 'F j, Y G:i', label: 'F j, Y G:i - December 6, 2025 15:45', preview: 'December 6, 2025 15:45' },
  { value: 'Y-m-d H:i:s', label: 'Y-m-d H:i:s - 2025-12-06 15:45:30', preview: '2025-12-06 15:45:30' },
  { value: 'm/d/Y g:i a', label: 'm/d/Y g:i a - 12/06/2025 3:45 pm', preview: '12/06/2025 3:45 pm' },
  { value: 'd/m/Y g:i a', label: 'd/m/Y g:i a - 06/12/2025 3:45 pm', preview: '06/12/2025 3:45 pm' },
  { value: 'l, F j, Y', label: 'l, F j, Y - Saturday, December 6, 2025', preview: 'Saturday, December 6, 2025' },
  { value: 'D, M j, Y', label: 'D, M j, Y - Sat, Dec 6, 2025', preview: 'Sat, Dec 6, 2025' },
]

// WordPress languages (complete list - using WordPress locale codes directly)
// This matches all languages available in WordPress General Settings
const LANGUAGES = [
  { value: 'en_US', label: 'English (United States)' },
  { value: 'en_GB', label: 'English (United Kingdom)' },
  { value: 'en_CA', label: 'English (Canada)' },
  { value: 'en_AU', label: 'English (Australia)' },
  { value: 'en_NZ', label: 'English (New Zealand)' },
  { value: 'es_ES', label: 'Spanish (Spain)' },
  { value: 'es_MX', label: 'Spanish (Mexico)' },
  { value: 'es_AR', label: 'Spanish (Argentina)' },
  { value: 'es_CO', label: 'Spanish (Colombia)' },
  { value: 'es_CL', label: 'Spanish (Chile)' },
  { value: 'es_PE', label: 'Spanish (Peru)' },
  { value: 'es_VE', label: 'Spanish (Venezuela)' },
  { value: 'fr_FR', label: 'French (France)' },
  { value: 'fr_CA', label: 'French (Canada)' },
  { value: 'fr_BE', label: 'French (Belgium)' },
  { value: 'fr_CH', label: 'French (Switzerland)' },
  { value: 'de_DE', label: 'German (Germany)' },
  { value: 'de_AT', label: 'German (Austria)' },
  { value: 'de_CH', label: 'German (Switzerland)' },
  { value: 'it_IT', label: 'Italian (Italy)' },
  { value: 'pt_PT', label: 'Portuguese (Portugal)' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'nl_NL', label: 'Dutch (Netherlands)' },
  { value: 'nl_BE', label: 'Dutch (Belgium)' },
  { value: 'ru_RU', label: 'Russian (Russia)' },
  { value: 'zh_CN', label: 'Chinese (Simplified)' },
  { value: 'zh_TW', label: 'Chinese (Traditional)' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko_KR', label: 'Korean (South Korea)' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi_IN', label: 'Hindi (India)' },
  { value: 'pl_PL', label: 'Polish (Poland)' },
  { value: 'tr_TR', label: 'Turkish (Turkey)' },
  { value: 'sv_SE', label: 'Swedish (Sweden)' },
  { value: 'da_DK', label: 'Danish (Denmark)' },
  { value: 'fi', label: 'Finnish (Finland)' },
  { value: 'no_NO', label: 'Norwegian (Norway)' },
  { value: 'he_IL', label: 'Hebrew (Israel)' },
  { value: 'th', label: 'Thai (Thailand)' },
  { value: 'vi', label: 'Vietnamese (Vietnam)' },
  { value: 'id_ID', label: 'Indonesian (Indonesia)' },
  { value: 'ms_MY', label: 'Malay (Malaysia)' },
  { value: 'cs_CZ', label: 'Czech (Czech Republic)' },
  { value: 'ro_RO', label: 'Romanian (Romania)' },
  { value: 'hu_HU', label: 'Hungarian (Hungary)' },
  { value: 'bg_BG', label: 'Bulgarian (Bulgaria)' },
  { value: 'hr', label: 'Croatian (Croatia)' },
  { value: 'sk_SK', label: 'Slovak (Slovakia)' },
  { value: 'sl_SI', label: 'Slovenian (Slovenia)' },
  { value: 'el', label: 'Greek (Greece)' },
  { value: 'uk', label: 'Ukrainian (Ukraine)' },
  { value: 'be_BY', label: 'Belarusian (Belarus)' },
  { value: 'sr_RS', label: 'Serbian (Serbia)' },
  { value: 'mk_MK', label: 'Macedonian (North Macedonia)' },
  { value: 'sq', label: 'Albanian (Albania)' },
  { value: 'et', label: 'Estonian (Estonia)' },
  { value: 'lv', label: 'Latvian (Latvia)' },
  { value: 'lt_LT', label: 'Lithuanian (Lithuania)' },
  { value: 'is_IS', label: 'Icelandic (Iceland)' },
  { value: 'ga', label: 'Irish (Ireland)' },
  { value: 'cy', label: 'Welsh (Wales)' },
  { value: 'ca', label: 'Catalan (Spain)' },
  { value: 'eu', label: 'Basque (Spain)' },
  { value: 'gl_ES', label: 'Galician (Spain)' },
  { value: 'af', label: 'Afrikaans (South Africa)' },
  { value: 'sw', label: 'Swahili' },
  { value: 'zu', label: 'Zulu (South Africa)' },
  { value: 'xh', label: 'Xhosa (South Africa)' },
  { value: 'bn_BD', label: 'Bengali (Bangladesh)' },
  { value: 'ta_IN', label: 'Tamil (India)' },
  { value: 'te', label: 'Telugu (India)' },
  { value: 'mr', label: 'Marathi (India)' },
  { value: 'gu', label: 'Gujarati (India)' },
  { value: 'kn', label: 'Kannada (India)' },
  { value: 'ml_IN', label: 'Malayalam (India)' },
  { value: 'pa_IN', label: 'Punjabi (India)' },
  { value: 'si_LK', label: 'Sinhala (Sri Lanka)' },
  { value: 'my_MM', label: 'Myanmar (Burmese)' },
  { value: 'km', label: 'Khmer (Cambodia)' },
  { value: 'lo', label: 'Lao (Laos)' },
  { value: 'ka_GE', label: 'Georgian (Georgia)' },
  { value: 'hy', label: 'Armenian (Armenia)' },
  { value: 'az', label: 'Azerbaijani (Azerbaijan)' },
  { value: 'kk', label: 'Kazakh (Kazakhstan)' },
  { value: 'ky', label: 'Kyrgyz (Kyrgyzstan)' },
  { value: 'uz_UZ', label: 'Uzbek (Uzbekistan)' },
  { value: 'mn', label: 'Mongolian (Mongolia)' },
  { value: 'ne_NP', label: 'Nepali (Nepal)' },
  { value: 'si', label: 'Sinhala' },
  { value: 'ur', label: 'Urdu (Pakistan)' },
  { value: 'fa_IR', label: 'Persian (Iran)' },
  { value: 'ps', label: 'Pashto (Afghanistan)' },
]

// Helper function to get language label from code
const getLanguageLabel = (languageCode: string | undefined): string => {
  if (!languageCode) return "en_US"
  const language = LANGUAGES.find(lang => lang.value === languageCode)
  return language ? languageCode : "en_US"
}

export default function GeneralSettings() {
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [timezoneValue, setTimezoneValue] = useState<string>("UTC")
  const [dateFormatValue, setDateFormatValue] = useState<string>("m/d/Y")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, error } = useGetGeneralSettingsQuery()
  const [updateSettings, { isLoading: isUpdating }] = useUpdateGeneralSettingsMutation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      organizationName: "Aga Khan Foundation",
      adminEmail: "admin@akf.org",
      timezone: "UTC",
      dateFormat: "m/d/Y",
      language: "en_US",
    },
  })

  // Helper function to validate and get timezone value
  const getValidTimezone = (timezone: string | undefined): string => {
    if (!timezone) return "UTC"
    // Handle escaped slashes from JSON (e.g., "Europe\/Lisbon" -> "Europe/Lisbon")
    const normalizedTimezone = timezone.replace(/\\\//g, '/')
    // Check if the timezone exists in our TIMEZONES array
    const exists = TIMEZONES.some(tz => tz.value === normalizedTimezone)
    // Return the normalized timezone even if not in our list (WordPress might have more timezones)
    // This allows it to be displayed even if not in our dropdown
    return normalizedTimezone || "UTC"
  }

  // Helper function to validate and get date format value
  const getValidDateFormat = (dateFormat: string | undefined): string => {
    if (!dateFormat) return "m/d/Y"
    // Handle escaped slashes from JSON (e.g., "d\/m\/Y" -> "d/m/Y")
    const normalizedDateFormat = dateFormat.replace(/\\\//g, '/')
    // Check if the date format exists in our DATE_FORMATS array
    const exists = DATE_FORMATS.some(df => df.value === normalizedDateFormat)
    return exists ? normalizedDateFormat : "m/d/Y"
  }

  // Debug: Log state changes
  useEffect(() => {
    console.log('Timezone value state:', timezoneValue)
  }, [timezoneValue])
  
  useEffect(() => {
    console.log('Date format value state:', dateFormatValue)
  }, [dateFormatValue])

  // Load settings from API
  useEffect(() => {
    if (data?.data) {
      const settings = data.data
      const validTimezone = getValidTimezone(settings.timezone)
      const validDateFormat = getValidDateFormat(settings.dateFormat)
      
      // Log for debugging
      console.log('Loading settings:', {
        rawTimezone: settings.timezone,
        validTimezone,
        timezoneExists: TIMEZONES.some(tz => tz.value === validTimezone),
        timezoneLabel: TIMEZONES.find(tz => tz.value === validTimezone)?.label,
        rawDateFormat: settings.dateFormat,
        validDateFormat,
        dateFormatExists: DATE_FORMATS.some(df => df.value === validDateFormat)
      })
      
      // Update state variables FIRST to ensure Select components update immediately
      // Force update by clearing and setting
      if (timezoneValue !== validTimezone) {
        setTimezoneValue(validTimezone)
      }
      if (dateFormatValue !== validDateFormat) {
        setDateFormatValue(validDateFormat)
      }
      
      // Reset form with validated values
      reset({
        organizationName: settings.organisationName || "Aga Khan Foundation",
        adminEmail: settings.adminEmail || "admin@akf.org",
        timezone: validTimezone,
        dateFormat: validDateFormat,
        language: getLanguageLabel(settings.language || ""),
      }, {
        keepDefaultValues: false
      })
      
      if (settings.profilePicture) {
        setProfilePicture(settings.profilePicture)
      }
    }
  }, [data, reset])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file")
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result as string)
        toast.success("Profile picture uploaded successfully")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePicture = () => {
    setProfilePicture(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.info("Profile picture removed")
  }

  const onSubmit = async (formData: GeneralSettingsFormData) => {
    try {
      const updateData: any = {}

      // Only include fields that are provided and not empty
      if (formData.organizationName) {
        updateData.organisationName = formData.organizationName
      }
      if (formData.adminEmail) {
        updateData.adminEmail = formData.adminEmail
      }
      if (formData.timezone) {
        // Use WordPress timezone identifier directly
        updateData.timezone = formData.timezone
      }
      if (formData.dateFormat) {
        // Use WordPress date format directly
        updateData.dateFormat = formData.dateFormat
      }
      if (formData.language) {
        // Use WordPress language code directly (e.g., 'en_US', 'es_ES', etc.)
        updateData.language = formData.language
      }

      // Check if profile picture is being updated
      const currentProfilePicture = data?.data?.profilePicture || null
      const isProfilePictureChanged = profilePicture !== currentProfilePicture
      
      // Only include profile picture if it's changed
      if (isProfilePictureChanged) {
        if (profilePicture !== null) {
          // User uploaded a new picture (base64 string)
          updateData.profilePicture = profilePicture
        } else {
          // User removed the picture
          updateData.profilePicture = null
        }
      }

      const response = await updateSettings(updateData).unwrap()
      
      // If profile picture was in the update, update local state
      // The GeneralSettings cache invalidation will automatically trigger
      // AuthInitializer to refetch and update the user avatar in the header
      if ('profilePicture' in updateData) {
        // Get the new avatar URL from response (server returns the URL, not base64)
        const newAvatarUrl = response?.data?.profilePicture || null
        
        // Update local state to keep it in sync
        setProfilePicture(newAvatarUrl)
        
        // Note: The GeneralSettings cache is automatically invalidated by the mutation,
        // which will cause AuthInitializer to refetch and update the user avatar
      }
      
      toast.success("Settings saved successfully!")
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save settings")
    }
  }

  const handleCancel = () => {
    // Reset form to API values
    if (data?.data) {
      const settings = data.data
      reset({
        organizationName: settings.organisationName || "Aga Khan Foundation",
        adminEmail: settings.adminEmail || "admin@akf.org",
        timezone: settings.timezone || "UTC",
        dateFormat: settings.dateFormat || "m/d/Y",
        language: getLanguageLabel(settings.language || ""),
      })
      if (settings.profilePicture) {
        setProfilePicture(settings.profilePicture)
      } else {
        setProfilePicture(null)
      }
    } else {
      // Fallback to defaults
      setValue("organizationName", "Aga Khan Foundation")
      setValue("adminEmail", "admin@akf.org")
      setValue("timezone", "UTC")
      setValue("dateFormat", "m/d/Y")
      setValue("language", "english")
      setProfilePicture(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.info("Changes cancelled")
  }

  // Get first letter of organization name for default avatar
  const getInitials = () => {
    const orgName = watch("organizationName") || "Aga Khan Foundation"
    return orgName.charAt(0).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading settings. Please try again later.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organisation Name</Label>
          <Input
            id="organizationName"
            {...register("organizationName")}
            placeholder="Enter organisation name"
            className={errors.organizationName ? "border-red-500" : ""}
          />
          {errors.organizationName && (
            <p className="text-sm text-red-500">{errors.organizationName.message}</p>
          )}
        </div>

        {/* Administrator Email */}
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Administrator Email</Label>
          <Input
            id="adminEmail"
            type="email"
            {...register("adminEmail")}
            placeholder="Enter administrator email"
            className={errors.adminEmail ? "border-red-500" : ""}
          />
          {errors.adminEmail && <p className="text-sm text-red-500">{errors.adminEmail.message}</p>}
        </div>

        {/* Default Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Default Timezone</Label>
          <Select 
            key={`tz-${timezoneValue}`}
            value={timezoneValue || undefined} 
            onValueChange={(value) => {
              console.log('Timezone changed:', value)
              setTimezoneValue(value)
              setValue("timezone", value, { shouldDirty: true })
            }}
          >
            <SelectTrigger id="timezone" className={errors.timezone ? "border-red-500" : "w-full"}>
              <SelectValue placeholder="Select timezone">
                {TIMEZONES.find(tz => tz.value === timezoneValue)?.label || timezoneValue || "Select timezone"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timezone && <p className="text-sm text-red-500">{errors.timezone.message}</p>}
        </div>

        {/* Date Format */}
        <div className="space-y-2">
          <Label htmlFor="dateFormat">Date Format</Label>
          <Select 
            key={`df-${dateFormatValue}`}
            value={dateFormatValue || undefined} 
            onValueChange={(value) => {
              console.log('Date format changed:', value)
              setDateFormatValue(value)
              setValue("dateFormat", value, { shouldDirty: true })
            }}
          >
            <SelectTrigger id="dateFormat" className={errors.dateFormat ? "border-red-500" : "w-full"}>
              <SelectValue placeholder="Select date format">
                {DATE_FORMATS.find(df => df.value === dateFormatValue)?.label || dateFormatValue || "Select date format"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="start" 
              sideOffset={4}
              collisionPadding={{ top: 8, bottom: 8 }}
              avoidCollisions={true}
              className="max-h-[200px]"
            >
              {DATE_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.dateFormat && <p className="text-sm text-red-500">{errors.dateFormat.message}</p>}
        </div>

        {/* Default Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Default Language</Label>
          <Select 
            value={watch("language") || "en_US"} 
            onValueChange={(value) => setValue("language", value, { shouldDirty: true })}
          >
            <SelectTrigger id="language" className={errors.language ? "border-red-500" : "w-full"}>
              <SelectValue placeholder="Select language">
                {LANGUAGES.find(lang => lang.value === watch("language"))?.label || watch("language") || "Select language"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent 
              position="popper" 
              side="bottom" 
              align="start" 
              sideOffset={4}
              collisionPadding={{ top: 8, bottom: 8 }}
              avoidCollisions={true}
              className="max-h-[200px]"
            >
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.language && <p className="text-sm text-red-500">{errors.language.message}</p>}
        </div>
      </div>

      {/* Profile Picture Section */}
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[#16a34a] flex items-center justify-center text-white text-3xl font-semibold">
                {getInitials()}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="profile-picture-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-gray-200"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Picture
              </Button>
            </div>
            {profilePicture && (
              <button
                type="button"
                onClick={handleRemovePicture}
                className="text-sm text-red-600 hover:text-red-700 text-left"
              >
                Remove Picture
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={!isDirty && !profilePicture}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-[#16a34a] text-white hover:bg-[#15803d]"
          disabled={(!isDirty && !profilePicture) || isUpdating}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
