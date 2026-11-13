// worker.js
import { default as handler } from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
};

// Esto es lo que falta y lo que rompe las rutas dinámicas:
export { DOQueueHandler } from "./.open-next/worker.js";
