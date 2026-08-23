import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePlaceholder from './pages/HomePlaceholder';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="*" element={<HomePlaceholder />} />
      </Route>
    </Routes>
  );
}
