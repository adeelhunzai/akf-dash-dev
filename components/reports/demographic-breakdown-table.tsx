"use client"

import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp } from "lucide-react"

export function DemographicBreakdownTable() {
  const metrics = [
    {
      label: "Total Countries",
      value: "15",
      icon: "🌍",
      bgColor: "bg-green-100",
    },
    {
      label: "Global Sales",
      value: "18,480",
      icon: "📊",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Global Revenue",
      value: "$916,250",
      change: "+12% from last month",
      icon: "💰",
      bgColor: "bg-purple-100",
    },
    {
      label: "Avg Growth",
      value: "20.7%",
      change: "+12% from last month",
      icon: "📈",
      bgColor: "bg-blue-100",
    },
  ]

  const regions = [
    {
      name: "africa",
      countries: "4 countries",
      sales: "3,460",
      revenue: "$186,700",
    },
    {
      name: "asia",
      countries: "4 countries",
      sales: "3,420",
      revenue: "$174,000",
    },
    {
      name: "europe",
      countries: "3 countries",
      sales: "2,050",
      revenue: "$135,900",
    },
    {
      name: "americas",
      countries: "3 countries",
      sales: "4,760",
      revenue: "$255,200",
    },
    {
      name: "oceania",
      countries: "1 countries",
      sales: "890",
      revenue: "$53,400",
    },
  ]

  const topCountries = [
    {
      rank: 1,
      flag: "🇺🇸",
      country: "United States",
      code: "US",
      sales: "2,840",
      revenue: "$142,000",
      growth: "15.2%",
      marketShare: "15%",
    },
    {
      rank: 2,
      flag: "🇮🇳",
      country: "India",
      code: "IN",
      sales: "2,120",
      revenue: "$95,400",
      growth: "28.5%",
      marketShare: "12%",
    },
    {
      rank: 3,
      flag: "🇧🇷",
      country: "Brazil",
      code: "BR",
      sales: "1,890",
      revenue: "$85,050",
      growth: "22.1%",
      marketShare: "10%",
    },
    {
      rank: 4,
      flag: "🇰🇪",
      country: "Kenya",
      code: "KE",
      sales: "1,650",
      revenue: "$66,000",
      growth: "35.8%",
      marketShare: "9%",
    },
    {
      rank: 5,
      flag: "🇬🇧",
      country: "United Kingdom",
      code: "GB",
      sales: "1,420",
      revenue: "$78,100",
      growth: "8.7%",
      marketShare: "8%",
    },
    {
      rank: 6,
      flag: "🇨🇦",
      country: "Canada",
      code: "CA",
      sales: "1,280",
      revenue: "$70,400",
      growth: "18.9%",
      marketShare: "7%",
    },
    {
      rank: 7,
      flag: "🇳🇬",
      country: "Nigeria",
      code: "NG",
      sales: "1,150",
      revenue: "$46,000",
      growth: "42.3%",
      marketShare: "6%",
    },
    {
      rank: 8,
      flag: "🇪🇬",
      country: "Egypt",
      code: "EG",
      sales: "980",
      revenue: "$44,100",
      growth: "31.2%",
      marketShare: "5%",
    },
    {
      rank: 9,
      flag: "🇦🇺",
      country: "Australia",
      code: "AU",
      sales: "890",
      revenue: "$53,400",
      growth: "12.4%",
      marketShare: "5%",
    },
    {
      rank: 10,
      flag: "🇩🇪",
      country: "Germany",
      code: "DE",
      sales: "850",
      revenue: "$51,000",
      growth: "6.8%",
      marketShare: "5%",
    },
  ]

  const userDistribution = [
    { range: "1000+ users", color: "bg-red-600" },
    { range: "500-999 users", color: "bg-orange-500" },
    { range: "200-499 users", color: "bg-purple-600" },
    { range: "100-199 users", color: "bg-blue-600" },
    { range: "< 100 users", color: "bg-green-600" },
  ]

  const globalStats = [
    { label: "Total Countries", value: "45" },
    { label: "Active Regions", value: "8" },
    { label: "Total Users", value: "2,847" },
    { label: "Growth Rate", value: "+12.5%" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Demographic Distribution</h3>
        <div className="flex gap-3">
          <Select defaultValue="sales">
            <SelectTrigger className="w-40 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">View by Sales</SelectItem>
              <SelectItem value="revenue">View by Revenue</SelectItem>
              <SelectItem value="users">View by Users</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-40 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="africa">Africa</SelectItem>
              <SelectItem value="asia">Asia</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
              <SelectItem value="americas">Americas</SelectItem>
              <SelectItem value="oceania">Oceania</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
                {metric.change && <p className="mt-2 text-xs text-green-600">{metric.change}</p>}
              </div>
              <div className={`${metric.bgColor} rounded-lg p-3 text-xl`}>{metric.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Global Distribution Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Map and Legend */}
        <Card className="col-span-1 p-6 lg:col-span-2">
          <h4 className="mb-4 text-lg font-semibold text-foreground">Global Distribution - Sales</h4>

          {/* Static Map Container */}
          <div className="mb-6 flex h-80 items-center justify-center rounded-lg bg-gray-100">
            <div className="text-center">
              <div className="text-4xl">🌍</div>
              <p className="mt-2 text-sm text-gray-600">Interactive world map with regional distribution</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm">📍 United Kingdom: 456 users</p>
                <p className="text-sm">📍 United States: 1,708 users</p>
                <p className="text-sm">📍 India: 342 users</p>
                <p className="text-sm">📍 Brazil: 162 users</p>
                <p className="text-sm">📍 Australia: 189 users</p>
              </div>
            </div>
          </div>

          {/* User Distribution Legend */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="mb-3 text-sm font-semibold text-foreground">User Distribution</h5>
              <div className="space-y-2">
                {userDistribution.map((dist, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`${dist.color} h-3 w-3 rounded-full`} />
                    <span className="text-xs text-muted-foreground">{dist.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Statistics */}
            <div>
              <h5 className="mb-3 text-sm font-semibold text-foreground">Global Statistics</h5>
              <div className="space-y-2">
                {globalStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="font-semibold text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Regional Overview */}
        <Card className="p-6">
          <h4 className="mb-4 text-lg font-semibold text-foreground">Regional Overview</h4>
          <div className="space-y-4">
            {regions.map((region, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <p className="font-medium capitalize text-foreground">{region.name}</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>{region.countries}</p>
                  <div className="flex justify-between">
                    <span>Sales: {region.sales}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: "75%" }} />
                  </div>
                  <p>Revenue: {region.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Countries Table */}
      <Card className="p-6">
        <h4 className="mb-4 text-lg font-semibold text-foreground">Top Countries by Sales</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Country</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Sales</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Revenue</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Growth</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Market Share</th>
              </tr>
            </thead>
            <tbody>
              {topCountries.map((country) => (
                <tr key={country.rank} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                      {country.rank}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <div>
                        <p className="font-medium text-foreground">{country.country}</p>
                        <p className="text-xs text-muted-foreground">{country.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{country.sales}</td>
                  <td className="px-4 py-3 text-right text-foreground">{country.revenue}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      {country.growth}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-green-600"
                          style={{ width: `${Number.parseInt(country.marketShare)}%` }}
                        />
                      </div>
                      <span className="text-foreground">{country.marketShare}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
