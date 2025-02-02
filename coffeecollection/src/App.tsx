import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Coffee, Download, Grid, Table } from 'lucide-react';
import { ComposedChart, XAxis, YAxis, Tooltip, Line, Bar } from 'recharts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { rawData } from './data/coffeeData';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';


const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];
const ResponsiveGridLayout = WidthProvider(Responsive);

const MapChart = ({ data }) => {
  const originCounts = useMemo(() => 
    data.reduce((acc, { origin }) => {
      acc[origin] = (acc[origin] || 0) + 1;
      return acc;
    }, {}), [data]);

  return (
    <ComposableMap projection="geoMercator">
      <Geographies geography="/world-110m.json">
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="#EAEAEC"
              stroke="#D6D6DA"
            />
          ))
        }
      </Geographies>
      {Object.entries(originCounts).map(([origin, count]) => (
        <Marker key={origin} coordinates={[0, 0]}>
          <circle r={Math.sqrt(count) * 2} fill="#8884d8" opacity={0.6} />
          <text textAnchor="middle" y={-Math.sqrt(count) * 2 - 5}>
            {origin}
          </text>
        </Marker>
      ))}
    </ComposableMap>
  );
};

export default function CoffeeDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [daysRange, setDaysRange] = useState([0, 365]);
  const [priceRange, setPriceRange] = useState([0, 1]);

  const columns = useMemo(() => [
    { Header: 'Name', accessor: 'name' },
    { Header: 'Origin', accessor: 'origin' },
    { Header: 'Variety', accessor: 'variety' },
    { Header: 'Processing', accessor: 'processing' },
    { Header: 'Roasted', accessor: 'roasted' },
    { Header: 'Opened', accessor: 'opened' },
    { Header: 'Frozen', accessor: 'frozen' },
    { Header: 'Days Off Roast', accessor: 'daysOffRoast' },
    { Header: 'Current (g)', accessor: 'current' },
    { Header: 'Amount Bought (g)', accessor: 'amountBought' },
    { Header: 'Cost ($)', accessor: 'cost' },
    { Header: '$/g', accessor: 'pricePerGram' },
    { Header: 'My Notes', accessor: 'myNotes' },
    { Header: 'Supposed Notes', accessor: 'supposedNotes' },
    { Header: 'Additional Info', accessor: 'additionalInfo' },
    { Header: 'Comments', accessor: 'comments' }
  ], []);

  const coffeeData = useMemo(() => {
    if (!rawData) {
      console.error('No coffee data found');
      return [];
    }
    
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
      const daysMatch = coffee.daysOffRoast >= daysRange[0] && coffee.daysOffRoast <= daysRange[1];
      const priceMatch = coffee.pricePerGram >= priceRange[0] && coffee.pricePerGram <= priceRange[1];
      
      return daysMatch && 
             priceMatch && 
             Object.entries(filters).every(([key, value]) => {
               if (!value) return true;
               const coffeeValue = coffee[key]?.toString().toLowerCase();
               return coffeeValue?.includes(value.toLowerCase());
             }) && 
             (searchTerm === '' || 
              Object.values(coffee).some(value => 
                value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
              ));
    });
  }, [coffeeData, daysRange, priceRange, filters, searchTerm]);

  const gridLayout = [
    { i: 'map', x: 0, y: 0, w: 4, h: 3 },
    { i: 'chart', x: 4, y: 0, w: 4, h: 3 },
    { i: 'table', x: 0, y: 3, w: 12, h: 4 }
  ];

  if (!coffeeData.length) {
    return <div className="p-6">Loading coffee data...</div>;
  }
  

  return (
    <div className="p-6 w-full min-h-screen bg-gray-50">
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-amber-900">
            <Coffee className="inline mr-3 w-10 h-10" />
            Ryan's Coffee Archive
          </h1>
          <p className="text-amber-800 mt-2">Tracking {coffeeData.length} unique coffees since 2023</p>
        </div>

        <div className="flex gap-4">
          <CSVLink data={csvData} filename="coffee-data.csv">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2">
              <Download className="w-5 h-5" /> Export CSV
            </button>
          </CSVLink>
          
          <button 
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2"
          >
            {viewMode === 'table' ? <Grid /> : <Table />}
            Toggle View
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search across all fields..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {columns.filter(column => column.accessor !== 'id').map(column => (
              <div key={column.accessor}>
                <input 
                  type="text" 
                  placeholder={`Filter ${column.Header}...`} 
                  className="w-full p-2 border rounded-lg" 
                  value={filters[column.accessor] || ''} 
                  onChange={(e) => setFilters(prev => ({ ...prev, [column.accessor]: e.target.value }))} 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div>
          <label className="block mb-2">Days Off Roast: {daysRange[0]} - {daysRange[1]}</label>
          <div className="flex gap-2">
            <input 
              type="range" 
              min="0" 
              max="365" 
              value={daysRange[1]} 
              onChange={e => setDaysRange([daysRange[0], parseInt(e.target.value)])}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <label className="block mb-2">Price Range ($/g)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={priceRange[0]}
              onChange={e => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
              className="w-1/2 p-2 border rounded-lg"
            />
            <input
              type="number"
              step="0.01"
              value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
              className="w-1/2 p-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200 }}
        cols={{ lg: 12 }}
        rowHeight={100}
      >
        <div key="map" className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Origin Map</h3>
          <MapChart data={filteredData} />
        </div>

        <div key="chart" className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Price vs Days</h3>
          <ComposedChart data={filteredData} width={500} height={300}>
            <XAxis dataKey="daysOffRoast" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="pricePerGram" fill="#8884d8" />
            <Line type="monotone" dataKey="current" stroke="#82ca9d" />
          </ComposedChart>
        </div>

        <div key="table" className="bg-white p-4 rounded-lg shadow">
          {viewMode === 'table' ? (
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {columns.map(column => (
                      <th key={column.accessor} className="text-left p-2 border-b">
                        {column.Header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((coffee, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {columns.map(column => (
                        <td key={column.accessor} className="p-2">
                          {coffee[column.accessor]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map(coffee => (
                <div key={coffee.id} className="border p-4 rounded-lg hover:shadow-lg transition-shadow">
                  <h3 className="font-bold text-lg mb-2">{coffee.name}</h3>
                  <p className="text-gray-600 mb-1">
                    <span className="font-semibold">Origin:</span> {coffee.origin}
                  </p>
                  <p className="text-gray-600 mb-1">
                    <span className="font-semibold">Variety:</span> {coffee.variety}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Price:</span> ${coffee.pricePerGram}/g
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveGridLayout>
    </div>
    </div>
  );
}