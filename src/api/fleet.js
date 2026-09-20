// src/api/fleet.js
import { apiClient, isMock, delay } from "./client.js";
import mockFleet from "../mocks/fleet.json" with { type: "json" };
import mockUsers from "../mocks/users.json" with { type: "json" };
import { authApi } from "./auth.js";

/**
 * Helper to get fresh cached trucks or fallback mock
 */
function getInMemoryTrucks() {
  try {
    const cached = localStorage.getItem("app_fleet_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached fleet:", e);
  }
  return mockFleet?.data?.trucks ? [...mockFleet.data.trucks] : [];
}

/**
 * Helper to persist mock trucks state to localStorage
 */
function saveInMemoryTrucks(trucks) {
  try {
    localStorage.setItem("app_fleet_cache", JSON.stringify(trucks));
  } catch (e) {
    console.error("Error saving fleet cache:", e);
  }
}

/**
 * Initial seed odometer logs for mock mode
 */
const DEFAULT_MOCK_ODOMETER_LOGS = [
  {
    id: "log-1001-1",
    truckId: "trk-11111111-2222-3333-4444-555555555555",
    odometerReading: 45000,
    distanceDelta: 300,
    loggedBy: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    loggedByName: "Super Admin (Logistics Supervisor)",
    source: "POST_DISPATCH_RETURN",
    notes: "End of shift return check-in - Bunawan Yard",
    loggedAt: "2026-09-18T05:30:00.000Z",
  },
  {
    id: "log-1001-2",
    truckId: "trk-11111111-2222-3333-4444-555555555555",
    odometerReading: 44700,
    distanceDelta: 250,
    loggedBy: "5f60e166-8de5-4dd9-bfdb-58e71ec5244b",
    loggedByName: "Fleet Manager",
    source: "POST_DISPATCH_RETURN",
    notes: "North route delivery return",
    loggedAt: "2026-09-17T06:15:00.000Z",
  },
  {
    id: "log-1001-3",
    truckId: "trk-11111111-2222-3333-4444-555555555555",
    odometerReading: 44450,
    distanceDelta: 220,
    loggedBy: "5f60e166-8de5-4dd9-bfdb-58e71ec5244b",
    loggedByName: "Fleet Manager",
    source: "POST_DISPATCH_RETURN",
    notes: "Regular dispatch return",
    loggedAt: "2026-09-16T05:45:00.000Z",
  },
  {
    id: "log-2002-1",
    truckId: "trk-22222222-3333-4444-5555-666666666666",
    odometerReading: 46150,
    distanceDelta: 150,
    loggedBy: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    loggedByName: "Super Admin (Logistics Supervisor)",
    source: "POST_DISPATCH_RETURN",
    notes: "City commercial delivery return",
    loggedAt: "2026-09-18T08:00:00.000Z",
  },
  {
    id: "log-2002-2",
    truckId: "trk-22222222-3333-4444-5555-666666666666",
    odometerReading: 46000,
    distanceDelta: 210,
    loggedBy: "5f60e166-8de5-4dd9-bfdb-58e71ec5244b",
    loggedByName: "Fleet Manager",
    source: "POST_DISPATCH_RETURN",
    notes: "Industrial delivery return",
    loggedAt: "2026-09-17T07:30:00.000Z",
  },
  {
    id: "log-3003-1",
    truckId: "trk-33333333-4444-5555-6666-777777777777",
    odometerReading: 120500,
    distanceDelta: 500,
    loggedBy: "5f60e166-8de5-4dd9-bfdb-58e71ec5244b",
    loggedByName: "Fleet Manager",
    source: "POST_DISPATCH_RETURN",
    notes: "South highway route return - Scheduled for repair",
    loggedAt: "2026-09-15T09:00:00.000Z",
  },
  {
    id: "log-4004-1",
    truckId: "trk-44444444-5555-6666-7777-888888888888",
    odometerReading: 25800,
    distanceDelta: 280,
    loggedBy: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    loggedByName: "Super Admin (Logistics Supervisor)",
    source: "POST_DISPATCH_RETURN",
    notes: "Wholesale distribution route return",
    loggedAt: "2026-09-18T04:20:00.000Z",
  },
  {
    id: "log-5005-1",
    truckId: "trk-55555555-6666-7777-8888-999999999999",
    odometerReading: 185900,
    distanceDelta: 320,
    loggedBy: "5f60e166-8de5-4dd9-bfdb-58e71ec5244b",
    loggedByName: "Fleet Manager",
    source: "POST_DISPATCH_RETURN",
    notes: "Heavy transport return - flagged for PM",
    loggedAt: "2026-09-16T08:15:00.000Z",
  },
];

/**
 * Helper to get fresh cached odometer logs or default mock
 */
function getInMemoryOdometerLogs() {
  try {
    const cached = localStorage.getItem("app_odometer_logs_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached odometer logs:", e);
  }
  return [...DEFAULT_MOCK_ODOMETER_LOGS];
}

/**
 * Helper to persist mock odometer logs state to localStorage
 */
function saveInMemoryOdometerLogs(logs) {
  try {
    localStorage.setItem("app_odometer_logs_cache", JSON.stringify(logs));
  } catch (e) {
    console.error("Error saving odometer logs cache:", e);
  }
}

/**
 * Initial seed safety inspections for mock mode
 */
const DEFAULT_MOCK_INSPECTIONS = [
  {
    id: "insp-1001-1",
    truckId: "trk-11111111-2222-3333-4444-555555555555",
    plateNumber: "ABC-1001",
    truckModel: "Isuzu Elf N-Series",
    inspectorId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    inspectorName: "Super Admin (Logistics Supervisor)",
    inspectorUsername: "superadmin",
    result: "PASSED",
    findings: "All lights, mirrors, brake responsiveness, and tires inspected. Tire treads within optimal depth, no leaks detected. Cleared for dispatch.",
    issueDetected: false,
    allowDispatch: true,
    inspectionDate: "2026-09-18T06:00:00.000Z",
  },
  {
    id: "insp-3003-1",
    truckId: "trk-33333333-4444-5555-6666-777777777777",
    plateNumber: "ABC-3003",
    truckModel: "Hino 300 Series",
    inspectorId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    inspectorName: "Super Admin (Logistics Supervisor)",
    inspectorUsername: "superadmin",
    result: "FAILED",
    findings: "Hydraulic brake line weeping fluid near rear axle. Brake pedal spongey with reduced pressure. Vehicle grounded immediately for shop repair.",
    issueDetected: true,
    allowDispatch: false,
    inspectionDate: "2026-09-17T07:30:00.000Z",
  },
  {
    id: "insp-4004-1",
    truckId: "trk-44444444-5555-6666-7777-888888888888",
    plateNumber: "LMN-4321",
    truckModel: "Isuzu Elf 250",
    inspectorId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    inspectorName: "Super Admin (Logistics Supervisor)",
    inspectorUsername: "superadmin",
    result: "NEEDS_ATTENTION",
    findings: "Minor hairline exhaust bracket vibration noticed during idle. Fasteners torqued. Safe for standard city deliveries.",
    issueDetected: true,
    allowDispatch: true,
    inspectionDate: "2026-09-18T07:15:00.000Z",
  },
  {
    id: "insp-5005-1",
    truckId: "trk-55555555-6666-7777-8888-999999999999",
    plateNumber: "PQR-6789",
    truckModel: "Mitsubishi Fuso Canter",
    inspectorId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    inspectorName: "Super Admin (Logistics Supervisor)",
    inspectorUsername: "superadmin",
    result: "NEEDS_ATTENTION",
    findings: "Oil sweating around valve cover gasket noticed. Monitored for next maintenance cycle.",
    issueDetected: true,
    allowDispatch: true,
    inspectionDate: "2026-09-16T08:00:00.000Z",
  },
];

/**
 * Helper to get fresh cached inspections or default mock
 */
function getInMemoryInspections() {
  try {
    const cached = localStorage.getItem("app_inspections_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached inspections:", e);
  }
  return [...DEFAULT_MOCK_INSPECTIONS];
}

/**
 * Helper to persist mock inspections state to localStorage
 */
function saveInMemoryInspections(inspections) {
  try {
    localStorage.setItem("app_inspections_cache", JSON.stringify(inspections));
  } catch (e) {
    console.error("Error saving inspections cache:", e);
  }
}

/**
 * Initial seed incident types catalog for mock mode
 */
const DEFAULT_MOCK_INCIDENT_TYPES = [
  { id: 1, typeName: "MECHANICAL_DEFECT", createdAt: "2026-09-18T00:00:00.000Z" },
  { id: 2, typeName: "ROAD_ACCIDENT", createdAt: "2026-09-18T00:00:00.000Z" },
  { id: 3, typeName: "TIRE_FAILURE", createdAt: "2026-09-18T00:00:00.000Z" },
  { id: 4, typeName: "LEAK_ISSUE", createdAt: "2026-09-18T00:00:00.000Z" },
];

/**
 * Initial seed incidents for mock mode
 */
const DEFAULT_MOCK_INCIDENTS = [
  {
    id: "inc-3003-1",
    truckId: "trk-33333333-4444-5555-6666-777777777777",
    plateNumber: "ABC-3003",
    truckModel: "Hino 300 Series",
    truckStatus: "UNDER_MAINTENANCE",
    reporterId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    reporterName: "Super Admin (Logistics Supervisor)",
    reporterUsername: "superadmin",
    incidentTypeId: 1,
    incidentTypeName: "MECHANICAL_DEFECT",
    severity: "CRITICAL",
    incidentLocation: "Km 14 Panacan Highway, Davao City",
    description: "Engine overheating with thick white smoke; truck stalled roadside during return trip. Towed to Bunawan yard.",
    reportDate: "2026-09-17T08:15:00.000Z",
  },
  {
    id: "inc-2002-1",
    truckId: "trk-22222222-3333-4444-5555-666666666666",
    plateNumber: "ABC-2002",
    truckModel: "Mitsubishi Fuso Canter",
    truckStatus: "ACTIVE",
    reporterId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
    reporterName: "Super Admin (Logistics Supervisor)",
    reporterUsername: "superadmin",
    incidentTypeId: 3,
    incidentTypeName: "TIRE_FAILURE",
    severity: "LOW",
    incidentLocation: "JP Laurel Ave, Bajada, Davao City",
    description: "Rear right outer tire low pressure warning. Re-inflated at vulcanizing shop. Monitored for puncture.",
    reportDate: "2026-09-18T09:30:00.000Z",
  },
];

/**
 * Helper to get fresh cached incidents or default mock
 */
function getInMemoryIncidents() {
  try {
    const cached = localStorage.getItem("app_incidents_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached incidents:", e);
  }
  return [...DEFAULT_MOCK_INCIDENTS];
}

/**
 * Helper to persist mock incidents state to localStorage
 */
function saveInMemoryIncidents(incidents) {
  try {
    localStorage.setItem("app_incidents_cache", JSON.stringify(incidents));
  } catch (e) {
    console.error("Error saving incidents cache:", e);
  }
}

/**
 * Initial seed maintenance service types
 */
