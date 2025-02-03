import { Responsive, WidthProvider } from 'react-grid-layout';
import React, { useState, useMemo, useCallback } from 'react';
import { Coffee, Search, SlidersHorizontal, Download, Grid, Map, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { ComposedChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, CartesianGrid } from 'recharts';
import { rawData } from './data/coffeeData';

const SortableTable = ({ data, columns, hoveredCountry }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (!isNaN(aValue) && !isNaN(bValue)) {
        return sortConfig.direction === 'asc' 
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: 
        current.key === key && current.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={16} className="ml-2 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={16} className="ml-2" />
      : <ArrowDown size={16} className="ml-2" />;
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th 
                key={column.accessor} 
                onClick={() => requestSort(column.accessor)}
              >
                <div className="flex items-center">
                  {column.Header}
                  <span className="sort-indicator">
                    {getSortIcon(column.accessor)}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((coffee, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td 
                  key={column.accessor}
                  className={
                    column.accessor === 'origin' && coffee.origin === hoveredCountry
                      ? 'highlighted-country' 
                      : ''
                  }
                >
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
};

const MapView = ({ data, onCountrySelect, hoveredCountry, setHoveredCountry }) => {
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const coffeeCounts = useMemo(() => {
    const counts = {};
    data.forEach(coffee => {
      const origin = coffee.origin;
      if (origin) counts[origin] = (counts[origin] || 0) + 1;
    });
    return counts;
  }, [data]);

  const maxCount = useMemo(() => Math.max(...Object.values(coffeeCounts), 0), [coffeeCounts]);
  const geoUrl = "/countries-110m.json";

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <ComposableMap
        projectionConfig={{ scale: 147 }}
        className="w-full h-full min-h-[400px]"
      >
        <ZoomableGroup center={[0, 20]}>
          <Geographies geography={geoUrl}>
            {({ geographies }) => geographies.map((geo) => {
              const countryName = geo.properties.name;
              const count = coffeeCounts[countryName] || 0;
              const ratio = maxCount > 0 ? count / maxCount : 0;
              
              const r = 128 + 89 * ratio;
              const g = 128 - 9 * ratio;
              const b = 128 - 122 * ratio;
              const fillColor = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="#D6D6DA"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', filter: 'brightness(1.1)' },
                    pressed: { outline: 'none' }
                  }}
                  onMouseEnter={() => {
                    setHoveredCountry(countryName);
                    setTooltipContent(`${countryName}: ${count} coffee${count !== 1 ? 's' : ''}`);
                  }}
                  onMouseMove={(e) => {
                    setTooltipPos({ x: e.clientX + 10, y: e.clientY - 10 });
                  }}
                  onMouseLeave={() => {
                    setHoveredCountry(null);
                    setTooltipContent('');
                  }}
                  onClick={() => onCountrySelect(countryName)}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltipContent && (
        <div 
          className="fixed bg-white p-2 rounded-md border border-gray-200 pointer-events-none z-[1000] shadow-md"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

const ChartView = ({ data }) => {
  const chartData = useMemo(() => 
    data.map(coffee => ({
      name: coffee.name,
      price: coffee.pricePerGram
    })).sort((a, b) => b.price - a.price)
  , [data]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            type="category"
            tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }}
            height={100}
            interval={0}
          />
          <YAxis 
            type="number"
            label={{ 
              value: 'Price per gram ($)', 
              angle: -90,
              position: 'left',
              offset: 10,
              style: { fontSize: 12 }
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '6px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price per gram']}
          />
          <Bar 
            dataKey="price" 
            fill="#d97706" 
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

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

  const handlePriceChange = (position, value) => {
    const newValue = parseFloat(value) || 0;
    if (position === 'min') {
      setPriceRange([Math.min(newValue, priceRange[1]), priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], Math.max(newValue, priceRange[0])]);
    }
  };

  return (
  <div className="p-5 h-screen flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-amber-900 flex items-center gap-3 mb-2">
          <Coffee /> Ryan's Coffee Archive
        </h1>
        <div className="flex gap-3 items-center">
          <p className="text-amber-800">Tracking {coffeeData.length} unique coffees</p>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {viewMode === 'grid' ? <Map size={20} /> : <Grid size={20} />}
            {viewMode === 'grid' ? 'Map View' : 'Grid View'}
          </button>
          <button
            onClick={exportToCSV}
            className="btn-primary"
          >
            <Download size={20} /> Export .CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-container mb-4">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search across all fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors mb-4"
      >
        <SlidersHorizontal size={20} /> Filters
      </button>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg mb-4">
        {columns.map(column => (
            <div key={column.accessor} className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">{column.Header}</label>
              <input
                type="text"
                placeholder={`Filter ${column.Header}...`}
                value={filters[column.accessor] || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, [column.accessor]: e.target.value }))}
                className="w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
          <div className="md:col-span-3 lg:col-span-4">
            <label className="text-sm text-gray-600 mb-1 block">
              Price Range ($/g): {priceRange[0].toFixed(2)} - {priceRange[1].toFixed(2)}
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.1"
                value={priceRange[0]}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="number"
                step="0.1"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid-container">
        <div className="chart-container">
          <h3>Price by Coffee</h3>
          <ChartView data={filteredData} />
        </div>

        <div className="map-container">
          <h3>
            Coffee Origins
            {selectedCountry && <span className="filter-indicator">{selectedCountry}</span>}
          </h3>
          <MapView 
            data={filteredData}
            onCountrySelect={handleCountrySelect}
            hoveredCountry={hoveredCountry}
            setHoveredCountry={setHoveredCountry}
          />
        </div>

        <div className="table-container">
          <SortableTable 
            data={filteredData} 
            columns={columns} 
            hoveredCountry={hoveredCountry} 
          />
        </div>
      </div>
    </div>
  );
}