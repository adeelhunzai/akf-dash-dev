"use client";

import Image from "next/image";

interface LocationMarkerProps {
  country: string;
  users: string;
  color: string;
  position: { top: string; left: string };
}

function LocationMarker({
  country,
  users,
  color,
  position,
}: LocationMarkerProps) {
  return (
    <div
      className="absolute flex items-center  z-10 gap-2"
      style={{ top: position.top, left: position.left }}
    >
      <div className="relative w-[14.23px] h-[14.24px] flex-shrink-0 flex items-center justify-center">
        <div
          className="absolute w-full h-full rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="absolute w-[4.75px] h-[4.75px] rounded-full bg-white" />
      </div>
      <div className="text-[8px] bg-white rounded-lg shadow-md px-3 py-2">
        <div className="font-[8px] text-foreground whitespace-nowrap">
          {country}
        </div>
        <div className="text-[7.5px] text-muted-foreground">{users}</div>
      </div>
    </div>
  );
}

export default function UserDistributionChart() {
  const locations = [
    {
      country: "United Kingdom",
      users: "450 users",
      color: "#c4a2ea",
      position: { top: "11%", left: "23%" },
    },
    {
      country: "United States",
      users: "1,700 users",
      color: "#cd1d5a",
      position: { top: "25%", left: "2%" },
    },
    {
      country: "India",
      users: "342 users",
      color: "#fc664d",
      position: { top: "45%", left: "46%" },
    },
    {
      country: "Brazil",
      users: "205 users",
      color: "#00b140",
      position: { top: "62%", left: "29%" },
    },
    {
      country: "Australia",
      users: "168 users",
      color: "#1275db",
      position: { top: "69%", left: "77%" },
    },
  ];

  const userRanges = [
    { label: "1000+ users", color: "#cd1d5a" },
    { label: "500-999 users", color: "#fc664d" },
    { label: "200-499 users", color: "#c4a2ea" },
    { label: "100-199 users", color: "#1275db" },
    { label: "<100 users", color: "#00b140" },
  ];

  return (
    <div className="w-full inspect-[530px/296px]">
      {/* World Map with Overlays */}
      <div className="relative bg-gray-50 rounded-lg h-64 md:h-72 lg:h-80 overflow-hidden">
        {/* World Map Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/world-map.png"
            alt="World Map"
            fill
            className=" opacity-30"
            priority
          />
        </div>

        {/* Location Markers */}
        {locations.map((location, index) => (
          <LocationMarker
            key={index}
            country={location.country}
            users={location.users}
            color={location.color}
            position={location.position}
          />
        ))}

        {/* User Distribution Legend - Bottom Left */}
        <div className="absolute bottom-2 left-2 bg-white border border-gray-200 rounded-lg p-2 shadow-md z-20 max-w-[180px]">
          <h4 className="font-semibold text-[8px] mb-2">User Distribution</h4>
          <div className="space-y-0.5">
            {userRanges.map((range, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative w-[9.49px] h-[9.48px] rounded-full flex items-center justify-center">
                  <div
                    className="absolute w-full h-full rounded-full"
                    style={{ backgroundColor: range.color }}
                  />
                  <div className="absolute w-[3.55px] h-[3.56px] min-w-[3.55px] min-h-[3.56px] rounded-full bg-white" />
                </div>
                <span className="text-[7.5px] text-muted-foreground whitespace-nowrap">
                  {range.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Statistics - Top Right */}
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-md z-20 min-w-[160px]">
          <h4 className="font-semibold text-xs mb-2">Global Statistics</h4>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Total Countries:</span>
              <span className="font-semibold">45</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Active Regions:</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Total Users:</span>
              <span className="font-semibold">2,847</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Growth Rate:</span>
              <span className="font-semibold text-green-600">+12.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
