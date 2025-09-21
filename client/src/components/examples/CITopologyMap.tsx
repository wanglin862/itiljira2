import CITopologyMap from '../CITopologyMap'
import type { ConfigurationItem } from "@shared/schema";

export default function CITopologyMapExample() {
  const centralCI: ConfigurationItem = {
    id: "1",
    name: "WEB-PROD-01",
    type: "Server",
    status: "Active",
    location: "DC-East",
    ipAddress: "192.168.1.100",
    hostname: "web-prod-01.company.com",
    operatingSystem: "Ubuntu 20.04 LTS",
    environment: "Production",
    businessService: "E-commerce Platform",
    owner: "DevOps Team",
    metadata: null,
    createdAt: new Date("2025-09-15T10:30:00Z"),
    updatedAt: new Date("2025-09-22T14:20:00Z")
  };

  return <CITopologyMap centralCI={centralCI} />
}