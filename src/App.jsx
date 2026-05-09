import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

function App() {
  const [currentData, setCurrentData] = useState({
    adc: 0,
    co2: 0,
    nh3: 0,
    nox: 0,
    time: '-'
  });
  
  const [history, setHistory] = useState([]);
  const [connectionStatus, setConne~ctionStatus] = useState('Menghubungkan...');

  useEffect(() => {
    const clientId = 'mqttjs_' + Math.random().toString(16).substring(2, 8);
    const host = 'wss://broker.hivemq.com:8884/mqtt';

    const options = {
      keepalive: 60,
      clientId: clientId,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    };

    const client = mqtt.connect(host, options);

    client.on('connect', () => {
      setConnectionStatus('Terhubung');
      client.subscribe('proyek/sensor/mq135', (err) => {
        if (err) console.error('Gagal subscribe:', err);
      });
    });

    client.on('message', (topic, message) => {
      if (topic === 'proyek/sensor/mq135') {
        try {
          const parsedData = JSON.parse(message.toString());
          
          const now = new Date();
          const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          const newData = {
            adc: parsedData.adc,
            co2: parsedData.co2 ? parsedData.co2.toFixed(2) : '0.00',
            nh3: parsedData.nh3 ? parsedData.nh3.toFixed(2) : '0.00',
            nox: parsedData.nox ? parsedData.nox.toFixed(2) : '0.00',
            time: timeString
          };

          setCurrentData(newData);
          
          setHistory((prevHistory) => [newData, ...prevHistory]);

        } catch (e) {
          console.error("Gagal mengurai JSON:", e);
        }
      }
    });

    client.on('error', (err) => {
      console.error('Connection error: ', err);
      client.end();
    });

    client.on('reconnect', () => setConnectionStatus('Menghubungkan ulang...'));

    return () => {
      if (client) client.end();
    };
  }, []);

  const downloadExcel = () => {
    if (history.length === 0) {
      alert("Belum ada data untuk diunduh.");
      return;
    }

    const headers = "Waktu,Sinyal ADC,CO2 (ppm),NH3 (ppm),NOx (ppm)\n";
    const rows = history.map(row => `${row.time},${row.adc},${row.co2},${row.nh3},${row.nox}`).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Data_Log_MQ135.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="bg-slate-900 rounded-xl p-6 shadow-lg text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">IoT Gas Monitor</h1>
            <p className="text-slate-400 text-sm mt-1">Sensor: MQ-135 Semiconductor</p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'Terhubung' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
            <span className="text-sm font-medium">{connectionStatus}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-slate-500 text-sm font-semibold mb-2">Estimasi CO2</h2>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-extrabold text-slate-800">{currentData.co2}</span>
              <span className="text-slate-400 font-medium mb-1">ppm</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-slate-500 text-sm font-semibold mb-2">Estimasi NH3 (Amonia)</h2>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-extrabold text-slate-800">{currentData.nh3}</span>
              <span className="text-slate-400 font-medium mb-1">ppm</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-slate-500 text-sm font-semibold mb-2">Estimasi NOx</h2>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-extrabold text-slate-800">{currentData.nox}</span>
              <span className="text-slate-400 font-medium mb-1">ppm</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-slate-500 text-sm font-semibold mb-2">Sinyal Analog (ADC)</h2>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-extrabold text-slate-600">{currentData.adc}</span>
              <span className="text-slate-400 font-medium mb-1">/ 1023</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-slate-800 text-lg font-bold">Log Data Akuisisi</h2>
            <button 
              onClick={downloadExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Unduh CSV / Excel
            </button>
          </div>
          
          <div className="overflow-x-auto border rounded-lg max-h-96 overflow-y-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 sticky top-0 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-800">Waktu (WIB)</th>
                  <th className="px-6 py-3 font-semibold text-slate-800">Sinyal (ADC)</th>
                  <th className="px-6 py-3 font-semibold text-slate-800">CO2 (ppm)</th>
                  <th className="px-6 py-3 font-semibold text-slate-800">NH3 (ppm)</th>
                  <th className="px-6 py-3 font-semibold text-slate-800">NOx (ppm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">Menunggu transmisi data masuk...</td>
                  </tr>
                ) : (
                  history.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-700">{row.time}</td>
                      <td className="px-6 py-3">{row.adc}</td>
                      <td className="px-6 py-3">{row.co2}</td>
                      <td className="px-6 py-3">{row.nh3}</td>
                      <td className="px-6 py-3">{row.nox}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;