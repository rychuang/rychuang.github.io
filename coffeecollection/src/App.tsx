import React, { useState, useMemo, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { 
  Coffee, Search, SlidersHorizontal, Download, 
  Grid, Map, ArrowUpDown, ArrowUp, ArrowDown, 
  Plus, Trash2, Save, X 
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { 
  ComposedChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { rawData } from './data/coffeeData';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css'; 

const ResponsiveGridLayout = WidthProvider(Responsive);

const SortableTable = ({ 
  data, 
  columns, 
  hoveredCountry, 
  onDataUpdate 
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const [editingRow, setEditingRow] = useState(null);
  const [localData, setLocalData] = useState(data);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return localData;

    return [...localData].sort((a, b) => {
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
  }, [localData, sortConfig]);

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

  const handleEditChange = (rowId, accessor, value) => {
    setLocalData((prevData) => {
      const rowIndex = prevData.findIndex(row => row.id === rowId);
      if (rowIndex === -1) return prevData;
      const updatedData = [...prevData];
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        [accessor]: value ?? ''
      };
      return updatedData;
    });
  };

  const deleteRow = (rowId) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      const updatedData = localData.filter(row => row.id !== rowId);
      setLocalData(updatedData);
      onDataUpdate(updatedData);
    }
  };

  const saveChanges = () => {
    onDataUpdate(localData);
    setEditingRow(null);
  };

  const addNewRow = () => {
    setLocalData((prevData) => {
      const newRow = columns.reduce((acc, column) => {
        acc[column.accessor] = '';
        return acc;
      }, {});

      const maxId = prevData.reduce((max, item) => 
        Math.max(max, item.id || 0), 0);
      newRow.id = maxId + 1;

      const updatedData = [newRow, ...prevData];
      setSortConfig({ key: null, direction: 'asc' });
      setEditingRow(newRow.id);
      return updatedData;
    });
  };

  return (
  <div>
    <div className="flex justify-end mb-2">
      <button 
        onClick={addNewRow}
        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        <Plus size={16} /> Add Row
      </button>
    </div>
    {/* Wrap the table in a div with the table-container class */}
    <div className="table-container">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Actions</th>
            {columns.map(column => (
              <th 
                key={column.accessor} 
                className="p-2 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => requestSort(column.accessor)}
              >
                <div className="flex items-center">
                  {column.Header}
                  {getSortIcon(column.accessor)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((coffee) => (
            <tr key={coffee.id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                {editingRow === coffee.id ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={saveChanges}
                      className="p-1 rounded transition-colors text-green-500 hover:bg-green-100"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                      onClick={() => deleteRow(coffee.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setEditingRow(coffee.id)}
                    className="p-1 rounded text-blue-500 hover:bg-blue-100"
                  >
                    Edit
                  </button>
                )}
              </td>
              {columns.map(column => (
                <td key={column.accessor} className="p-2">
                  {editingRow === coffee.id ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={coffee[column.accessor] || ''}
                        onChange={(e) => handleEditChange(coffee.id, column.accessor, e.target.value)}
                        className="w-full p-1 border rounded"
                      />
                    </div>
                  ) : (
                    coffee[column.accessor]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
};

export { SortableTable };

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
    className="map-tooltip"
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
              offset: 10
            }}
          />
          <Tooltip />
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

  const initialCoffeeData = useMemo(() => {
    if (!rawData) return [];
    return rawData
      .trim()
      .split('\n')
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

  const [coffeeData, setCoffeeData] = useState(initialCoffeeData);

  const handleDataUpdate = (updatedData) => {
    setCoffeeData(updatedData);
  };

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
  const layouts = {
  lg: [
    { i: 'chart', x: 0, y: 0, w: 6, h: 4 },
    { i: 'map', x: 6, y: 0, w: 6, h: 4 },
    { i: 'table', x: 0, y: 4, w: 12, h: 6 }
  ]
};

  const [activeTab, setActiveTab] = useState('chart');

  return (
    <div className="p-5 h-screen flex flex-col">
      {/* [Previous header and search components remain the same] */}

      <ResponsiveGridLayout
  measureBeforeMount={true}
  className="layout"
  layouts={layouts}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
  rowHeight={60}
  draggableHandle=".drag-handle"
>
        <div key="chart" className="bg-white rounded-lg shadow-sm">
          <div className="drag-handle cursor-move p-2 bg-gray-100 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span 
                onClick={() => setActiveTab('chart')}
                className={`px-3 py-1 rounded-md cursor-pointer ${activeTab === 'chart' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200'}`}
              >
                Price Chart
              </span>
            </div>
          </div>
          {activeTab === 'chart' && (
            <div className="p-4">
              <ChartView data={filteredData} />
            </div>
          )}
        </div>

        <div key="map" className="bg-white rounded-lg shadow-sm">
          <div className="drag-handle cursor-move p-2 bg-gray-100 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span 
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 rounded-md cursor-pointer ${activeTab === 'map' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200'}`}
              >
                Coffee Origins
              </span>
            </div>
          </div>
          {activeTab === 'map' && (
            <div className="p-4">
              <MapView 
                data={filteredData}
                onCountrySelect={handleCountrySelect}
                hoveredCountry={hoveredCountry}
                setHoveredCountry={setHoveredCountry}
              />
            </div>
          )}
        </div>

        <div key="table" className="bg-white rounded-lg shadow-sm">
          <div className="drag-handle cursor-move p-2 bg-gray-100 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span 
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1 rounded-md cursor-pointer ${activeTab === 'table' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200'}`}
              >
                Coffee Details
              </span>
            </div>
          </div>
          {activeTab === 'table' && (
            <div className="p-4">
              <SortableTable 
                data={filteredData} 
                columns={columns} 
                hoveredCountry={hoveredCountry}
                onDataUpdate={handleDataUpdate}
              />
            </div>
          )}
        </div>
        
      </ResponsiveGridLayout>
    </div>
  );
}