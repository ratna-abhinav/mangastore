import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePlaceholder from './pages/HomePlaceholder';
import StoreHome from './pages/StoreHome';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/home" element={<StoreHome />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="*" element={<HomePlaceholder />} />
      </Route>
    </Routes>
  );
}
