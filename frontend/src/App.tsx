import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePlaceholder from './pages/HomePlaceholder';
import StoreHome from './pages/StoreHome';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/home" element={<StoreHome />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<HomePlaceholder />} />
      </Route>
    </Routes>
  );
}
