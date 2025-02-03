import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Coffee, Search, SlidersHorizontal, Download, Grid, Map } from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { ComposedChart, XAxis, YAxis, Tooltip, Line, Bar, ResponsiveContainer } from 'recharts';
import { rawData } from './data/coffeeData';

const ResponsiveGridLayout = WidthProvider(Responsive);

const originCoordinates = {
  'Ethiopia': [40, 8],
  'Kenya': [38, 0],
  'Colombia': [-74, 4],
  'Brazil': [-55, -10],
  'Guatemala': [-90, 15],
  'Costa Rica': [-84, 10],
  'Honduras': [-86, 15],
  'Indonesia': [120, -5],
  'Vietnam': [108, 14],
  'India': [78, 20],
  'Yemen': [44, 15],
  'Mexico': [-102, 23],
  'Peru': [-75, -10],
  'Rwanda': [30, -2],
  'Burundi': [30, -3],
  'Tanzania': [35, -6],
  'Uganda': [32, 1],
  'Papua New Guinea': [145, -6],
  'El Salvador': [-89, 14],
  'Nicaragua': [-85, 13],
  'Panama': [-80, 9]
};

//coordinates mapping object:
const MapView = ({ data, onCountrySelect, hoveredCountry, setHoveredCountry }) => {
  const uniqueOrigins = useMemo(() => {
    const origins = new Set();
    data.forEach(coffee => {
      if (coffee.origin && originCoordinates[coffee.origin]) {
        origins.add(coffee.origin);
      }
    });
    return Array.from(origins);
  }, [data]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minHeight: '400px',
      position: 'relative',
      backgroundColor: '#f8fafc'
    }}>
      <ComposableMap
        projectionConfig={{ scale: 120 }}
        width={window.innerWidth - 40} // Dynamic width
        height={400}
        style={{ width: '50%' }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies 
            geography="/world-110m.json"
            fill="#EAEAEC"
            stroke="#D6D6DA"
            strokeWidth={0.5}
          >
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: '#EAEAEC',
                      stroke: '#D6D6DA',
                      strokeWidth: 0.5,
                      outline: 'none'
                    },
                    hover: {
                      fill: '#F5F5F5',
                      outline: 'none'
                    },
                    pressed: {
                      fill: '#E5E5E5',
                      outline: 'none'
                    }
                  }}
                />
              ))
            }
          </Geographies>
          {uniqueOrigins.map((origin) => {
            const coords = originCoordinates[origin];
            if (!coords) return null;
            
            const coffeeCount = data.filter(coffee => coffee.origin === origin).length;
            const isHovered = hoveredCountry === origin;
            
            return (
              <Marker 
                key={origin} 
                coordinates={coords}
                style={{ cursor: 'pointer' }}
              >
                <circle 
                  r={Math.min(Math.max(coffeeCount * 2, 4), 12)}
                  fill={isHovered ? '#b45309' : '#d97706'}
                  opacity={isHovered ? 0.9 : 0.7}
                  stroke="#fff"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHoveredCountry(origin)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => onCountrySelect(origin)}
                />
                <title>{`${origin}: ${coffeeCount} coffee${coffeeCount > 1 ? 's' : ''}`}</title>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

const ChartView = ({ data }) => (
  <div style={{ height: '400px' }}>
    <ResponsiveContainer width="50%" height="50%">
      <ComposedChart data={data}>
        <XAxis dataKey="daysOffRoast" label={{ value: 'Days Off Roast', position: 'bottom' }} />
        <YAxis label={{ value: 'Price per gram ($)', angle: -90, position: 'left' }} />
        <Tooltip />
        <Bar dataKey="pricePerGram" fill="#8884d8" name="Price/g" />
        <Line type="monotone" dataKey="current" stroke="#82ca9d" name="Current Amount" />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

const TableView = ({ data, columns }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column.accessor} style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
              {column.Header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((coffee, index) => (
          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
            {columns.map(column => (
              <td key={column.accessor} style={{ padding: '12px' }}>
                {column.accessor === 'pricePerGram' 
                  ? `$${coffee[column.accessor]?.toFixed(2)}` 
                  : coffee[column.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function CoffeeDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [priceRange, setPriceRange] = useState([0, 2]);
  const [viewMode, setViewMode] = useState('grid');
    const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country === selectedCountry ? null : country);
    setFilters(prev => ({
      ...prev,
      origin: country === selectedCountry ? '' : country
    }));
  };

const columns = [
  { Header: 'Detailed Name', accessor: 'name' },
  { Header: 'Country of Origin', accessor: 'origin' },
  { Header: 'Variety', accessor: 'variety' },
  { Header: 'Processing', accessor: 'processing' },
  { Header: 'Roasted', accessor: 'roasted' },
  { Header: 'Opened', accessor: 'opened' },
  { Header: 'Frozen', accessor: 'frozen' },
  { Header: 'Days Off Roast', accessor: 'daysOffRoast' },
  { Header: 'Current [g]', accessor: 'current' },
  { Header: 'Amount Bought [g]', accessor: 'amountBought' },
  { Header: 'Cost [$]', accessor: 'cost' },
  { Header: '$/g', accessor: 'pricePerGram' },
  { Header: 'My Notes', accessor: 'myNotes' },
  { Header: 'Supposed Notes', accessor: 'supposedNotes' },
  { Header: 'Additional Info', accessor: 'additionalInfo' },
  { Header: 'Comments', accessor: 'comments' }
];

//data processing
const coffeeData = useMemo(() => {
  if (!rawData) return [];
  
  return rawData.split('\n')
    .filter(row => row.trim().length > 0)
    .map((row, index) => {
      const columns = row.split(',');
      return {
        id: index,
        name: columns[0]?.trim(),
        origin: columns[1]?.trim(),
        variety: columns[2]?.trim(),
        processing: columns[3]?.trim(),
        roasted: columns[4]?.trim(),
        opened: columns[5]?.trim(),
        frozen: columns[6]?.trim(),
        daysOffRoast: parseInt(columns[7]) || 0,
        current: parseFloat(columns[8]) || 0,
        amountBought: parseFloat(columns[9]) || 0,
        cost: parseFloat(columns[10]?.replace(/[^0-9.]/g, '')) || 0,
        pricePerGram: parseFloat(columns[11]?.replace(/[^0-9.]/g, '')) || 0,
        myNotes: columns[12]?.trim(),
        supposedNotes: columns[13]?.trim(),
        additionalInfo: columns[14]?.trim(),
        comments: columns[15]?.trim()
      };
    })
    .filter(coffee => coffee.name?.length > 0);
}, []);

/% Filtered Data Log %/
const filteredData = useMemo(() => {
    return coffeeData.filter(coffee => {
      const priceMatch = coffee.pricePerGram >= priceRange[0] && coffee.pricePerGram <= priceRange[1];
      
      const filterMatch = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const coffeeValue = coffee[key]?.toString().toLowerCase();
        return coffeeValue?.includes(value.toLowerCase());
      });
      
      const searchMatch = searchTerm === '' || 
        Object.values(coffee).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      return priceMatch && filterMatch && searchMatch;
    });
  }, [coffeeData, priceRange, filters, searchTerm]);

    // Enhanced CSV export with headers
  const exportToCSV = useCallback(() => {
    const csvHeaders = columns.map(c => c.Header).join(',');
    const csvRows = filteredData.map(row => 
      columns.map(col => row[col.accessor]).join(',')
    ).join('\n');
    
    const csv = `${csvHeaders}\n${csvRows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'coffee_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredData, columns]);

  // Price range validation
  const handlePriceChange = (position, value) => {
    const newValue = parseFloat(value) || 0;
    if (position === 'min') {
      setPriceRange([Math.min(newValue, priceRange[1]), priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], Math.max(newValue, priceRange[0])]);
    }
  };

const layouts = {
  lg: [
    { i: 'search', x: 0, y: 0, w: 12, h: 2 },
    { i: 'chart', x: 0, y: 2, w: 6, h: 10 },  // Increased height
    { i: 'map', x: 6, y: 2, w: 6, h: 10 },    // Increased height
    { i: 'table', x: 0, y: 12, w: 12, h: 20 } // Increased height for table
  ]
};

  return (
    <div style={{ padding: '20px', margin: '0 auto',  width: '100vw', 
  boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Coffee /> Ryan's Coffee Archive
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <p style={{ color: '#92400e' }}>Tracking {coffeeData.length} unique coffees</p>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {viewMode === 'grid' ? <Map size={20} /> : <Grid size={20} />}
            {viewMode === 'grid' ? 'Map View' : 'Grid View'}
          </button>
          <button
            onClick={exportToCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#22c55e',
              border: 'none',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <Download size={20} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ position: 'relative', flex: 1, marginRight: '10px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search across all fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 36px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <SlidersHorizontal size={20} /> Filters
          </button>
        </div>

        {showFilters && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '10px',
            marginBottom: '20px'
          }}>
            {columns.map(column => (
              <input
                key={column.accessor}
                type="text"
                placeholder={`Filter ${column.Header}...`}
                value={filters[column.accessor] || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, [column.accessor]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}
              />
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                Price Range ($/g): {priceRange[0].toFixed(2)} - {priceRange[1].toFixed(2)}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                />
                <input
                  type="number"
                  step="0.1"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'grid' ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          style={{ width: '100%' }}
        >
          <div key="chart" style={{ 
            backgroundColor: 'white', 
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: '400px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Price vs Days Off Roast</h3>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData}>
                <XAxis dataKey="daysOffRoast" label={{ value: 'Days Off Roast', position: 'bottom' }} />
                <YAxis label={{ value: 'Price per gram ($)', angle: -90, position: 'left' }} />
                <Tooltip />
                <Bar dataKey="pricePerGram" fill="#8884d8" name="Price/g" />
                <Line type="monotone" dataKey="current" stroke="#82ca9d" name="Current Amount" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div key="map" style={{ 
            backgroundColor: 'white', 
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: '400px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>
            Coffee Origins
            {selectedCountry && ` - Filtered by ${selectedCountry}`}
            </h3>
            <MapView 
    data={filteredData}
    onCountrySelect={handleCountrySelect}
    hoveredCountry={hoveredCountry}
    setHoveredCountry={setHoveredCountry}
  />
</div>

          
          <div key="table" style={{ 
    backgroundColor: 'white', 
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflowX: 'auto',
      width: 'calc(100vw - 40px)', // Account for padding
  marginLeft: '-20px'
  }}>
    <table style={{ 
      borderCollapse: 'collapse',
      whiteSpace: 'nowrap',
      minWidth: '2000px'
    }}>
      <thead>
        <tr>
          {columns.map(column => (
            <th 
              key={column.accessor} 
              style={{ 
                textAlign: 'left', 
                padding: '12px', 
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                position: 'sticky',
                top: 0
              }}
            >
              {column.Header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredData.map((coffee, index) => (
          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
            {columns.map(column => {
              const value = coffee[column.accessor];
              const shouldBold = column.accessor === 'origin' && coffee.origin === hoveredCountry;
              
              return (
                <td 
                  key={column.accessor} 
                  style={{ 
                    padding: '12px',
                    fontWeight: shouldBold ? 'bold' : 'normal',
                    color: shouldBold ? '#b45309' : 'inherit'
                  }}
                >
                  {column.accessor === 'pricePerGram' 
                    ? `$${value?.toFixed(2)}` 
                    : value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
        </ResponsiveGridLayout>
      ) : (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          height: '600px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>
          Coffee Origins
          {selectedCountry && ` - Filtered by ${selectedCountry}`}
          </h3>
          <MapView 
    data={filteredData}
    onCountrySelect={handleCountrySelect}
    hoveredCountry={hoveredCountry}
    setHoveredCountry={setHoveredCountry}
  />
</div>
      )}
    </div>
  );
}