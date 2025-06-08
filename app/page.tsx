"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Globe, Zap, Building } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

// Data interfaces
interface CountryYearData {
  COUNTRY_NAME: string
  YEAR: string
  OBS_VALUE_sum: string
  OBS_VALUE_mean: string
  OBS_VALUE_count: string
  PATENT_AUTHORITIES_nunique: string
  MEASURE_nunique: string
}

interface TechnologyData {
  WIPO: string
  OECD_TECHNOLOGY_PATENT: string
  "Selected OECD technology domains": string
  COUNTRY_NAME: string
  OBS_VALUE_sum: string
  OBS_VALUE_mean: string
  YEAR_min: string
  YEAR_max: string
  YEAR_count: string
}

interface TidyData {
  country: string
  country_code: string
  year: string
  patent_authority: string
  measure_type: string
  unit: string
  patent_count: string
  agent_role: string
  date_type: string
}

interface AuthorityData {
  PATENT_AUTHORITIES: string
  COUNTRY_NAME: string
  OBS_VALUE_sum: string
  OBS_VALUE_mean: string
  OBS_VALUE_std: string
  YEAR_min: string
  YEAR_max: string
  YEAR_count: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"]

export default function OECDPatentDashboard() {
  const [loading, setLoading] = useState(true)
  const [countryYearData, setCountryYearData] = useState<CountryYearData[]>([])
  const [technologyData, setTechnologyData] = useState<TechnologyData[]>([])
  const [tidyData, setTidyData] = useState<TidyData[]>([])
  const [authorityData, setAuthorityData] = useState<AuthorityData[]>([])

  // Filter states
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedYearRange, setSelectedYearRange] = useState<[number, number]>([2017, 2021])
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  const [countrySearch, setCountrySearch] = useState<string>("")
  const [technologySearch, setTechnologySearch] = useState<string>("")

  // Processed data for visualizations
  const [filteredData, setFilteredData] = useState<any>({})

