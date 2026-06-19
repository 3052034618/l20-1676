import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import CouponConfig from '@/pages/CouponConfig';
import Preview from '@/pages/Preview';
import Summary from '@/pages/Summary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/config" replace />,
      },
      {
        path: 'config',
        element: <CouponConfig />,
      },
      {
        path: 'preview',
        element: <Preview />,
      },
      {
        path: 'summary',
        element: <Summary />,
      },
    ],
  },
]);

export default router;
