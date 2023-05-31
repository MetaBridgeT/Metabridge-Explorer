import TxExplorer from './Pages/TxExplorer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route index path="/" element={<TxExplorer />} />
        <Route path="/:id" element={<TxExplorer />} />
      </Routes>
    </Router>
  );
}

export default App;