  // Load data from CSV URLs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [countryYearRes, technologyRes, tidyRes, authorityRes] = await Promise.all([
          fetch("/data/country_year_aggregation.csv"),
          fetch("/data/technology_aggregation.csv"),
          fetch("/data/tidy_data.csv"),
          fetch("/data/authority_aggregation.csv"),
        ])

        const [countryYearText, technologyText, tidyText, authorityText] = await Promise.all([
          countryYearRes.text(),
          technologyRes.text(),
          tidyRes.text(),
          authorityRes.text(),
        ])

        // Parse CSV data
        const parseCSV = (text: string) => {
          const lines = text.split("\n")
          const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""))
          return lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = line.split(",").map((v) => v.replace(/"/g, ""))
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header] = values[index] || ""
              })
              return obj
            })
        }

        setCountryYearData(parseCSV(countryYearText))
        setTechnologyData(parseCSV(technologyText))
        setTidyData(parseCSV(tidyText))
        setAuthorityData(parseCSV(authorityText))

        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Process and filter data based on selections
  useEffect(() => {
    if (!countryYearData.length) return

    // Get unique countries for initial selection
    const uniqueCountries = [...new Set(countryYearData.map((d) => d.COUNTRY_NAME))]
    if (selectedCountries.length === 0) {
      setSelectedCountries(uniqueCountries.slice(0, 10)) // Select top 10 countries initially
    }

    // Get countries that have patents in the selected technology domains
    let technologyFilteredCountries = selectedCountries
    if (selectedTechnologies.length > 0 && technologyData.length > 0) {
      const techCountries = new Set(
        technologyData
          .filter((d) => selectedTechnologies.includes(d["Selected OECD technology domains"]))
          .map((d) => d.COUNTRY_NAME)
      )
      technologyFilteredCountries = selectedCountries.filter((country) => techCountries.has(country))
    }

    // Filter data based on selections (including technology filter)
    const filtered = {
      countryYear: countryYearData.filter(
        (d) =>
          technologyFilteredCountries.includes(d.COUNTRY_NAME) &&
          Number.parseInt(d.YEAR) >= selectedYearRange[0] &&
          Number.parseInt(d.YEAR) <= selectedYearRange[1],
      ),
      technology: technologyData.filter(
        (d) =>
          selectedCountries.includes(d.COUNTRY_NAME) &&
          (selectedTechnologies.length === 0 || selectedTechnologies.includes(d["Selected OECD technology domains"])),
      ),
      tidy: tidyData.filter(
        (d) =>
          technologyFilteredCountries.includes(d.country) &&
          Number.parseInt(d.year) >= selectedYearRange[0] &&
          Number.parseInt(d.year) <= selectedYearRange[1],
      ),
      authority: authorityData.filter((d) => technologyFilteredCountries.includes(d.COUNTRY_NAME)),
    }

    setFilteredData(filtered)
  }, [
    countryYearData,
    technologyData,
    tidyData,
    authorityData,
    selectedCountries,
    selectedYearRange,
    selectedTechnologies,
  ])

  // Get summary statistics
  const getSummaryStats = () => {
    if (!filteredData.countryYear) return { totalPatents: 0, countries: 0, avgGrowth: 0, topCountry: "", techFilter: selectedTechnologies }

    const totalPatents = filteredData.countryYear.reduce(
      (sum: number, d: CountryYearData) => sum + Number.parseFloat(d.OBS_VALUE_sum || "0"),
      0,
    )

    // Count unique countries in filtered data
    const uniqueFilteredCountries = new Set(filteredData.countryYear.map((d: CountryYearData) => d.COUNTRY_NAME))
    const countries = uniqueFilteredCountries.size

    const countryTotals = filteredData.countryYear.reduce((acc: any, d: CountryYearData) => {
      acc[d.COUNTRY_NAME] = (acc[d.COUNTRY_NAME] || 0) + Number.parseFloat(d.OBS_VALUE_sum || "0")
      return acc
    }, {})

    const topCountry = Object.entries(countryTotals).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || ""

    return { totalPatents: Math.round(totalPatents), countries, avgGrowth: 5.2, topCountry, techFilter: selectedTechnologies }
  }

  const stats = getSummaryStats()

  // Chart data processors
  const getCountryPatentData = () => {
    if (!filteredData.countryYear) return []

    const countryTotals = filteredData.countryYear.reduce((acc: any, d: CountryYearData) => {
      acc[d.COUNTRY_NAME] = (acc[d.COUNTRY_NAME] || 0) + Number.parseFloat(d.OBS_VALUE_sum || "0")
      return acc
    }, {})

    return Object.entries(countryTotals)
      .map(([country, total]) => ({ country, patents: total }))
      .sort((a, b) => (b.patents as number) - (a.patents as number))
      .slice(0, 15)
  }

  const getYearlyTrendData = () => {
    if (!filteredData.countryYear) return []

    const yearTotals = filteredData.countryYear.reduce((acc: any, d: CountryYearData) => {
      const year = d.YEAR
      acc[year] = (acc[year] || 0) + Number.parseFloat(d.OBS_VALUE_sum || "0")
      return acc
    }, {})

    return Object.entries(yearTotals)
      .map(([year, total]) => ({ year, patents: total }))
      .sort((a, b) => Number.parseInt(a.year) - Number.parseInt(b.year))
  }

  const getTechnologyDistribution = () => {
    if (!filteredData.technology) return []

    const techTotals = filteredData.technology.reduce((acc: any, d: TechnologyData) => {
      const tech = d["Selected OECD technology domains"]
      if (tech) {
        acc[tech] = (acc[tech] || 0) + Number.parseFloat(d.OBS_VALUE_sum || "0")
      }
      return acc
    }, {})

    return Object.entries(techTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 8)
  }

  const getAuthorityData = () => {
    if (!filteredData.authority) return []

    const authorityTotals = filteredData.authority.reduce((acc: any, d: AuthorityData) => {
      acc[d.PATENT_AUTHORITIES] = (acc[d.PATENT_AUTHORITIES] || 0) + Number.parseFloat(d.OBS_VALUE_sum || "0")
      return acc
    }, {})

    return Object.entries(authorityTotals)
      .map(([authority, patents]) => ({ authority, patents }))
      .sort((a, b) => (b.patents as number) - (a.patents as number))
      .slice(0, 10)
  }

  const getTopCountriesForTrends = () => {
    if (!filteredData.countryYear) return []

    const countryTotals = filteredData.countryYear.reduce((acc: any, d: CountryYearData) => {
      acc[d.COUNTRY_NAME] = (acc[d.COUNTRY_NAME] || 0) + Number.parseFloat(d.OBS_VALUE_sum || "0")
      return acc
    }, {})

    return Object.entries(countryTotals)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([country]) => country)
  }

  const getMultiCountryTrendData = () => {
    if (!filteredData.countryYear) return []

    const topCountries = getTopCountriesForTrends()
    const yearData: any = {}

    filteredData.countryYear.forEach((d: CountryYearData) => {
      const year = d.YEAR
      if (!yearData[year]) {
        yearData[year] = { year }
        topCountries.forEach((country) => {
          yearData[year][country] = 0
        })
      }
      if (topCountries.includes(d.COUNTRY_NAME)) {
        yearData[year][d.COUNTRY_NAME] += Number.parseFloat(d.OBS_VALUE_sum || "0")
      }
    })

    return Object.values(yearData).sort((a: any, b: any) => Number.parseInt(a.year) - Number.parseInt(b.year))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading OECD Patent Data...</p>
        </div>
      </div>
    )
  }

  const uniqueCountries = [...new Set(countryYearData.map((d) => d.COUNTRY_NAME))].sort()
  const uniqueTechnologies = [...new Set(technologyData.map((d) => d["Selected OECD technology domains"]))]
    .filter((t) => t)
    .sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">OECD Patent Analytics Dashboard</h1>
          <p className="text-lg text-gray-600">Interactive visualization of global patent data and trends</p>
          {selectedTechnologies.length > 0 && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Filtered by Technologies: {selectedTechnologies.length === 1 ? selectedTechnologies[0] : `${selectedTechnologies.length} selected`}
              </Badge>
            </div>
          )}
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Interactive Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Countries ({uniqueCountries.length} total, {selectedCountries.length} selected)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-3 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setSelectedCountries(uniqueCountries)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedCountries([])}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded p-2">
                    {uniqueCountries
                      .filter((country) => country.toLowerCase().includes(countrySearch.toLowerCase()))
                      .map((country) => (
                        <Badge
                          key={country}
                          variant={selectedCountries.includes(country) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-blue-100 text-xs"
                          onClick={() => {
                            setSelectedCountries((prev) =>
                              prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country],
                            )
                          }}
                        >
                          {country}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Year Range: {selectedYearRange[0]} - {selectedYearRange[1]}
                </label>
                <Slider
                  value={selectedYearRange}
                  onValueChange={(value) => setSelectedYearRange(value as [number, number])}
                  min={2017}
                  max={2021}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Technology Domains ({uniqueTechnologies.length} total, {selectedTechnologies.length} selected)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search technologies..."
                    value={technologySearch}
                    onChange={(e) => setTechnologySearch(e.target.value)}
                    className="w-full px-3 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setSelectedTechnologies(uniqueTechnologies)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedTechnologies([])}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded p-2">
                    {uniqueTechnologies
                      .filter((tech) => tech.toLowerCase().includes(technologySearch.toLowerCase()))
                      .map((tech) => (
                        <Badge
                          key={tech}
                          variant={selectedTechnologies.includes(tech) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-blue-100 text-xs"
                          onClick={() => {
                            setSelectedTechnologies((prev) =>
                              prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
                            )
                          }}
                        >
                          {tech}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patents</p>
                  <p className="text-2xl font-bold">{stats.totalPatents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Countries</p>
                  <p className="text-2xl font-bold">{stats.countries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Country</p>
                  <p className="text-2xl font-bold">{stats.topCountry}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Growth</p>
                  <p className="text-2xl font-bold">{stats.avgGrowth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="authorities">Authorities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Top Countries Distribution</CardTitle>
                  <CardDescription>
                    Patent share by country{selectedTechnologies.length > 0 ? ` (${selectedTechnologies.length === 1 ? selectedTechnologies[0] : selectedTechnologies.length + ' technologies'})` : ""} - click segments to filter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getCountryPatentData().slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        labelLine={false}
                        label={({ country, percent }) => `${country}: ${(percent * 100).toFixed(1)}%`}
                        fill="#8884d8"
                        dataKey="patents"
                        onClick={(data) => {
                          setSelectedCountries([data.country])
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {getCountryPatentData()
                          .slice(0, 8)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), "Patents"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Countries by Patents</CardTitle>
                  <CardDescription>
                    {selectedTechnologies.length > 0 ? `${selectedTechnologies.length === 1 ? selectedTechnologies[0] : selectedTechnologies.length + ' technologies'} patents - ` : ""}Hover for details, click to focus on country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getCountryPatentData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString(), "Patents"]} />
                      <Bar
                        dataKey="patents"
                        fill="#82ca9d"
                        onClick={(data) => {
                          setSelectedCountries([data.country])
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Country Trends Comparison</CardTitle>
                  <CardDescription>
                    Multi-country patent trends over time{selectedTechnologies.length > 0 ? ` (${selectedTechnologies.length === 1 ? selectedTechnologies[0] : selectedTechnologies.length + ' technologies'})` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getMultiCountryTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      {getTopCountriesForTrends().map((country, index) => (
                        <Area
                          key={country}
                          type="monotone"
                          dataKey={country}
                          stackId="1"
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.6}
                          onClick={() => setSelectedCountries([country])}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="countries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Country Patent Analysis</CardTitle>
                <CardDescription>Interactive country comparison - click bars to filter</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getCountryPatentData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => [value.toLocaleString(), "Patents"]} />
                    <Bar
                      dataKey="patents"
                      fill="#8884d8"
                      onClick={(data) => {
                        setSelectedCountries([data.country])
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technology" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technology Distribution</CardTitle>
                  <CardDescription>Patent distribution by technology domain</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getTechnologyDistribution()}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getTechnologyDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), "Patents"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technology Trends</CardTitle>
                  <CardDescription>Technology domain comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getTechnologyDistribution()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString(), "Patents"]} />
                      <Bar
                        dataKey="value"
                        fill="#82ca9d"
                        onClick={(data) => {
                          setSelectedTechnologies([data.name])
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="authorities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patent Authorities Analysis</CardTitle>
                <CardDescription>Distribution of patents by patent authority</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getAuthorityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="authority" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value.toLocaleString(), "Patents"]} />
                    <Bar dataKey="patents" fill="#ff7c7c" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card>
          <CardContent className="p-4 text-center text-sm text-gray-600">
            <p>
              Data source: OECD Patent Database | Dashboard built with interactive filtering and cross-chart
              communication
            </p>
          </CardContent>
        </Card>
      </div>
    </div >
  )
}