const DEFAULT_MOCK_MAINTENANCE_TYPES = [
  {
    id: 1,
    typeName: "PREVENTIVE",
    description: "Routine scheduled service (5,000-km intervals, oil, filters, tune-up)",
  },
  {
    id: 2,
    typeName: "CORRECTIVE",
    description: "Unscheduled repairs discovered during daily inspection or operations",
  },
  {
    id: 3,
    typeName: "EMERGENCY",
    description: "Critical road breakdowns requiring roadside towing or urgent repairs",
  },
  {
    id: 4,
    typeName: "ACCIDENT_REPAIR",
    description: "Bodywork, frame restoration, and major collision repairs",
  },
];

/**
 * Initial seed work orders for mock mode
 */
const DEFAULT_MOCK_WORK_ORDERS = [
  {
    id: "wo-1001-1",
    truckId: "trk-11111111-2222-3333-4444-555555555555",
    plateNumber: "ABC-1001",
    truckModel: "Isuzu Elf N-Series",
    truckStatus: "UNDER_MAINTENANCE",
    maintenanceTypeId: 1,
    maintenanceTypeName: "PREVENTIVE",
    inspectionId: null,
    incidentReportId: null,
    shopName: "Bunawan Heavy Repair Center",
    estimatedCost: 7500.0,
    description: "5,000-km preventive maintenance overhaul, brake check, and differential fluid change",
    status: "PENDING",
    approvalStatus: "PENDING",
    scheduledDate: "2026-09-21T08:00:00.000Z",
    createdAt: "2026-09-18T09:00:00.000Z",
    updatedAt: "2026-09-18T09:00:00.000Z",
    approvalRequest: {
      id: "appr-1001-1",
      status: "PENDING",
      estimatedCost: 7500.0,
      decidedBy: null,
      decisionDate: null,
      remarks: null,
    },
  },
  {
    id: "wo-3003-1",
    truckId: "trk-33333333-4444-5555-6666-777777777777",
    plateNumber: "ABC-3003",
    truckModel: "Hino 300 Series",
    truckStatus: "UNDER_MAINTENANCE",
    maintenanceTypeId: 3,
    maintenanceTypeName: "EMERGENCY",
    inspectionId: "insp-3003-1",
    incidentReportId: "inc-3003-1",
    shopName: "Davao Precision Diesel Works",
    estimatedCost: 12500.0,
    description: "Radiator core crack repair, cylinder head gasket inspection, and hydraulic brake line rebuild",
    status: "IN_PROGRESS",
    approvalStatus: "APPROVED",
    scheduledDate: "2026-09-18T09:00:00.000Z",
    createdAt: "2026-09-17T09:30:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z",
    approvalRequest: {
      id: "appr-3003-1",
      status: "APPROVED",
      estimatedCost: 12500.0,
      decidedBy: "08df2719-0473-4a31-8b5c-dc977d6006c5",
      decisionDate: "2026-09-17T11:00:00.000Z",
      remarks: "Approved for immediate emergency repair. Towed from Panacan highway.",
    },
  },
  {
    id: "wo-5005-1",
    truckId: "trk-55555555-6666-7777-8888-999999999999",
    plateNumber: "ABC-5005",
    truckModel: "Isuzu Forward F-Series",
    truckStatus: "UNDER_MAINTENANCE",
    maintenanceTypeId: 2,
    maintenanceTypeName: "CORRECTIVE",
    inspectionId: "insp-5005-1",
    incidentReportId: null,
    shopName: "Bunawan Heavy Repair Center",
    estimatedCost: 3800.0,
    description: "Exhaust vibration damper replacement and hanger bracket reinforcement",
    status: "SCHEDULED",
    approvalStatus: "APPROVED",
    scheduledDate: "2026-09-22T08:00:00.000Z",
    createdAt: "2026-09-18T13:00:00.000Z",
    updatedAt: "2026-09-18T13:00:00.000Z",
  },
  {
    id: "wo-2002-1",
    truckId: "trk-22222222-3333-4444-5555-666666666666",
    plateNumber: "ABC-2002",
    truckModel: "Mitsubishi Fuso Canter",
    truckStatus: "ACTIVE",
    maintenanceTypeId: 1,
    maintenanceTypeName: "PREVENTIVE",
    inspectionId: null,
    incidentReportId: null,
    shopName: "Bunawan Heavy Repair Center",
    estimatedCost: 4500.0,
    description: "Scheduled 45,000-km preventive maintenance service and tire rotation",
    status: "COMPLETED",
    approvalStatus: "APPROVED",
    scheduledDate: "2026-09-10T08:00:00.000Z",
    createdAt: "2026-09-09T10:00:00.000Z",
    updatedAt: "2026-09-11T16:00:00.000Z",
  },
];

/**
 * Helper to get fresh cached work orders or default mock
 */
function getInMemoryWorkOrders() {
  try {
    const cached = localStorage.getItem("app_work_orders_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached work orders:", e);
  }
  return [...DEFAULT_MOCK_WORK_ORDERS];
}

/**
 * Helper to persist mock work orders state to localStorage
 */
function saveInMemoryWorkOrders(orders) {
  try {
    localStorage.setItem("app_work_orders_cache", JSON.stringify(orders));
  } catch (e) {
    console.error("Error saving work orders cache:", e);
  }
}

/**
 * Initial seed maintenance logs for mock mode
 */
const DEFAULT_MOCK_MAINTENANCE_LOGS = [
  {
    id: "mlog-2002-1",
    workOrderId: "wo-2002-1",
    truckId: "trk-22222222-3333-4444-5555-666666666666",
    plateNumber: "ABC-2002",
    truckModel: "Mitsubishi Fuso Canter",
    maintenanceTypeId: 1,
    maintenanceTypeName: "PREVENTIVE",
    severity: "LOW",
    dateStarted: "2026-09-10T08:00:00.000Z",
    dateResolved: "2026-09-11T16:00:00.000Z",
    partsCost: 3200.0,
    laborCost: 1500.0,
    totalCost: 4700.0,
    downtimeDays: 1,
    odometerAtService: 46000,
    officialReceiptNumber: "OR-2026-77881",
    createdAt: "2026-09-11T16:15:00.000Z",
    shopName: "Bunawan Heavy Repair Center",
    description: "Scheduled 45,000-km preventive maintenance service and tire rotation",
  },
  {
    id: "mlog-4004-1",
    workOrderId: "wo-4004-prev",
    truckId: "trk-44444444-5555-6666-7777-888888888888",
    plateNumber: "ABC-4004",
    truckModel: "Hino Dutro 300",
    maintenanceTypeId: 2,
    maintenanceTypeName: "CORRECTIVE",
    severity: "MEDIUM",
    dateStarted: "2026-08-25T08:00:00.000Z",
    dateResolved: "2026-08-26T17:00:00.000Z",
    partsCost: 2800.0,
    laborCost: 1200.0,
    totalCost: 4000.0,
    downtimeDays: 1,
    odometerAtService: 25000,
    officialReceiptNumber: "OR-2026-66552",
    createdAt: "2026-08-26T17:30:00.000Z",
    shopName: "Bajada Brake & Clutch Service",
    description: "Brake pad relining and master cylinder bleeding",
  },
  {
    id: "mlog-1001-1",
    workOrderId: "wo-1001-prev",
    truckId: "trk-11111111-2222-3333-4444-555555555555",
    plateNumber: "ABC-1001",
    truckModel: "Isuzu Elf N-Series",
    maintenanceTypeId: 1,
    maintenanceTypeName: "PREVENTIVE",
    severity: "MEDIUM",
    dateStarted: "2026-09-18T08:00:00.000Z",
    dateResolved: "2026-09-19T17:00:00.000Z",
    partsCost: 4500.0,
    laborCost: 2200.5,
    totalCost: 6700.5,
    downtimeDays: 1,
    odometerAtService: 46200,
    officialReceiptNumber: "OR-2026-88991",
    createdAt: "2026-09-19T17:05:00.000Z",
    shopName: "Bunawan Heavy Repair Center",
    description: "5,000-km preventive maintenance overhaul and brake pad replacement",
  },
];

/**
 * Helper to get fresh cached maintenance logs or default mock
 */
function getInMemoryMaintenanceLogs() {
  try {
    const cached = localStorage.getItem("app_maintenance_logs_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached maintenance logs:", e);
  }
  return [...DEFAULT_MOCK_MAINTENANCE_LOGS];
}

/**
 * Helper to persist mock maintenance logs state to localStorage
 */
function saveInMemoryMaintenanceLogs(logs) {
  try {
    localStorage.setItem("app_maintenance_logs_cache", JSON.stringify(logs));
  } catch (e) {
    console.error("Error saving maintenance logs cache:", e);
  }
}

/**
 * Initial seed recurring issues analytics for mock mode
 */
const DEFAULT_MOCK_RECURRING_ISSUES = [
  {
    truckId: "trk-11111111-2222-3333-4444-555555555555",
    plateNumber: "ABC-1001",
    truckModel: "Isuzu Elf N-Series",
    incidentTypeId: 1,
    incidentTypeName: "MECHANICAL_DEFECT",
    defectCategory: "ENGINE_OVERHEAT",
    occurrenceCount: 3,
    latestSeverity: "HIGH",
    latestIncidentDate: "2026-09-18T14:30:00.000Z",
    descriptions: [
      "Coolant reservoir cracked and boiling over during highway route.",
      "Radiator cap valve pressure failure resulting in coolant venting.",
      "Auxiliary radiator electric fan intermittent failure in heavy traffic.",
    ],
  },
  {
    truckId: "trk-33333333-4444-5555-6666-777777777777",
    plateNumber: "ABC-3003",
    truckModel: "Hino 300 Series",
    incidentTypeId: 1,
    incidentTypeName: "MECHANICAL_DEFECT",
    defectCategory: "BRAKE_HYDRAULIC_LEAK",
    occurrenceCount: 2,
    latestSeverity: "CRITICAL",
    latestIncidentDate: "2026-09-17T08:15:00.000Z",
    descriptions: [
      "Hydraulic brake line weeping fluid near rear drum axle.",
      "Brake line rupture with pressure drop; vehicle grounded immediately roadside.",
    ],
  },
  {
    truckId: "trk-22222222-3333-4444-5555-666666666666",
    plateNumber: "ABC-2002",
    truckModel: "Mitsubishi Fuso Canter",
    incidentTypeId: 3,
    incidentTypeName: "TIRE_FAILURE",
    defectCategory: "TIRE_PUNCTURE_PRESSURE",
    occurrenceCount: 2,
    latestSeverity: "LOW",
    latestIncidentDate: "2026-09-18T09:30:00.000Z",
    descriptions: [
      "Rear right outer tire valve pin leak repaired at vulcanizing shop.",
      "Rear right tire slow pressure deflation observed during morning check.",
    ],
  },
];

/**
 * Helper to resolve driver object from driverId (checks cache and fallback mock)
 */
