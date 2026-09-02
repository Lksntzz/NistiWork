/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Queue } from './pages/Queue';
import { Companies } from './pages/Companies';
import { Production } from './pages/Production';
import { Collections } from './pages/Collections';
import { Products } from './pages/Products';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fila" element={<Queue />} />
          <Route path="/empresas" element={<Companies />} />
          <Route path="/producao" element={<Production />} />
          <Route path="/colecoes" element={<Collections />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
