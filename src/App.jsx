import React, { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

function App() {
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    lastWatered: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    const records = await ipcRenderer.invoke('get-plant-records');
    setPlants(records);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await ipcRenderer.invoke('add-plant-record', formData);
    setFormData({
      name: '',
      location: '',
      lastWatered: new Date().toISOString().split('T')[0],
      notes: ''
    });
    loadPlants();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Plant Record Keeper</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Plants</h2>
          <div className="space-y-4">
            {plants.map(plant => (
              <div 
                key={plant.id}
                className="p-4 border rounded cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedPlant(plant)}
              >
                <h3 className="font-medium">{plant.name}</h3>
                <p className="text-gray-600">{plant.location}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Add New Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plant Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Last Watered</label>
              <input
                type="date"
                value={formData.lastWatered}
                onChange={e => setFormData({...formData, lastWatered: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full p-2 border rounded"
                rows="4"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Add Record
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;