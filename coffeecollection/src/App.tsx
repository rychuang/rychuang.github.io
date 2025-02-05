import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Plus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Trash2 
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

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  border: 'none',
  color: 'white',
  borderRadius: '4px',
};

const BUTTON_BASE_CLASSES = "flex items-center gap-2 px-3 py-2 text-white rounded-md transition-colors";

const parseCoffeeData = (rawData) => {
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
};

const exportToCSV = (data, columns) => {
  const csvHeaders = columns.map(c => c.Header).join(',');
  const csvRows = data.map(row =>
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
};

const SortableTable = ({ data, columns, hoveredCountry, onDataUpdate }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
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
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [localData, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={16} className="ml-2 opacity-50" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={16} className="ml-2" />
      : <ArrowDown size={16} className="ml-2" />;
  };

  const handleEditChange = (rowId, accessor, value) => {
    setLocalData(prevData => {
      const rowIndex = prevData.findIndex(row => row.id === rowId);
      if (rowIndex === -1) return prevData;
      const updatedData = [...prevData];
      updatedData[rowIndex] = { ...updatedData[rowIndex], [accessor]: value ?? '' };
      return updatedData;
    });
  };

  const addNewRow = () => {
    setLocalData(prevData => {
      const newRow = {
        ...columns.reduce((acc, column) => ({ ...acc, [column.accessor]: '' }), {}),
        id: Math.max(...prevData.map(item => item.id || 0), 0) + 1
      };
      const updatedData = [newRow, ...prevData];
      setSortConfig({ key: null, direction: 'asc' });
      setEditingRow(newRow.id);
      return updatedData;
    });
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <button onClick={addNewRow} className={`${BUTTON_BASE_CLASSES} bg-green-500 hover:bg-green-600`}>
          <Plus size={16} /> Add Row
        </button>
        <button 
          onClick={() => exportToCSV(localData, columns)} 
          className={`${BUTTON_BASE_CLASSES} bg-green-600 hover:bg-green-700`}
        >
          <Download size={16} /> Export to CSV
        </button>
      </div>
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Actions</th>
              {columns.map(column => (
                <th 
                  key={column.accessor} 
                  className="text-left cursor-pointer hover:bg-gray-50"
                  onClick={() => setSortConfig(current => ({
                    key: column.accessor,
                    direction: current.key === column.accessor && current.direction === 'asc' ? 'desc' : 'asc',
                  }))}
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
              <tr key={coffee.id} className="border-b">
                <td>
                  {editingRow === coffee.id ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          onDataUpdate(localData);
                          setEditingRow(null);
                        }}
                        className="p-1 rounded transition-colors text-green-500 hover:bg-green-100"
                      >
                        <Save size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this row?')) {
                            const updatedData = localData.filter(row => row.id !== coffee.id);
                            setLocalData(updatedData);
                            onDataUpdate(updatedData);
                          }
                        }}
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
                        <div className="text-gray-400 text-xs mb-1">{column.Header}</div>
                        <input
                          type="text"
                          value={coffee[column.accessor] || ''}
                          onChange={(e) => handleEditChange(coffee.id, column.accessor, e.target.value)}
                          className="w-full p-1 border rounded bg-yellow-50"
                          placeholder={column.Header}
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

const MapView = ({ data, onCountrySelect, hoveredCountry, setHoveredCountry }) => {
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const coffeeCounts = useMemo(() => {
    return data.reduce((counts, coffee) => {
      if (coffee.origin) counts[coffee.origin] = (counts[coffee.origin] || 0) + 1;
      return counts;
    }, {});
  }, [data]);

  const maxCount = useMemo(() => Math.max(...Object.values(coffeeCounts), 0), [coffeeCounts]);

  return (
    <div className="w-full h-[500px] relative">
      <ComposableMap
        projectionConfig={{ scale: 147 }}
        projection="geoEqualEarth"
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup center={[0, -30]} disablePanning>
          <Geographies geography="/countries-110m.json">
            {({ geographies }) => geographies.map((geo) => {
              const countryName = geo.properties.name;
              const count = coffeeCounts[countryName] || 0;
              const ratio = maxCount > 0 ? count / maxCount : 0;
              const fillColor = count === 0 
                ? '#555555'
                : `rgb(${Math.floor(128 + 89 * ratio)},${Math.floor(128 - 9 * ratio)},${Math.floor(128 - 122 * ratio)})`;

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
                  onMouseEnter={(evt) => {
                    setHoveredCountry(countryName);
                    setTooltipContent(`${countryName} - ${count} ${count === 1 ? 'coffee' : 'coffees'}`);
                    setTooltipPos({ 
                      x: evt.pageX + 10,
                      y: evt.pageY
                    });
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
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            position: 'fixed'
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

const ChartView = ({ data }) => {
  const [sortByPrice, setSortByPrice] = useState(false);

  const chartData = useMemo(() => {
    const sorted = sortByPrice ? [...data].sort((a, b) => b.pricePerGram - a.pricePerGram) : data;
    return sorted.map(coffee => ({
      name: coffee.name.substring(0, 20),
      price: coffee.pricePerGram
    }));
  }, [data, sortByPrice]);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setSortByPrice(!sortByPrice)}
          className={`${BUTTON_BASE_CLASSES} bg-amber-500 hover:bg-amber-600`}
        >
          {sortByPrice ? <ArrowDown size={16} /> : <ArrowUpDown size={16} />}
          {sortByPrice ? 'Sorted by Price' : 'Sort by Price'}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 50, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
            height={100}
            interval={0}
          />
          <YAxis 
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            label={{ 
              value: 'Price per gram ($)', 
              angle: -90,
              position: 'left',
              offset: 10,
              fontSize: 12
            }}
          />
          <Tooltip 
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar 
            dataKey="price"
            fill="#d97706"
            radius={[4, 4, 0, 0]}
            barSize={20}
            name="Price per gram"
            className="chart-bar"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
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

export default function CoffeeDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [priceRange, setPriceRange] = useState([0, 2]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [coffeeData, setCoffeeData] = useState(() => parseCoffeeData(rawData));

  const filteredData = useMemo(() => {
    return coffeeData.filter(coffee => {
      const priceMatch = coffee.pricePerGram >= priceRange[0] && coffee.pricePerGram <= priceRange[1];
      const filterMatch = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return coffee[key]?.toString().toLowerCase().includes(value.toLowerCase());
      });
      const searchMatch = !searchTerm || 
        Object.values(coffee).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      return priceMatch && filterMatch && searchMatch;
    });
  }, [coffeeData, priceRange, filters, searchTerm]);

  const handleCountrySelect = (country) => {
    const newCountry = country === selectedCountry ? null : country;
    setSelectedCountry(newCountry);
    setFilters(prev => ({ ...prev, origin: newCountry || '' }));
  };

  const handlePriceChange = (position, value) => {
    const newValue = parseFloat(value) || 0;
    setPriceRange(prev => 
      position === 'min' 
        ? [Math.min(newValue, prev[1]), prev[1]]
        : [prev[0], Math.max(newValue, prev[0])]
    );
  };

  return (
      <div className="p-4 min-h-screen bg-gray-50">
        <div className="flex w-full gap-4 mb-4">
          <div className="w-1/2 bg-white rounded-lg shadow-sm p-4">
            <div className="mb-2">
              <span className="px-3 py-1 rounded-md bg-amber-500 text-white">
                Coffee Origins
              </span>
            </div>
            <MapView 
              data={filteredData}
              onCountrySelect={handleCountrySelect}
              hoveredCountry={hoveredCountry}
              setHoveredCountry={setHoveredCountry}
            />
          </div>

          <div className="w-1/2 bg-white rounded-lg shadow-sm p-4">
            <div className="mb-2">
              <span className="px-3 py-1 rounded-md bg-amber-500 text-white">
                Price Chart
              </span>
            </div>
            <ChartView data={filteredData} />
          </div>
        </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="mb-2">
          <span className="px-3 py-1 rounded-md bg-amber-500 text-white">
            Coffee Details
          </span>
        </div>
        <div className="p-4">
          <SortableTable 
            data={filteredData} 
            columns={columns} 
            hoveredCountry={hoveredCountry}
            onDataUpdate={setCoffeeData}
          />
        </div>
      </div>
    </div>
  );
}
