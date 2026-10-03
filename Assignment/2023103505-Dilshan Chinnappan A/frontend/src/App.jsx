import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import IncidentStream from './components/IncidentStream';
import AgentWaterfall from './components/AgentWaterfall';
import ApprovalModal from './components/ApprovalModal';
import NewAlertModal from './components/NewAlertModal';
import ArchitectureView from './components/ArchitectureView';

import { 
  fetchIncidents, 
  fetchMetrics, 
  ingestAlert, 
  submitApproval, 
  createWebSocket 
} from './services/api';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('triage');
  const [isNewAlertModalOpen, setIsNewAlertModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const incData = await fetchIncidents();
      setIncidents(incData);
      if (incData.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(incData[0].incident_id);
      }
    } catch (e) {
      console.warn('Initial incidents fetch fallback:', e);
    }

    try {
      const metricData = await fetchMetrics();
      setMetrics(metricData);
    } catch (e) {
      console.warn('Initial metrics fetch fallback:', e);
    }
  };

  useEffect(() => {
    loadInitialData();

    // WebSocket real-time subscription
    const ws = createWebSocket(
      (data) => {
        if (data.type === 'snapshot') {
          setIncidents(data.incidents);
          if (data.incidents.length > 0 && !selectedIncidentId) {
            setSelectedIncidentId(data.incidents[0].incident_id);
          }
        } else if (data.type === 'incident_started') {
          setIncidents(prev => [data.state, ...prev.filter(i => i.incident_id !== data.state.incident_id)]);
          setSelectedIncidentId(data.state.incident_id);
        } else if (data.type === 'step_completed' || data.type === 'incident_completed' || data.type === 'incident_updated') {
          setIncidents(prev => prev.map(inc => inc.incident_id === data.state.incident_id ? data.state : inc));
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false)
    );

    const metricsInterval = setInterval(async () => {
      try {
        const m = await fetchMetrics();
        setMetrics(m);
      } catch (e) {}
    }, 10000);

    return () => {
      ws.close();
      clearInterval(metricsInterval);
    };
  }, []);

  const selectedIncident = incidents.find(i => i.incident_id === selectedIncidentId);

  const handleIngest = async (alertPayload) => {
    const res = await ingestAlert(alertPayload);
    if (res.incident) {
      setIncidents(prev => [res.incident, ...prev.filter(i => i.incident_id !== res.incident.incident_id)]);
      setSelectedIncidentId(res.incident.incident_id);
    }
    const m = await fetchMetrics();
    setMetrics(m);
  };

  const handleApproval = async (incidentId, decisionPayload) => {
    const res = await submitApproval(incidentId, decisionPayload);
    // Refresh incident state
    const incList = await fetchIncidents();
    setIncidents(incList);
    const m = await fetchMetrics();
    setMetrics(m);
  };

  return (
    <div className="app-container">
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewAlert={() => setIsNewAlertModalOpen(true)}
        wsConnected={wsConnected}
        incidentCount={incidents.length}
      />

      <MetricsBar metrics={metrics} />

      {activeTab === 'triage' ? (
        <main className="workspace-layout">
          <IncidentStream 
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => setSelectedIncidentId(id)}
          />

          <AgentWaterfall 
            incident={selectedIncident}
            onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
          />
        </main>
      ) : (
        <ArchitectureView />
      )}

      {isNewAlertModalOpen && (
        <NewAlertModal 
          onClose={() => setIsNewAlertModalOpen(false)}
          onIngest={handleIngest}
        />
      )}

      {isApprovalModalOpen && selectedIncident && (
        <ApprovalModal 
          incident={selectedIncident}
          onClose={() => setIsApprovalModalOpen(false)}
          onSubmitApproval={handleApproval}
        />
      )}
    </div>
  );
}
