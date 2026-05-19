import { Server } from 'socket.io';

const PORT = 3003;

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store active agent states
const agentStates = new Map<string, {
  agentName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  shipmentRef?: string;
  startedAt?: number;
}>();

// Initialize agent states
const AGENT_NAMES = ['triage_clerk', 'data_extractor', 'auditor', 'risk_analyst', 'dispatcher'];
AGENT_NAMES.forEach(name => {
  agentStates.set(name, { agentName: name, status: 'idle' });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current agent states on connection
  socket.emit('agent:states', Object.fromEntries(agentStates));

  // Start a simulated swarm processing
  socket.on('swarm:start', async (data: { shipmentRef: string; documentType: string }) => {
    console.log(`Swarm started for ${data.shipmentRef}`);

    // Simulate the 5-agent pipeline
    for (let i = 0; i < AGENT_NAMES.length; i++) {
      const agentName = AGENT_NAMES[i];
      const startTime = Date.now();

      // Set agent to running
      agentStates.set(agentName, {
        agentName,
        status: 'running',
        shipmentRef: data.shipmentRef,
        startedAt: startTime,
      });
      io.emit('agent:update', { agentName, status: 'running', shipmentRef: data.shipmentRef });

      // Simulate processing time (different per agent)
      const durations = [400, 1200, 900, 600, 300];
      await new Promise(resolve => setTimeout(resolve, durations[i]));

      // Complete agent
      const duration = Date.now() - startTime;
      agentStates.set(agentName, {
        agentName,
        status: 'completed',
        shipmentRef: data.shipmentRef,
      });
      io.emit('agent:update', {
        agentName,
        status: 'completed',
        shipmentRef: data.shipmentRef,
        duration,
      });

      // Brief pause between agents
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Send completion event
    io.emit('swarm:complete', {
      shipmentRef: data.shipmentRef,
      totalDuration: Date.now() - (agentStates.get('triage_clerk')?.startedAt || Date.now()),
    });

    // Reset agents to idle after completion
    setTimeout(() => {
      AGENT_NAMES.forEach(name => {
        agentStates.set(name, { agentName: name, status: 'idle' });
        io.emit('agent:update', { agentName: name, status: 'idle' });
      });
    }, 2000);
  });

  // Alert notification
  socket.on('alert:new', (alert: { type: string; severity: string; message: string; shipmentRef: string }) => {
    io.emit('alert:broadcast', {
      ...alert,
      timestamp: new Date().toISOString(),
      id: `alert-${Date.now()}`,
    });
  });

  // Shipment status update
  socket.on('shipment:update', (update: { shipmentRef: string; status: string; riskLevel?: string }) => {
    io.emit('shipment:broadcast', update);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

console.log(`🧠 CapsuleFlow Swarm WebSocket running on port ${PORT}`);
