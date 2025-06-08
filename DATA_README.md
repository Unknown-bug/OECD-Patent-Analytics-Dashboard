# Data Structure for OECD Patent Dashboard

## 📁 File Organization

The preprocessed OECD patent data is organized as follows:

```
my-app/
├── data/                          # Source data (backup/reference)
│   ├── authority_aggregation.csv
│   ├── country_year_aggregation.csv
│   ├── pivot_country_year.csv
│   ├── processed_raw_data.csv
│   ├── technology_aggregation.csv
│   ├── tidy_data.csv
│   ├── preprocessing_summary.md
│   └── preprocessing_log.txt
├── public/data/                   # Web-accessible data files
│   ├── authority_aggregation.csv
│   ├── country_year_aggregation.csv
│   ├── pivot_country_year.csv
│   ├── processed_raw_data.csv
│   ├── technology_aggregation.csv
│   └── tidy_data.csv
└── app/
    └── page.tsx                   # Main dashboard component
```

## 🔄 How Data Loading Works

The dashboard (`app/page.tsx`) loads data using client-side fetching:

```typescript
const [countryYearRes, technologyRes, tidyRes, authorityRes] = await Promise.all([
  fetch("/data/country_year_aggregation.csv"),
  fetch("/data/technology_aggregation.csv"),
  fetch("/data/tidy_data.csv"),
  fetch("/data/authority_aggregation.csv"),
])
```

## 📊 Data Files Description

| File | Purpose | Records | Description |
|------|---------|---------|-------------|
| `country_year_aggregation.csv` | Time series analysis | 210 | Country-year patent totals and statistics |
| `technology_aggregation.csv` | Technology analysis | 106 | Patent counts by technology domain |
| `tidy_data.csv` | Clean analysis data | 584 | Normalized dataset following tidy principles |
| `authority_aggregation.csv` | Authority comparison | 522 | Patent counts by patent authority |
| `pivot_country_year.csv` | Cross-tabulation | 106 | Countries × Years matrix |
| `processed_raw_data.csv` | Complete dataset | 584 | Full preprocessed dataset |

## 🚀 Key Features

- **Real-time filtering**: Interactive country, year, and technology filters
- **Cross-chart communication**: Clicking on charts updates other visualizations
- **Responsive design**: Works on desktop and mobile devices
- **Local data loading**: Fast loading from local CSV files
- **Multiple visualizations**: Bar charts, pie charts, area charts, and more

## 🔧 Data Updates

To update the data:

1. Replace CSV files in `/data/` directory
2. Copy updated files to `/public/data/` directory:
   ```bash
   Copy-Item data\*.csv public\data\
   ```
3. Restart the development server

## 📈 Dashboard Capabilities

- **Overview**: Patent trends and top countries
- **Countries**: Country-specific patent analysis
- **Technology**: Technology domain distribution
- **Authorities**: Patent authority comparisons
- **Interactive Controls**: Dynamic filtering and real-time updates

---

**Note**: Files in `/public/data/` are web-accessible, while `/data/` serves as source/backup storage. 