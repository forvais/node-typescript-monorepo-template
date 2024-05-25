import { useQuery } from '@tanstack/react-query';

import './App.scss';

const apiHealthEndpoint = (new URL('/healthz', import.meta.env.VITE_API)).toString();

function App() {
  const healthQuery = useQuery({
    queryKey: ['api_health'],
    queryFn: () => fetch(apiHealthEndpoint),
  });

  return (
    <>
      <h1>Hello World!</h1>
      <p>API Status: {healthQuery.data?.status === 200 ? 'Online' : 'Offline'}</p>
    </>
  );
}

export default App;
