import { rootRoute } from './__root';
import { loginRoute } from './login';
import { pinLoginRoute } from './pin-login';
import { registerRoute } from './register';
import { protectedRoute } from './protected';
import { dashboardRoute } from './dashboard';
import { equipmentRoute } from './equipment';
import { eventsRoute } from './events';
import { scannerRoute } from './scanner';
import { employeesRoute } from './employees';
import { eventDetailRoute } from './event.$id';
import { equipmentHistoryRoute } from './equipment.$id';
import { bajasRoute } from './bajas';

const routeTree = rootRoute.addChildren([
  loginRoute,
  pinLoginRoute,
  registerRoute,
  protectedRoute.addChildren([dashboardRoute, equipmentRoute, eventsRoute, scannerRoute, employeesRoute, eventDetailRoute, equipmentHistoryRoute, bajasRoute]),
]);

export { routeTree };