function resolveDriver(driverId) {
  if (!driverId) return null;
  let userList = [];
  try {
    const cached = localStorage.getItem("app_users_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userList = parsed;
      }
    }
  } catch (e) {
    console.error("Error reading cached users:", e);
  }

  if (userList.length === 0) {
    userList = mockUsers?.data?.users || [];
  }

  const found = userList.find((u) => u.id === driverId || u.userId === driverId);
  if (!found) return null;
  return {
    id: found.id || found.userId,
    firstName: found.firstName || "",
    lastName: found.lastName || "",
    phone: found.phone || "",
    username: found.username || "",
    role: found.role || "Driver",
  };
}

/**
 * Fleet & Maintenance API Service
 * Interacts with /api/fleet endpoints based on docs/API Contract/fleet-and-maintenance.api.md
 */
export const fleetApi = {
  /**
   * Verify admin password before performing sensitive operations.
   * Delegates directly to authApi.
   * @param {string} password
   * @param {string} [username]
   * @returns {Promise<boolean>}
   */
  async verifyAdminPassword(password, username) {
    return authApi.verifyPassword(password, username);
  },

  /**
   * View Fleet Overview Metrics.
   * @returns {Promise<{ metrics: object, summary: object }>}
   */
  async getFleetOverview() {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();
      const totalVehicles = inMemoryTrucks.length;
      const activeVehicles = inMemoryTrucks.filter((t) => t.status === "ACTIVE");
      const availableVehicles = activeVehicles.length;
      const assignedVehicles = activeVehicles.filter((t) => !!t.driverId).length;
      const unassignedVehicles = availableVehicles - assignedVehicles;
      const underMaintenanceVehicles = inMemoryTrucks.filter(
        (t) => t.status === "UNDER_MAINTENANCE"
      ).length;
      const inactiveVehicles = inMemoryTrucks.filter(
        (t) => t.status === "INACTIVE" || t.status === "RETIRED"
      ).length;

      const operationalRatePercent = totalVehicles > 0
        ? Number(((availableVehicles / totalVehicles) * 100).toFixed(1))
        : 0;

      return {
        metrics: {
          totalVehicles,
          availableVehicles,
          assignedVehicles,
          unassignedVehicles,
          underMaintenanceVehicles,
          inactiveVehicles,
        },
        summary: {
          operationalTotal: availableVehicles,
          operationalRatePercent,
        },
      };
    }

    const result = await apiClient("/fleet/overview");
    return result.data;
  },

  /**
   * View Fleet Availability.
   * @param {object} [params] - { driverAssigned }
   * @returns {Promise<{ availableCount: number, vehicles: Array }>}
   */
  async getFleetAvailability(params = {}) {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();
      let list = inMemoryTrucks.filter((t) => t.status === "ACTIVE");
      if (params.driverAssigned !== undefined) {
        const assignedBool =
          params.driverAssigned === true || params.driverAssigned === "true";
        list = list.filter((t) => (!!t.driverId) === assignedBool);
      }
      return {
        availableCount: list.length,
        vehicles: list,
      };
    }

    const query = new URLSearchParams();
    if (params.driverAssigned !== undefined) {
      query.append("driverAssigned", params.driverAssigned);
    }
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/availability${queryString}`);
    return result.data;
  },

  /**
   * List All Vehicles (with search and status filters).
   * @param {object} [params] - { status, search, driverAssigned }
   * @returns {Promise<Array>} Array of truck objects
   */
  async getTrucks(params = {}) {
    if (isMock) {
      await delay(250);
      let list = getInMemoryTrucks();

      // Status filter
      if (params.status && params.status !== "All") {
        list = list.filter(
          (t) =>
            (t.status || "").toUpperCase() === params.status.toUpperCase() ||
            (t.operationalStatus || "").toUpperCase() === params.status.toUpperCase()
        );
      }

      // Search filter (plateNumber, model, driver)
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (t) =>
            (t.plateNumber || "").toLowerCase().includes(q) ||
            (t.model || "").toLowerCase().includes(q) ||
            (t.driver?.firstName || "").toLowerCase().includes(q) ||
            (t.driver?.lastName || "").toLowerCase().includes(q) ||
            (t.driver?.username || "").toLowerCase().includes(q)
        );
      }

      // Driver assigned filter
      if (params.driverAssigned !== undefined) {
        const assignedBool =
          params.driverAssigned === true || params.driverAssigned === "true";
        list = list.filter((t) => (!!t.driverId) === assignedBool);
      }

      // Dynamically attach hasActiveWorkOrder, activeWorkOrder, and latest safety inspection in mock mode
      const orders = getInMemoryWorkOrders();
      const inspections = getInMemoryInspections();
      list = list.map((t) => {
        const activeOrder = orders.find(
          (wo) =>
            (wo.truckId === t.id ||
              wo.truckId === t.truckId ||
              wo.plateNumber === t.plateNumber ||
              wo.truck?.plateNumber === t.plateNumber) &&
            ["PENDING", "APPROVED", "SCHEDULED", "IN_PROGRESS"].includes(wo.status)
        );

        const matchingInspections = inspections
          .filter(
            (i) =>
              i.truckId === t.id ||
              i.truckId === t.truckId ||
              (t.plateNumber && i.plateNumber === t.plateNumber)
          )
          .sort(
            (a, b) =>
              new Date(b.inspectionDate || 0) - new Date(a.inspectionDate || 0)
          );
        const latestInspection = matchingInspections[0] || t.latestInspection || null;

        return {
          ...t,
          hasActiveWorkOrder: Boolean(activeOrder),
          activeWorkOrder: activeOrder || null,
          latestInspection,
          lastInspectionResult: latestInspection?.result || t.lastInspectionResult || null,
          hasPendingIssues: latestInspection?.result === "NEEDS_ATTENTION",
        };
      });

      return list;
    }

    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.driverAssigned !== undefined) query.append("driverAssigned", params.driverAssigned);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/trucks${queryString}`);
    return result.data.trucks;
  },

  /**
   * Get Vehicle by ID.
   * @param {string} id - Truck UUID
   * @returns {Promise<object>} Truck object
   */
  async getTruckById(id) {
    if (isMock) {
      await delay(150);
      const inMemoryTrucks = getInMemoryTrucks();
      const truck = inMemoryTrucks.find((t) => t.id === id || t.truckId === id);
      if (!truck) {
        const error = new Error("Truck not found");
        error.status = 404;
        throw error;
      }
      return truck;
    }

    const result = await apiClient(`/fleet/trucks/${id}`);
    return result.data.truck;
  },

  /**
   * Register Vehicle.
   * @param {{ plateNumber: string, model: string, yearModel: number, currentOdometer?: number, lastPmOdometer?: number, status?: string, driverId?: string, driver?: object }} truckData
   * @returns {Promise<{ truck: object }>} Created truck response
   */
  async createTruck(truckData) {
    if (isMock) {
      await delay(300);
      const inMemoryTrucks = getInMemoryTrucks();
      const initialStatus = truckData.status || "ACTIVE";
      const isAvailable = initialStatus === "ACTIVE";
      const shouldReleaseDriver = initialStatus === "INACTIVE" || initialStatus === "RETIRED";
      const driverId = shouldReleaseDriver ? null : (truckData.driverId || null);
      const driverObj = (driverId && truckData.driver) ? truckData.driver : resolveDriver(driverId);

      const newTruck = {
        id: `trk-${Date.now()}`,
        plateNumber: truckData.plateNumber,
        model: truckData.model,
        yearModel: Number(truckData.yearModel) || new Date().getFullYear(),
        currentOdometer: Number(truckData.currentOdometer) || 0,
        lastPmOdometer: Number(truckData.lastPmOdometer) || 0,
        status: initialStatus,
        operationalStatus: initialStatus,
        isAvailable,
        driverId,
        driver: driverObj,
        driverName: driverObj
          ? `${driverObj.firstName || ""} ${driverObj.lastName || ""}`.trim() || driverObj.username
          : "No Assigned",
        designatedRoute: truckData.designatedRoute || "No Route Assigned",
        tankNumber: truckData.tankNumber || "1234",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryTrucks.unshift(newTruck);
      saveInMemoryTrucks(inMemoryTrucks);
      return { truck: newTruck };
    }

    const result = await apiClient("/fleet/trucks", {
      method: "POST",
      body: truckData,
    });
    return result.data;
  },

  /**
   * Update Vehicle Information.
   * Seamlessly handles vehicle specs, operational status, and driver assignments across API endpoints.
   * @param {string} id - Truck UUID
   * @param {object} truckData - Fields to update
   * @returns {Promise<{ truck: object }>} Updated truck response
   */
  async updateTruck(id, truckData) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      const newStatus = truckData.status || existing.status || "ACTIVE";
      if (newStatus === "ACTIVE" && existing.status !== "ACTIVE") {
        const orders = getInMemoryWorkOrders();
        const hasActiveWorkOrder = orders.some(
          (wo) =>
            (wo.truckId === id ||
              wo.truckId === existing.truckId ||
              wo.plateNumber === existing.plateNumber ||
              wo.truck?.plateNumber === existing.plateNumber) &&
            ["PENDING", "APPROVED", "SCHEDULED", "IN_PROGRESS"].includes(wo.status)
        );
        if (hasActiveWorkOrder) {
          const err = new Error(
            "Cannot activate vehicle: This truck is currently linked to an ongoing work order. Complete or cancel the work order first."
          );
          err.status = 409;
          err.code = "TRUCK_HAS_ACTIVE_WORK_ORDER";
          throw err;
        }
      }

      const isAvailable = newStatus === "ACTIVE";

      // If status is INACTIVE or RETIRED, release driver
      const shouldReleaseDriver = newStatus === "INACTIVE" || newStatus === "RETIRED";

      let driverId = existing.driverId;
      if (truckData.driverId !== undefined) {
        driverId = truckData.driverId || null;
      }
      if (shouldReleaseDriver) {
        driverId = null;
      }

      let driverObj = existing.driver;
      if (truckData.driver !== undefined) {
        driverObj = truckData.driver;
      } else if (truckData.driverId !== undefined) {
        driverObj = resolveDriver(truckData.driverId);
      }
      if (shouldReleaseDriver || !driverId) {
        driverObj = null;
      }

      const driverName = driverObj
        ? `${driverObj.firstName || ""} ${driverObj.lastName || ""}`.trim() || driverObj.username
        : "No Assigned";

      const updated = {
        ...existing,
        ...truckData,
        id: id || existing.id,
        driverId,
        driver: driverObj,
        driverName,
        status: newStatus,
        operationalStatus: newStatus,
        isAvailable,
        yearModel: truckData.yearModel !== undefined ? Number(truckData.yearModel) : existing.yearModel,
        currentOdometer: truckData.currentOdometer !== undefined ? Number(truckData.currentOdometer) : existing.currentOdometer,
        lastPmOdometer: truckData.lastPmOdometer !== undefined ? Number(truckData.lastPmOdometer) : existing.lastPmOdometer,
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      } else {
        inMemoryTrucks.unshift(updated);
      }
      saveInMemoryTrucks(inMemoryTrucks);
      return { truck: updated };
    }

    // LIVE REST BACKEND: Orchestrate across API contract endpoints
    let latestTruck = null;

    // 1. Vehicle specs update (/api/fleet/trucks/:id)
    const infoPayload = {};
    if (truckData.plateNumber !== undefined) infoPayload.plateNumber = truckData.plateNumber;
    if (truckData.model !== undefined) infoPayload.model = truckData.model;
    if (truckData.yearModel !== undefined) infoPayload.yearModel = Number(truckData.yearModel);
    if (truckData.currentOdometer !== undefined) infoPayload.currentOdometer = Number(truckData.currentOdometer);
    if (truckData.lastPmOdometer !== undefined) infoPayload.lastPmOdometer = Number(truckData.lastPmOdometer);

    if (Object.keys(infoPayload).length > 0) {
      const res = await apiClient(`/fleet/trucks/${id}`, {
        method: "PATCH",
        body: infoPayload,
      });
      latestTruck = res.data?.truck || res.data;
    }

    // 2. Status update (/api/fleet/trucks/:id/status)
    if (truckData.status) {
      const res = await apiClient(`/fleet/trucks/${id}/status`, {
        method: "PATCH",
        body: { status: truckData.status },
      });
      latestTruck = res.data?.truck || res.data || latestTruck;
    }

    // 3. Driver assignment / unassignment endpoints (/assign and /unassign)
    if (truckData.driverId === null || truckData.driverId === "") {
      const res = await this.unassignDriver(id);
      latestTruck = res.data?.truck || res.truck || latestTruck;
    } else if (truckData.driverId) {
      const res = await this.assignDriver(id, { driverId: truckData.driverId });
      latestTruck = res.data?.truck || res.truck || latestTruck;
    }

    if (!latestTruck) {
      latestTruck = await this.getTruckById(id);
    }

    return { truck: latestTruck };
  },

  /**
   * Assign Driver to Vehicle.
   * @param {string} id - Truck UUID
   * @param {{ driverId: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Updated driver assignment response
   */
  async assignDriver(id, { driverId }) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      // Invariant: check if vehicle already has an assigned driver
      if (existing.driverId && existing.driverId !== driverId) {
        const error = new Error(
          "This vehicle already has an assigned driver. Please unassign the current driver first."
        );
        error.status = 409;
        throw error;
      }

      // Invariant: check if driver is already assigned to another active truck
      const otherTruck = inMemoryTrucks.find(
        (t) => t.id !== id && (t.driverId === driverId || t.driver?.id === driverId) && t.status === "ACTIVE"
      );
      if (otherTruck) {
        const driverObj = resolveDriver(driverId);
        const driverName = driverObj
          ? `${driverObj.firstName} ${driverObj.lastName}`.trim()
          : "Driver";
        const error = new Error(
          `Driver '${driverName}' is already assigned to vehicle '${otherTruck.plateNumber}'. The driver must be unassigned from vehicle '${otherTruck.plateNumber}' first.`
        );
        error.status = 409;
        throw error;
      }

      const driverObj = resolveDriver(driverId);
      const updated = {
        ...existing,
        id: id || existing.id,
        driverId,
        driver: driverObj,
        driverName: driverObj
          ? `${driverObj.firstName || ""} ${driverObj.lastName || ""}`.trim() || driverObj.username
          : "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Driver successfully assigned",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/assign`, {
      method: "PATCH",
      body: { driverId },
    });
    return result.data;
  },

  /**
   * Unassign Driver from Vehicle.
   * @param {string} id - Truck UUID
   * @returns {Promise<{ truck: object, message: string }>} Unassigned driver response
   */
  async unassignDriver(id) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      const updated = {
        ...existing,
        id: id || existing.id,
        driverId: null,
        driver: null,
        driverName: "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Driver successfully unassigned",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/unassign`, {
      method: "PATCH",
    });
    return result.data;
  },

  /**
   * Driver Directory (List All Drivers with live assignment status).
   * @param {object} [params] - { search, availableOnly }
   * @returns {Promise<{ count: number, drivers: Array }>}
   */
  async getDrivers(params = {}) {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();
      let userList = [];
      try {
        const cached = localStorage.getItem("app_users_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            userList = parsed;
          }
        }
      } catch (e) {
        console.error("Error reading cached users:", e);
      }

      if (userList.length === 0) {
        userList = mockUsers?.data?.users || [];
      }

      let drivers = userList
        .filter(
          (u) =>
            (u.role || "").toLowerCase().trim() === "driver" &&
            u.isActive !== false &&
            !u.isBlocked
        )
        .map((u) => {
          const uId = u.id || u.userId;
          const assignedTruck = inMemoryTrucks.find(
            (t) =>
              (t.driverId === uId || t.driver?.id === uId) &&
              t.status === "ACTIVE"
          );
          const isAssigned = !!assignedTruck;
          return {
            id: uId,
            username: u.username,
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            phone: u.phone || "",
            role: u.role || "Driver",
            isAssigned,
            status: isAssigned ? "ASSIGNED" : "AVAILABLE",
            assignedTruck: assignedTruck
              ? {
                  id: assignedTruck.id,
                  plateNumber: assignedTruck.plateNumber,
                  model: assignedTruck.model,
                }
              : null,
          };
        });

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        drivers = drivers.filter(
          (d) =>
            (d.firstName || "").toLowerCase().includes(q) ||
            (d.lastName || "").toLowerCase().includes(q) ||
            (d.username || "").toLowerCase().includes(q)
        );
      }

      if (params.availableOnly === true || params.availableOnly === "true") {
        drivers = drivers.filter((d) => !d.isAssigned);
      }

      return {
        count: drivers.length,
        drivers,
      };
    }

    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.availableOnly !== undefined) query.append("availableOnly", params.availableOnly);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/drivers${queryString}`);
    return result.data;
  },

  /**
   * List Available Drivers (Active, unassigned drivers ready for vehicle assignment).
   * @returns {Promise<Array>} List of available driver objects
   */
  async getAvailableDrivers() {
    if (isMock) {
      const res = await this.getDrivers({ availableOnly: true });
      return res.drivers || [];
    }

    const result = await apiClient("/fleet/drivers/available");
    return result.data.drivers || [];
  },

  /**
   * View Vehicle Status.
   * @param {string} id - Truck UUID
   * @returns {Promise<object>} Status object
   */
  async getTruckStatus(id) {
    if (isMock) {
      await delay(150);
      const inMemoryTrucks = getInMemoryTrucks();
      const truck = inMemoryTrucks.find((t) => t.id === id || t.truckId === id);
      if (!truck) {
        const error = new Error("Truck not found");
        error.status = 404;
        throw error;
      }
      return {
        id: truck.id,
        plateNumber: truck.plateNumber,
        model: truck.model,
        status: truck.status,
        operationalStatus: truck.status,
        isAvailable: truck.isAvailable,
        driver: truck.driver,
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/status`);
    return result.data.truck;
  },

  /**
   * Set Vehicle Availability Status.
   * @param {string} id - Truck UUID
   * @param {{ status: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Updated status response
   */
  async updateTruckStatus(id, { status }) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};
      if (status === "ACTIVE") {
        const orders = getInMemoryWorkOrders();
        const hasActiveWorkOrder = orders.some(
          (wo) =>
            (wo.truckId === id ||
              wo.truckId === existing.truckId ||
              wo.plateNumber === existing.plateNumber ||
              wo.truck?.plateNumber === existing.plateNumber) &&
            ["PENDING", "APPROVED", "SCHEDULED", "IN_PROGRESS"].includes(wo.status)
        );
        if (hasActiveWorkOrder) {
          const err = new Error(
            "Cannot activate vehicle: This truck is currently linked to an ongoing work order. Complete or cancel the work order first."
          );
          err.status = 409;
          err.code = "TRUCK_HAS_ACTIVE_WORK_ORDER";
          throw err;
        }
      }

      const isAvailable = status === "ACTIVE";
      // If inactive or retired, release driver
      const shouldReleaseDriver = status === "INACTIVE" || status === "RETIRED";
      const driverId = shouldReleaseDriver ? null : existing.driverId;
      const driver = shouldReleaseDriver ? null : existing.driver;

      const updated = {
        ...existing,
        id: id || existing.id,
        status,
        operationalStatus: status,
        isAvailable,
        driverId,
        driver,
        driverName: driver
          ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || driver.username
          : "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Vehicle availability status updated",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return result.data;
  },

  /**
   * Deactivate Vehicle (Soft decommission with password confirmation).
   * @param {string} id - Truck UUID
   * @param {{ confirmPassword?: string }} payload
   * @returns {Promise<{ truck: object, message: string }>} Deactivated vehicle response
   */
  async deactivateTruck(id, { confirmPassword }) {
    if (isMock) {
      await delay(300);
      if (!confirmPassword) {
        const error = new Error("Admin password confirmation is required");
        error.status = 401;
        throw error;
      }

      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};

      const updated = {
        ...existing,
        id: id || existing.id,
        status: "INACTIVE",
        operationalStatus: "INACTIVE",
        isAvailable: false,
        driverId: null,
        driver: null,
        driverName: "No Assigned",
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        message: "Vehicle successfully deactivated",
      };
    }

    const password =
      typeof confirmPassword === "object"
        ? confirmPassword?.confirmPassword || confirmPassword?.adminPassword
        : confirmPassword;
    const result = await apiClient(`/fleet/trucks/${id}/deactivate`, {
      method: "PATCH",
      body: {
        confirmPassword: password,
        adminPassword: password,
        confirm_password: password,
        admin_password: password,
      },
    });
    return result.data;
  },

  /**
   * Fleet Register Page Options.
   * @returns {Promise<{ availableDrivers: Array, statusOptions: Array }>}
   */
  async getRegisterOptions() {
    if (isMock) {
      const res = await this.getDrivers({ availableOnly: true });
      return {
        availableDrivers: res.drivers || [],
        statusOptions: ["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE", "RETIRED"],
      };
    }

    const result = await apiClient("/fleet/register-options");
    return result.data;
  },

  /**
   * Record Vehicle Mileage.
   * @param {string} id - Truck UUID
   * @param {{ odometer: number }} payload
   * @returns {Promise<{ truck: object, mileageSummary: object, message: string }>}
   */
  async recordMileage(id, { odometer }) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === id || t.truckId === id);
      const existing = index !== -1 ? inMemoryTrucks[index] : {};
      const current = existing.currentOdometer || 0;

      if (Number(odometer) > 999999) {
        const error = new Error("Odometer reading cannot exceed 999,999 km.");
        error.status = 400;
        throw error;
      }

      if (Number(odometer) < current) {
        const error = new Error(
          `New odometer reading (${odometer} km) cannot be less than current recorded odometer (${current} km)`
        );
        error.status = 400;
        throw error;
      }

      const previousOdometer = current;
      const newOdometer = Number(odometer);
      const distanceRecorded = newOdometer - previousOdometer;
      const lastPm = existing.lastPmOdometer || 0;
      const distanceSinceLastPm = newOdometer - lastPm;

      const updated = {
        ...existing,
        id: id || existing.id,
        currentOdometer: newOdometer,
        updatedAt: new Date().toISOString(),
      };

      if (index !== -1) {
        inMemoryTrucks[index] = updated;
      }
      saveInMemoryTrucks(inMemoryTrucks);

      return {
        truck: updated,
        mileageSummary: {
          previousOdometer,
          currentOdometer: newOdometer,
          distanceRecorded,
          lastPmOdometer: lastPm,
          distanceSinceLastPm,
        },
        message: "Vehicle mileage recorded successfully",
      };
    }

    const result = await apiClient(`/fleet/trucks/${id}/mileage`, {
      method: "PATCH",
      body: { odometer },
    });
    return result.data;
  },

  /**
   * Record Post-Dispatch Return Odometer.
   * Enforces monotonic odometer reading and computes 5,000-km PM progress.
   * Endpoint: POST /api/fleet/maintenance/odometer
   * @param {{ truckId: string, odometerReading: number, source?: string, notes?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: object }>}
   */
  async recordReturnOdometer({ truckId, odometerReading, source = "POST_DISPATCH_RETURN", notes = "" }) {
    if (isMock) {
      await delay(250);
      const inMemoryTrucks = getInMemoryTrucks();
      const index = inMemoryTrucks.findIndex((t) => t.id === truckId || t.truckId === truckId);
      const truck = index !== -1 ? inMemoryTrucks[index] : null;

      if (!truck) {
        const err = new Error("Vehicle not found");
        err.status = 404;
        throw err;
      }

      const currentOdo = Number(truck.currentOdometer) || 0;
      const newOdo = Number(odometerReading);

      if (isNaN(newOdo) || newOdo < 0) {
        const err = new Error("A valid non-negative odometer reading is required.");
        err.status = 400;
        throw err;
      }

      if (newOdo > 999999) {
        const err = new Error("Odometer reading cannot exceed 999,999 km.");
        err.status = 400;
        throw err;
      }

      if (newOdo < currentOdo) {
        const err = new Error(
          `New odometer reading (${newOdo.toLocaleString()} km) cannot be less than current odometer reading (${currentOdo.toLocaleString()} km).`
        );
        err.status = 400;
        throw err;
      }

      const previousOdometer = currentOdo;
      const distanceDrivenThisTrip = newOdo - previousOdometer;
      const lastPmOdometer = Number(truck.lastPmOdometer) || 0;
      const distanceSinceLastPm = newOdo - lastPmOdometer;
      const isPmDue = distanceSinceLastPm >= 5000;
      const remainingKmBeforePm = Math.max(0, 5000 - distanceSinceLastPm);

      const updatedTruck = {
        ...truck,
        currentOdometer: newOdo,
        distanceSinceLastPm,
        isPmDue,
        remainingKmBeforePm,
        updatedAt: new Date().toISOString(),
      };

      inMemoryTrucks[index] = updatedTruck;
      saveInMemoryTrucks(inMemoryTrucks);

      const logs = getInMemoryOdometerLogs();
      const logEntry = {
        id: `odo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        truckId,
        odometerReading: newOdo,
        distanceDelta: distanceDrivenThisTrip,
        loggedBy: "08df2719-0473-4a31-8b5c-dc977d6006c5",
        loggedByName: "Super Admin (Logistics Supervisor)",
        source: source || "POST_DISPATCH_RETURN",
        notes: notes || "",
        loggedAt: new Date().toISOString(),
      };
      logs.unshift(logEntry);
      saveInMemoryOdometerLogs(logs);

      return {
        status: "success",
        message: "Odometer reading recorded successfully.",
        data: {
          logId: logEntry.id,
          truckId,
          plateNumber: truck.plateNumber,
          currentOdometer: newOdo,
          previousOdometer,
          distanceDrivenThisTrip,
          lastPmOdometer,
          distanceSinceLastPm,
          isPmDue,
          remainingKmBeforePm,
          loggedAt: logEntry.loggedAt,
          truck: updatedTruck,
        },
      };
    }

    const result = await apiClient("/fleet/maintenance/odometer", {
      method: "POST",
      body: {
        truckId,
        odometerReading: Number(odometerReading),
        source: source || "POST_DISPATCH_RETURN",
        notes: notes || "",
      },
    });
    return result;
  },

  /**
   * View Truck Odometer Log History.
   * Endpoint: GET /api/fleet/maintenance/odometer/truck/:truckId
   * @param {string} truckId
   * @param {object} [params] - { page, limit }
   * @returns {Promise<{ status: string, data: object }>}
   */
  async getTruckOdometerLogs(truckId, params = {}) {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();
      const truck = inMemoryTrucks.find((t) => t.id === truckId || t.truckId === truckId);
      const allLogs = getInMemoryOdometerLogs();
      const truckLogs = allLogs.filter((l) => l.truckId === truckId);

      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.max(1, Number(params.limit) || 20);
      const totalItems = truckLogs.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const startIndex = (page - 1) * limit;
      const paginatedLogs = truckLogs.slice(startIndex, startIndex + limit);

      return {
        status: "success",
        data: {
          truckId,
          plateNumber: truck?.plateNumber || "",
          model: truck?.model || "",
          currentOdometer: truck?.currentOdometer || 0,
          lastPmOdometer: truck?.lastPmOdometer || 0,
          count: paginatedLogs.length,
          total: totalItems,
          page,
          limit,
          logs: paginatedLogs,
        },
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/maintenance/odometer/truck/${truckId}${queryString}`);
    return result;
  },

  /**
   * View Fleet PM Status Overview.
   * Endpoint: GET /api/fleet/maintenance/pm-overview
   * @param {object} [params] - { status, search, isPmDue }
   * @returns {Promise<{ status: string, data: object }>}
   */
  async getPmOverview(params = {}) {
    if (isMock) {
      await delay(200);
      const inMemoryTrucks = getInMemoryTrucks();

      let pmTrucks = inMemoryTrucks.map((t) => {
        const currentOdo = Number(t.currentOdometer) || 0;
        const lastPmOdo = Number(t.lastPmOdometer) || 0;
        const distanceSinceLastPm = currentOdo - lastPmOdo;
        const isPmDue = distanceSinceLastPm >= 5000;
        const remainingKmBeforePm = Math.max(0, 5000 - distanceSinceLastPm);

        return {
          ...t,
          distanceSinceLastPm,
          isPmDue,
          remainingKmBeforePm,
          driverName: t.driver
            ? `${t.driver.firstName || ""} ${t.driver.lastName || ""}`.trim() || t.driver.username
            : t.driverName || "No Assigned",
        };
      });

      if (params.status && params.status !== "All") {
        pmTrucks = pmTrucks.filter(
          (t) => (t.status || "").toUpperCase() === params.status.toUpperCase()
        );
      }
      if (params.isPmDue !== undefined && params.isPmDue !== "") {
        const dueBool = params.isPmDue === true || params.isPmDue === "true";
        pmTrucks = pmTrucks.filter((t) => t.isPmDue === dueBool);
      }
      if (params.search) {
        const q = params.search.toLowerCase().trim();
        pmTrucks = pmTrucks.filter(
          (t) =>
            (t.plateNumber || "").toLowerCase().includes(q) ||
            (t.model || "").toLowerCase().includes(q)
        );
      }

      const totalVehicles = inMemoryTrucks.length;
      const operationalVehicles = inMemoryTrucks.filter((t) => t.status === "ACTIVE").length;
      const pmDueTotal = inMemoryTrucks.filter(
        (t) => (Number(t.currentOdometer) || 0) - (Number(t.lastPmOdometer) || 0) >= 5000
      ).length;
      const operationalPmDue = inMemoryTrucks.filter(
        (t) => t.status === "ACTIVE" && (Number(t.currentOdometer) || 0) - (Number(t.lastPmOdometer) || 0) >= 5000
      ).length;

      return {
        status: "success",
        data: {
          count: pmTrucks.length,
          summary: {
            totalVehicles,
            operationalVehicles,
            pmDueTotal,
            operationalPmDue,
          },
          trucks: pmTrucks,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.isPmDue !== undefined) query.append("isPmDue", params.isPmDue);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const result = await apiClient(`/fleet/maintenance/pm-overview${queryString}`);
    return result;
  },

  /**
   * Set Vehicle Availability Status (Mark truck unavailable / change operational condition).
   * Endpoints: PATCH /api/fleet/availability/:id/status or PATCH /api/fleet/trucks/:id/status
   * @param {string} id - Truck UUID
   * @param {{ status: string, reason?: string }} payload
   * @returns {Promise<{ truck: object, message: string }>}
   */
  async setVehicleAvailabilityStatus(id, { status, reason }) {
    if (isMock) {
      await delay(250);
      return this.updateTruckStatus(id, { status });
    }

    try {
      const result = await apiClient(`/fleet/availability/${id}/status`, {
        method: "PATCH",
        body: { status, reason },
      });
      return result.data;
    } catch {
      // Fallback to /fleet/trucks/:id/status
      const result = await apiClient(`/fleet/trucks/${id}/status`, {
        method: "PATCH",
        body: { status, reason },
      });
      return result.data;
    }
  },

  /**
   * Assign Driver to Vehicle with 1:1 soft-binding invariant.
   * Endpoints: PUT /api/fleet/trucks/:id/driver or PATCH /api/fleet/trucks/:id/assign
   * @param {string} id - Truck UUID
   * @param {{ driverId: string }} payload
   * @returns {Promise<{ truck: object, message: string }>}
   */
  async assignDriverToTruck(id, { driverId }) {
    if (isMock) {
      return this.assignDriver(id, { driverId });
    }

    try {
      const result = await apiClient(`/fleet/trucks/${id}/driver`, {
        method: "PUT",
        body: { driverId },
      });
      return result.data;
    } catch {
      return this.assignDriver(id, { driverId });
    }
  },

  // =========================================================================
  // SAFETY INSPECTIONS (Findings-Only — docs/api-contracts/fleet/maintenance.api.md)
  // =========================================================================

  /**
   * Record Daily Safety Inspection (Findings-Only — No Checklists)
   * If result === 'FAILED' or (result === 'NEEDS_ATTENTION' && allowDispatch === false),
   * the truck is automatically grounded to 'UNDER_MAINTENANCE' while retaining the assigned driver.
   * Endpoint: POST /api/fleet/maintenance/inspections
   * @param {{ truckId: string, result: 'PASSED' | 'NEEDS_ATTENTION' | 'FAILED', findings: string, allowDispatch?: boolean, issueDetected?: boolean, inspectionDate?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: { inspection: object, truck: object } }>}
   */
  async createInspection(payload) {
    if (!payload.truckId) throw new Error("Truck ID is required");
    if (!payload.result) throw new Error("Inspection result is required");
    if (!payload.findings || !payload.findings.trim()) {
      throw new Error("Inspection findings cannot be empty");
    }

    if (isMock) {
      await delay(250);
      const trucks = getInMemoryTrucks();
      const targetIndex = trucks.findIndex(
        (t) => t.id === payload.truckId || t.truckId === payload.truckId
      );

      if (targetIndex === -1) {
        throw new Error("Vehicle not found");
      }

      const targetTruck = trucks[targetIndex];
      const prevStatus = targetTruck.status || targetTruck.operationalStatus || "ACTIVE";
      const isFailed = payload.result === "FAILED";
      const isNeedsAttentionGrounded =
        payload.result === "NEEDS_ATTENTION" && payload.allowDispatch === false;
      const shouldGround = isFailed || isNeedsAttentionGrounded;

      let currentStatus = prevStatus;
      if (shouldGround) {
        currentStatus = "UNDER_MAINTENANCE";
        // Update truck status while strictly retaining driverId and driver soft-binding
        targetTruck.status = "UNDER_MAINTENANCE";
        targetTruck.operationalStatus = "UNDER_MAINTENANCE";
        targetTruck.isAvailable = false;
        targetTruck.activeRepair = `Safety Inspection Issue: ${payload.findings.slice(0, 50)}...`;
        targetTruck.updatedAt = new Date().toISOString();
        saveInMemoryTrucks(trucks);
      }

      const newInspection = {
        id: `insp-${Date.now()}`,
        truckId: targetTruck.id,
        plateNumber: targetTruck.plateNumber,
        truckModel: targetTruck.model || "Isuzu Elf",
        inspectorId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
        inspectorName: "Super Admin (Logistics Supervisor)",
        inspectorUsername: "superadmin",
        result: payload.result,
        findings: payload.findings.trim(),
        issueDetected:
          payload.issueDetected !== undefined
            ? payload.issueDetected
            : payload.result !== "PASSED",
        allowDispatch:
          payload.allowDispatch !== undefined
            ? payload.allowDispatch
            : payload.result !== "FAILED",
        inspectionDate: payload.inspectionDate || new Date().toISOString(),
      };

      const existingInspections = getInMemoryInspections();
      saveInMemoryInspections([newInspection, ...existingInspections]);

      targetTruck.latestInspection = newInspection;
      targetTruck.lastInspectionResult = newInspection.result;
      targetTruck.hasPendingIssues = newInspection.result === "NEEDS_ATTENTION";
      targetTruck.updatedAt = new Date().toISOString();
      saveInMemoryTrucks(trucks);

      return {
        status: "success",
        message: "Vehicle inspection recorded successfully.",
        data: {
          inspection: newInspection,
          truck: {
            id: targetTruck.id,
            plateNumber: targetTruck.plateNumber,
            previousStatus: prevStatus,
            currentStatus,
            isGrounded: currentStatus === "UNDER_MAINTENANCE",
            latestInspection: newInspection,
            lastInspectionResult: newInspection.result,
            hasPendingIssues: newInspection.result === "NEEDS_ATTENTION",
          },
        },
      };
    }

    const result = await apiClient("/fleet/maintenance/inspections", {
      method: "POST",
      body: payload,
    });
    return result;
  },

  /**
   * View Truck Inspections History
   * Endpoint: GET /api/fleet/maintenance/inspections/truck/:truckId
   * @param {string} truckId
   * @param {{ page?: number, limit?: number, result?: string }} [params]
   * @returns {Promise<{ status: string, data: { truckId: string, plateNumber: string, count: number, total: number, page: number, limit: number, inspections: Array } }>}
   */
  async getTruckInspections(truckId, params = {}) {
    if (isMock) {
      await delay(150);
      const allInspections = getInMemoryInspections();
      let list = allInspections.filter(
        (i) => i.truckId === truckId || i.truckId === `trk-${truckId}`
      );

      if (params.result && params.result !== "All") {
        list = list.filter((i) => i.result === params.result);
      }

      const trucks = getInMemoryTrucks();
      const targetTruck = trucks.find(
        (t) => t.id === truckId || t.truckId === truckId
      );

      return {
        status: "success",
        data: {
          truckId,
          plateNumber: targetTruck?.plateNumber || "ABC-1001",
          count: list.length,
          total: list.length,
          page: Number(params.page) || 1,
          limit: Number(params.limit) || 50,
          inspections: list,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.result && params.result !== "All") query.append("result", params.result);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(
      `/fleet/maintenance/inspections/truck/${truckId}${queryString}`
    );
    return result;
  },

  /**
   * Get Safety Inspection Record by ID
   * Endpoint: GET /api/fleet/maintenance/inspections/:id
   * @param {string} id
   * @returns {Promise<{ status: string, data: { inspection: object } }>}
   */
  async getInspectionById(id) {
    if (isMock) {
      await delay(100);
      const inspections = getInMemoryInspections();
      const found = inspections.find((i) => i.id === id);
      if (!found) throw new Error("Inspection record not found");
      return { status: "success", data: { inspection: found } };
    }

    const result = await apiClient(`/fleet/maintenance/inspections/${id}`);
    return result;
  },

  // =========================================================================
  // MID-ROUTE INCIDENT & BREAKDOWN REPORTING
  // =========================================================================

  /**
   * Get Incident Types Catalog
   * Endpoint: GET /api/fleet/maintenance/incidents/types
   * @returns {Promise<{ status: string, data: { count: number, types: Array<{ id: number, typeName: string, createdAt: string }> } }>}
   */
  async getIncidentTypes() {
    if (isMock) {
      await delay(100);
      return {
        status: "success",
        data: {
          count: DEFAULT_MOCK_INCIDENT_TYPES.length,
          types: [...DEFAULT_MOCK_INCIDENT_TYPES],
        },
      };
    }

    const result = await apiClient("/fleet/maintenance/incidents/types");
    return result;
  },

  /**
   * Report Vehicle Incident / Breakdown
   * If severity === 'CRITICAL', automatically grounds truck to 'UNDER_MAINTENANCE' while retaining driver.
   * Endpoint: POST /api/fleet/maintenance/incidents
   * @param {{ truckId: string, incidentTypeId: number, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', incidentLocation?: string, description: string, reportDate?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: { incident: object, truck: object } }>}
   */
  async createIncident(payload) {
    if (!payload.truckId) throw new Error("Truck ID is required");
    if (!payload.incidentTypeId) throw new Error("Incident type is required");
    if (!payload.severity) throw new Error("Severity level is required");
    if (!payload.description || !payload.description.trim()) {
      throw new Error("Incident description cannot be empty");
    }

    if (isMock) {
      await delay(250);
      const trucks = getInMemoryTrucks();
      const targetIndex = trucks.findIndex(
        (t) => t.id === payload.truckId || t.truckId === payload.truckId
      );

      if (targetIndex === -1) {
        throw new Error("Vehicle not found");
      }

      const targetTruck = trucks[targetIndex];
      const prevStatus = targetTruck.status || targetTruck.operationalStatus || "ACTIVE";
      const isCritical = payload.severity === "CRITICAL";

      let currentStatus = prevStatus;
      if (isCritical) {
        currentStatus = "UNDER_MAINTENANCE";
        // Ground truck while retaining assigned driver soft-binding
        targetTruck.status = "UNDER_MAINTENANCE";
        targetTruck.operationalStatus = "UNDER_MAINTENANCE";
        targetTruck.isAvailable = false;
        targetTruck.activeRepair = `Critical Incident: ${payload.description.slice(0, 50)}...`;
        targetTruck.updatedAt = new Date().toISOString();
        saveInMemoryTrucks(trucks);
      }

      const typeObj = DEFAULT_MOCK_INCIDENT_TYPES.find(
        (t) => t.id === Number(payload.incidentTypeId)
      );
      const incidentTypeName = typeObj ? typeObj.typeName : "MECHANICAL_DEFECT";

      const newIncident = {
        id: `inc-${Date.now()}`,
        truckId: targetTruck.id,
        plateNumber: targetTruck.plateNumber,
        truckModel: targetTruck.model || "Isuzu Elf",
        truckStatus: currentStatus,
        reporterId: "08df2719-0473-4a31-8b5c-dc977d6006c5",
        reporterName: "Super Admin (Logistics Supervisor)",
        reporterUsername: "superadmin",
        incidentTypeId: Number(payload.incidentTypeId),
        incidentTypeName,
        severity: payload.severity,
        incidentLocation: payload.incidentLocation?.trim() || "Roadside mid-route",
        description: payload.description.trim(),
        reportDate: payload.reportDate || new Date().toISOString(),
      };

      const existingIncidents = getInMemoryIncidents();
      saveInMemoryIncidents([newIncident, ...existingIncidents]);

      return {
        status: "success",
        message: "Incident reported successfully.",
        data: {
          incident: newIncident,
          truck: {
            id: targetTruck.id,
            plateNumber: targetTruck.plateNumber,
            previousStatus: prevStatus,
            currentStatus,
            isGrounded: currentStatus === "UNDER_MAINTENANCE",
          },
        },
      };
    }

    const result = await apiClient("/fleet/maintenance/incidents", {
      method: "POST",
      body: payload,
    });
    return result;
  },

  /**
   * List Fleet Incidents with Filters & Pagination
   * Endpoint: GET /api/fleet/maintenance/incidents
   * @param {{ page?: number, limit?: number, truckId?: string, severity?: string, incidentTypeId?: number, startDate?: string, endDate?: string, search?: string }} [params]
   * @returns {Promise<{ status: string, data: { count: number, total: number, page: number, limit: number, incidents: Array } }>}
   */
  async getIncidents(params = {}) {
    if (isMock) {
      await delay(150);
      let list = getInMemoryIncidents();

      if (params.truckId) {
        list = list.filter(
          (i) => i.truckId === params.truckId || i.truckId === `trk-${params.truckId}`
        );
      }
      if (params.severity && params.severity !== "All") {
        list = list.filter((i) => i.severity === params.severity);
      }
      if (params.incidentTypeId && params.incidentTypeId !== "All") {
        list = list.filter((i) => i.incidentTypeId === Number(params.incidentTypeId));
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (i) =>
            i.plateNumber?.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.incidentLocation?.toLowerCase().includes(q) ||
            i.incidentTypeName?.toLowerCase().includes(q)
        );
      }

      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.max(1, Number(params.limit) || 20);
      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const paginated = list.slice((page - 1) * limit, page * limit);

      return {
        status: "success",
        data: {
          count: paginated.length,
          total: totalItems,
          page,
          limit,
          incidents: paginated,
        },
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.severity && params.severity !== "All") query.append("severity", params.severity);
    if (params.incidentTypeId && params.incidentTypeId !== "All")
      query.append("incidentTypeId", params.incidentTypeId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(`/fleet/maintenance/incidents${queryString}`);
    return result;
  },

  /**
   * View Truck Incident History
   * Endpoint: GET /api/fleet/maintenance/incidents/truck/:truckId
   * @param {string} truckId
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<{ status: string, data: { truckId: string, plateNumber: string, count: number, total: number, page: number, limit: number, incidents: Array } }>}
   */
  async getTruckIncidents(truckId, params = {}) {
    if (isMock) {
      await delay(150);
      const allIncidents = getInMemoryIncidents();
      const list = allIncidents.filter(
        (i) => i.truckId === truckId || i.truckId === `trk-${truckId}`
      );
      const trucks = getInMemoryTrucks();
      const targetTruck = trucks.find(
        (t) => t.id === truckId || t.truckId === truckId
      );

      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.max(1, Number(params.limit) || 20);
      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const paginated = list.slice((page - 1) * limit, page * limit);

      return {
        status: "success",
        data: {
          truckId,
          plateNumber: targetTruck?.plateNumber || "ABC-1001",
          count: paginated.length,
          total: totalItems,
          page,
          limit,
          incidents: paginated,
        },
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(
      `/fleet/maintenance/incidents/truck/${truckId}${queryString}`
    );
    return result;
  },

  /**
   * Get Incident Report by ID
   * Endpoint: GET /api/fleet/maintenance/incidents/:id
   * @param {string} id
   * @returns {Promise<{ status: string, data: { incident: object } }>}
   */
  async getIncidentById(id) {
    if (isMock) {
      await delay(100);
      const incidents = getInMemoryIncidents();
      const found = incidents.find((i) => i.id === id);
      if (!found) throw new Error("Incident record not found");
      return { status: "success", data: { incident: found } };
    }

    const result = await apiClient(`/fleet/maintenance/incidents/${id}`);
    return result;
  },

  // =========================================================================
  // WORK ORDERS, COST APPROVALS & FINALIZATION (docs/api-contracts/fleet/maintenance.api.md)
  // =========================================================================

  /**
   * List Maintenance Types Catalog
   * Endpoint: GET /api/fleet/maintenance/work-orders/types
   * @returns {Promise<{ status: string, data: { count: number, types: Array<{ id: number, typeName: string, description: string }> } }>}
   */
  async getMaintenanceTypes() {
    if (isMock) {
      await delay(100);
      return {
        status: "success",
        data: {
          count: DEFAULT_MOCK_MAINTENANCE_TYPES.length,
          types: [...DEFAULT_MOCK_MAINTENANCE_TYPES],
        },
      };
    }

    const result = await apiClient("/fleet/maintenance/work-orders/types");
    return result;
  },

  /**
   * Create Maintenance Work Order
   * If estimatedCost >= 5000.00, work order initiates in 'PENDING' status requiring executive approval.
   * Otherwise initiates in 'APPROVED'. Vehicle is automatically grounded to 'UNDER_MAINTENANCE' with driver retained.
   * Endpoint: POST /api/fleet/maintenance/work-orders
   * @param {{ truckId: string, maintenanceTypeId: number, inspectionId?: string, incidentReportId?: string, shopName?: string, estimatedCost?: number, description: string, scheduledDate?: string, requiresApproval?: boolean }} payload
   * @returns {Promise<{ status: string, message: string, data: { workOrder: object, requiresApproval: boolean, approvalRequest: object|null, truck: object } }>}
   */
  async createWorkOrder(payload) {
    if (!payload.truckId) throw new Error("Target vehicle is required");
    if (!payload.maintenanceTypeId) throw new Error("Maintenance type is required");
    if (!payload.description || !payload.description.trim()) {
      throw new Error("Work order scope/description cannot be empty");
    }

    if (isMock) {
      await delay(250);
      const trucks = getInMemoryTrucks();
      const targetIndex = trucks.findIndex(
        (t) => t.id === payload.truckId || t.truckId === payload.truckId
      );

      if (targetIndex === -1) {
        throw new Error("Target vehicle not found");
      }

      const targetTruck = trucks[targetIndex];
      const estimatedCost = Number(payload.estimatedCost) || 0;
      const requiresApproval = estimatedCost >= 5000.0 || Boolean(payload.requiresApproval);
      const initialStatus = requiresApproval ? "PENDING" : "APPROVED";
      const initialApprovalStatus = requiresApproval ? "PENDING" : "APPROVED";

      // Ground vehicle asset while strictly retaining driver soft-binding
      targetTruck.status = "UNDER_MAINTENANCE";
      targetTruck.operationalStatus = "UNDER_MAINTENANCE";
      targetTruck.isAvailable = false;
      targetTruck.activeRepair = `Work Order: ${payload.description.trim().slice(0, 45)}...`;
      targetTruck.updatedAt = new Date().toISOString();
      saveInMemoryTrucks(trucks);

      const typeObj = DEFAULT_MOCK_MAINTENANCE_TYPES.find(
        (t) => t.id === Number(payload.maintenanceTypeId)
      );
      const maintenanceTypeName = typeObj ? typeObj.typeName : "CORRECTIVE";

      let approvalRequest = null;
      if (requiresApproval) {
        approvalRequest = {
          id: `appr-${Date.now()}`,
          status: "PENDING",
          estimatedCost,
          decidedBy: null,
          decisionDate: null,
          remarks: null,
        };
      }

      const newWorkOrder = {
        id: `wo-${Date.now()}`,
        truckId: targetTruck.id,
        plateNumber: targetTruck.plateNumber,
        truckModel: targetTruck.model || "Isuzu Elf",
        truckStatus: "UNDER_MAINTENANCE",
        truck: {
          id: targetTruck.id,
          plateNumber: targetTruck.plateNumber,
          model: targetTruck.model || "Isuzu Elf",
          status: "UNDER_MAINTENANCE",
          operationalStatus: "UNDER_MAINTENANCE",
          driver: targetTruck.driver,
          driverName: targetTruck.driverName,
          currentOdometer: targetTruck.currentOdometer,
        },
        maintenanceTypeId: Number(payload.maintenanceTypeId),
        maintenanceTypeName,
        inspectionId: payload.inspectionId || null,
        incidentReportId: payload.incidentReportId || null,
        shopName: payload.shopName?.trim() || "Bunawan Heavy Repair Center",
        estimatedCost,
        description: payload.description.trim(),
        status: initialStatus,
        approvalStatus: initialApprovalStatus,
        scheduledDate: payload.scheduledDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approvalRequest,
      };

      const existingOrders = getInMemoryWorkOrders();
      saveInMemoryWorkOrders([newWorkOrder, ...existingOrders]);

      return {
        status: "success",
        message: "Work order created successfully.",
        data: {
          workOrder: newWorkOrder,
          requiresApproval,
          approvalRequest,
          truck: {
            id: targetTruck.id,
            plateNumber: targetTruck.plateNumber,
            status: "UNDER_MAINTENANCE",
            isGrounded: true,
          },
        },
      };
    }

    const result = await apiClient("/fleet/maintenance/work-orders", {
      method: "POST",
      body: payload,
    });
    return result;
  },

  /**
   * List Fleet Work Orders with Filters & Pagination
   * Endpoint: GET /api/fleet/maintenance/work-orders
   * @param {{ page?: number, limit?: number, truckId?: string, status?: string, maintenanceTypeId?: number, startDate?: string, endDate?: string, search?: string }} [params]
   * @returns {Promise<{ status: string, data: { count: number, total: number, page: number, limit: number, workOrders: Array } }>}
   */
  async getWorkOrders(params = {}) {
    if (isMock) {
      await delay(150);
      let list = getInMemoryWorkOrders();
      const inMemoryTrucks = getInMemoryTrucks();

      list = list.map((w) => {
        const trk = inMemoryTrucks.find(
          (t) =>
            t.id === w.truckId ||
            t.truckId === w.truckId ||
            t.plateNumber === w.plateNumber ||
            w.truck?.id === t.id ||
            w.truck?.plateNumber === t.plateNumber
        );
        const resolvedTruckStatus =
          trk?.status ||
          w.truckStatus ||
          (w.status !== "COMPLETED" && w.status !== "CANCELLED"
            ? "UNDER_MAINTENANCE"
            : "ACTIVE");
        return {
          ...w,
          truckStatus: resolvedTruckStatus,
          truck: trk
            ? {
                ...trk,
                status: resolvedTruckStatus,
                operationalStatus: resolvedTruckStatus,
              }
            : w.truck || {
                id: w.truckId,
                plateNumber: w.plateNumber,
                model: w.truckModel,
                status: resolvedTruckStatus,
                operationalStatus: resolvedTruckStatus,
              },
        };
      });

      if (params.truckId) {
        list = list.filter(
          (w) => w.truckId === params.truckId || w.truckId === `trk-${params.truckId}`
        );
      }
      if (params.status && params.status !== "All") {
        list = list.filter((w) => w.status === params.status);
      }
      if (params.maintenanceTypeId && params.maintenanceTypeId !== "All") {
        list = list.filter((w) => w.maintenanceTypeId === Number(params.maintenanceTypeId));
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (w) =>
            w.plateNumber?.toLowerCase().includes(q) ||
            w.shopName?.toLowerCase().includes(q) ||
            w.description?.toLowerCase().includes(q) ||
            w.maintenanceTypeName?.toLowerCase().includes(q)
        );
      }

      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.max(1, Number(params.limit) || 20);
      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const paginated = list.slice((page - 1) * limit, page * limit);

      return {
        status: "success",
        data: {
          count: paginated.length,
          total: totalItems,
          page,
          limit,
          workOrders: paginated,
        },
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.maintenanceTypeId && params.maintenanceTypeId !== "All")
      query.append("maintenanceTypeId", params.maintenanceTypeId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(`/fleet/maintenance/work-orders${queryString}`);
    return result;
  },

  /**
   * Get Work Order Details by ID
   * Endpoint: GET /api/fleet/maintenance/work-orders/:id
   * @param {string} id
   * @returns {Promise<{ status: string, data: { workOrder: object } }>}
   */
  async getWorkOrderById(id) {
    if (isMock) {
      await delay(100);
      const orders = getInMemoryWorkOrders();
      const found = orders.find((w) => w.id === id);
      if (!found) throw new Error("Work order not found");
      const inMemoryTrucks = getInMemoryTrucks();
      const trk = inMemoryTrucks.find(
        (t) =>
          t.id === found.truckId ||
          t.truckId === found.truckId ||
          t.plateNumber === found.plateNumber ||
          found.truck?.id === t.id ||
          found.truck?.plateNumber === t.plateNumber
      );
      const resolvedTruckStatus =
        trk?.status ||
        found.truckStatus ||
        (found.status !== "COMPLETED" && found.status !== "CANCELLED"
          ? "UNDER_MAINTENANCE"
          : "ACTIVE");
      const enrichedFound = {
        ...found,
        truckStatus: resolvedTruckStatus,
        truck: trk
          ? {
              ...trk,
              status: resolvedTruckStatus,
              operationalStatus: resolvedTruckStatus,
            }
          : found.truck || {
              id: found.truckId,
              plateNumber: found.plateNumber,
              model: found.truckModel,
              status: resolvedTruckStatus,
              operationalStatus: resolvedTruckStatus,
            },
      };
      return { status: "success", data: { workOrder: enrichedFound } };
    }

    const result = await apiClient(`/fleet/maintenance/work-orders/${id}`);
    return result;
  },

  /**
   * Advance Work Order Status
   * Permitted transitions: SCHEDULED, IN_PROGRESS, CANCELLED.
   * Invariant: COMPLETED is strictly prohibited here (must use /finalize).
   * Endpoint: PATCH /api/fleet/maintenance/work-orders/:id/status
   * @param {string} id
   * @param {{ status: 'SCHEDULED' | 'IN_PROGRESS' | 'CANCELLED' }} payload
   * @returns {Promise<{ status: string, message: string, data: { workOrder: object } }>}
   */
  async updateWorkOrderStatus(id, { status }) {
    if (status === "COMPLETED") {
      throw new Error(
        "Work order can only be completed by finalizing the maintenance log via /api/fleet/maintenance/work-orders/:id/finalize"
      );
    }

    if (isMock) {
      await delay(200);
      const orders = getInMemoryWorkOrders();
      const index = orders.findIndex((w) => w.id === id);
      if (index === -1) throw new Error("Work order not found");

      const wo = orders[index];
      const previousStatus = wo.status;
      wo.status = status;
      wo.updatedAt = new Date().toISOString();
      saveInMemoryWorkOrders(orders);

      return {
        status: "success",
        message: `Work order status updated to ${status}.`,
        data: {
          workOrder: {
            id: wo.id,
            previousStatus,
            currentStatus: status,
            status: status,
            truckId: wo.truckId,
            plateNumber: wo.plateNumber,
            updatedAt: wo.updatedAt,
          },
        },
      };
    }

    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return result;
  },

  /**
   * Executive Cost Approval Decision
   * Approves or rejects high-cost repair work orders exceeding ₱5,000.00.
   * Endpoint: POST /api/fleet/maintenance/work-orders/:id/approve
   * @param {string} id
   * @param {{ isApproved: boolean, remarks?: string }} payload
   * @returns {Promise<{ status: string, message: string, data: { workOrder: object, approvalRequest: object } }>}
   */
  async decideWorkOrderApproval(id, { isApproved, remarks }) {
    if (isMock) {
      await delay(250);
      const orders = getInMemoryWorkOrders();
      const index = orders.findIndex((w) => w.id === id);
      if (index === -1) throw new Error("Work order not found");

      const wo = orders[index];
      const targetStatus = isApproved ? "APPROVED" : "CANCELLED";
      const targetApprovalStatus = isApproved ? "APPROVED" : "REJECTED";

      wo.status = targetStatus;
      wo.approvalStatus = targetApprovalStatus;
      wo.approvedAt = isApproved ? new Date().toISOString() : null;
      wo.decisionRemarks = remarks?.trim() || null;
      wo.updatedAt = new Date().toISOString();

      if (wo.approvalRequest) {
        wo.approvalRequest.status = targetApprovalStatus;
        wo.approvalRequest.decidedBy = "08df2719-0473-4a31-8b5c-dc977d6006c5";
        wo.approvalRequest.decisionDate = new Date().toISOString();
        wo.approvalRequest.remarks = remarks?.trim() || null;
      }

      saveInMemoryWorkOrders(orders);

      return {
        status: "success",
        message: "Work order cost approval request decided successfully.",
        data: {
          workOrder: {
            id: wo.id,
            truckId: wo.truckId,
            plateNumber: wo.plateNumber,
            status: targetStatus,
            approvedAt: wo.approvedAt,
            decisionRemarks: wo.decisionRemarks,
            updatedAt: wo.updatedAt,
          },
          approvalRequest: wo.approvalRequest || {
            id: `appr-${Date.now()}`,
            status: targetApprovalStatus,
            decidedBy: "08df2719-0473-4a31-8b5c-dc977d6006c5",
            decisionDate: new Date().toISOString(),
            remarks: remarks?.trim() || null,
          },
        },
      };
    }

    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/approve`, {
      method: "POST",
      body: { isApproved, remarks },
    });
    return result;
  },

  /**
   * Finalize Maintenance Log & Release Vehicle
   * Marks work order COMPLETED, resets 5,000-km PM baseline if PREVENTIVE,
   * restores vehicle availability to ACTIVE, and retains soft-bound driver.
   * Endpoint: POST /api/fleet/maintenance/work-orders/:id/finalize
   * @param {string} id - Work order UUID
   * @param {{ officialReceiptNumber: string, severity: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', dateStarted: string, dateResolved: string, partsCost?: number, laborCost?: number, downtimeDays?: number, odometerAtService: number }} payload
   * @returns {Promise<{ status: string, message: string, data: { maintenanceLog: object, workOrder: object, truck: object } }>}
   */
  async finalizeWorkOrder(id, payload) {
    if (!payload.officialReceiptNumber || !payload.officialReceiptNumber.trim()) {
      throw new Error("Official Receipt (OR) number is required");
    }
    if (!payload.dateStarted) throw new Error("Repair start date is required");
    if (!payload.dateResolved) throw new Error("Repair completion date is required");
    if (payload.odometerAtService === undefined || payload.odometerAtService === null) {
      throw new Error("Odometer reading at service is required");
    }

    if (isMock) {
      await delay(300);
      const orders = getInMemoryWorkOrders();
      const woIndex = orders.findIndex((w) => w.id === id);
      if (woIndex === -1) throw new Error("Work order not found");

      const wo = orders[woIndex];
      const orNumber = payload.officialReceiptNumber.trim();

      // Check unique receipt number constraint
      const existingLogs = getInMemoryMaintenanceLogs();
      const duplicateOR = existingLogs.find(
        (l) => l.officialReceiptNumber.toLowerCase() === orNumber.toLowerCase()
      );
      if (duplicateOR) {
        throw new Error(
          `Official receipt number '${orNumber}' has already been registered in maintenance logs`
        );
      }

      // 1. Mark Work Order as COMPLETED
      wo.status = "COMPLETED";
      wo.updatedAt = new Date().toISOString();
      saveInMemoryWorkOrders(orders);

      // 2. Restore vehicle operational condition to ACTIVE while strictly preserving driver soft-binding
      const trucks = getInMemoryTrucks();
      const truckIndex = trucks.findIndex(
        (t) => t.id === wo.truckId || t.truckId === wo.truckId
      );
      let targetTruck = null;

      if (truckIndex !== -1) {
        targetTruck = trucks[truckIndex];
        targetTruck.status = "ACTIVE";
        targetTruck.operationalStatus = "ACTIVE";
        targetTruck.isAvailable = true;
        targetTruck.activeRepair = null;

        // Reset PM baseline if preventive maintenance
        const isPreventive =
          wo.maintenanceTypeName === "PREVENTIVE" || wo.maintenanceTypeId === 1;
        if (isPreventive) {
          targetTruck.lastPmOdometer = Number(payload.odometerAtService);
        }
        targetTruck.currentOdometer = Math.max(
          Number(targetTruck.currentOdometer) || 0,
          Number(payload.odometerAtService)
        );
        targetTruck.updatedAt = new Date().toISOString();
        saveInMemoryTrucks(trucks);
      }

      // 3. Create historical maintenance log record
      const partsCost = Number(payload.partsCost) || 0;
      const laborCost = Number(payload.laborCost) || 0;
      const totalCost = partsCost + laborCost;

      const newLog = {
        id: `mlog-${Date.now()}`,
        workOrderId: wo.id,
        truckId: wo.truckId,
        plateNumber: wo.plateNumber,
        truckModel: wo.truckModel,
        maintenanceTypeId: wo.maintenanceTypeId,
        maintenanceTypeName: wo.maintenanceTypeName,
        severity: payload.severity || "MEDIUM",
        dateStarted: payload.dateStarted,
        dateResolved: payload.dateResolved,
        partsCost,
        laborCost,
        totalCost,
        downtimeDays: Number(payload.downtimeDays) || 1,
        odometerAtService: Number(payload.odometerAtService),
        officialReceiptNumber: orNumber,
        createdAt: new Date().toISOString(),
        shopName: wo.shopName,
        description: wo.description,
      };

      saveInMemoryMaintenanceLogs([newLog, ...existingLogs]);

      return {
        status: "success",
        message: "Maintenance log finalized and vehicle operational status restored.",
        data: {
          maintenanceLog: newLog,
          workOrder: {
            id: wo.id,
            status: "COMPLETED",
            shopName: wo.shopName,
            description: wo.description,
          },
          truck: targetTruck
            ? {
                id: targetTruck.id,
                plateNumber: targetTruck.plateNumber,
                status: "ACTIVE",
                currentOdometer: targetTruck.currentOdometer,
                lastPmOdometer: targetTruck.lastPmOdometer,
                isPmReset: wo.maintenanceTypeName === "PREVENTIVE",
              }
            : null,
        },
      };
    }

    const result = await apiClient(`/fleet/maintenance/work-orders/${id}/finalize`, {
      method: "POST",
      body: payload,
    });
    return result;
  },

  /**
   * Query Historical Maintenance Logs
   * Endpoint: GET /api/fleet/maintenance/logs
   * @param {{ page?: number, limit?: number, truckId?: string, maintenanceTypeId?: number, startDate?: string, endDate?: string, search?: string }} [params]
   * @returns {Promise<{ status: string, data: { count: number, total: number, page: number, limit: number, logs: Array } }>}
   */
  async getMaintenanceLogs(params = {}) {
    if (isMock) {
      await delay(150);
      let list = getInMemoryMaintenanceLogs();

      if (params.truckId) {
        list = list.filter(
          (l) => l.truckId === params.truckId || l.truckId === `trk-${params.truckId}`
        );
      }
      if (params.maintenanceTypeId && params.maintenanceTypeId !== "All") {
        list = list.filter((l) => l.maintenanceTypeId === Number(params.maintenanceTypeId));
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (l) =>
            l.officialReceiptNumber?.toLowerCase().includes(q) ||
            l.plateNumber?.toLowerCase().includes(q) ||
            l.shopName?.toLowerCase().includes(q) ||
            l.description?.toLowerCase().includes(q)
        );
      }

      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.max(1, Number(params.limit) || 20);
      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const paginated = list.slice((page - 1) * limit, page * limit);

      return {
        status: "success",
        data: {
          count: paginated.length,
          total: totalItems,
          page,
          limit,
          logs: paginated,
        },
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.maintenanceTypeId && params.maintenanceTypeId !== "All")
      query.append("maintenanceTypeId", params.maintenanceTypeId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(`/fleet/maintenance/logs${queryString}`);
    return result;
  },

  /**
   * Get Recurring Issues Fleet Analytics
   * Endpoint: GET /api/fleet/maintenance/analytics/recurring-issues
   * @param {{ truckId?: string, days?: number, minOccurrences?: number }} [params]
   * @returns {Promise<{ status: string, data: { filter: object, count: number, recurringIssues: Array } }>}
   */
  async getRecurringIssuesAnalytics(params = {}) {
    if (isMock) {
      await delay(150);
      let list = [...DEFAULT_MOCK_RECURRING_ISSUES];

      if (params.truckId) {
        list = list.filter(
          (r) => r.truckId === params.truckId || r.truckId === `trk-${params.truckId}`
        );
      }

      return {
        status: "success",
        data: {
          filter: {
            days: Number(params.days) || 90,
            minOccurrences: Number(params.minOccurrences) || 2,
            truckId: params.truckId || null,
          },
          count: list.length,
          recurringIssues: list,
        },
      };
    }

    const query = new URLSearchParams();
    if (params.truckId) query.append("truckId", params.truckId);
    if (params.days) query.append("days", params.days);
    if (params.minOccurrences) query.append("minOccurrences", params.minOccurrences);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    const result = await apiClient(
      `/fleet/maintenance/analytics/recurring-issues${queryString}`
    );
    return result;
  },
};
