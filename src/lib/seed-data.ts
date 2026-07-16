const LOCAL_VEHICLES_KEY = "safetydesk:vehicles";
const LOCAL_FINES_KEY = "safetydesk:fines";

function readLocal<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

function writeLocal<T>(key: string, values: T[]) {
  localStorage.setItem(key, JSON.stringify(values));
}

const sampleVehicles = [
  {
    id: crypto.randomUUID(), user_id: "seed", internal_number: "001", license_plate: "AB123CD",
    vehicle_type: "Camión", brand: "Mercedes-Benz", model: "Actros 1845", vehicle_year: 2022,
    color: "Blanco", mileage: 84500, driver_name: "Carlos Mendoza", driver_document: "DNI 28.456.789",
    driver_license: "B-2", driver_license_expiry: "2026-12-31", notes: null, photo_path: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), user_id: "seed", internal_number: "002", license_plate: "EF456GH",
    vehicle_type: "Utilitario", brand: "Toyota", model: "Hilux 4x4", vehicle_year: 2023,
    color: "Gris", mileage: 32000, driver_name: "María López", driver_document: "DNI 30.123.456",
    driver_license: "B-1", driver_license_expiry: "2027-05-15", notes: null, photo_path: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), user_id: "seed", internal_number: "005", license_plate: "IJ789KL",
    vehicle_type: "Camión", brand: "Scania", model: "R 460", vehicle_year: 2021,
    color: "Rojo", mileage: 120000, driver_name: "Jorge Fernández", driver_document: "DNI 25.987.654",
    driver_license: "B-2", driver_license_expiry: "2026-08-20", notes: null, photo_path: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), user_id: "seed", internal_number: "008", license_plate: "MN012OP",
    vehicle_type: "Camioneta", brand: "Ford", model: "Ranger", vehicle_year: 2024,
    color: "Azul", mileage: 15000, driver_name: "Ana Martínez", driver_document: "DNI 32.654.987",
    driver_license: "B-1", driver_license_expiry: "2028-03-10", notes: "Asignada a supervisión", photo_path: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

const sampleFines = [
  {
    id: crypto.randomUUID(), user_id: "seed", infraccion: "Exceso de velocidad", monto: 85000,
    fecha: "2026-06-10", vehiculo: "AB123CD", conductor: "Carlos Mendoza",
    estado: "Pendiente" as const, observaciones: "Radar fijo Ruta 9 km 85",
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), user_id: "seed", infraccion: "Estacionamiento prohibido", monto: 25000,
    fecha: "2026-06-22", vehiculo: "EF456GH", conductor: "María López",
    estado: "Pagada" as const, observaciones: "Centro, calle San Martín 450",
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), user_id: "seed", infraccion: "Documentación vencida", monto: 45000,
    fecha: "2026-07-01", vehiculo: "IJ789KL", conductor: "Jorge Fernández",
    estado: "Pendiente" as const, observaciones: "Control de tránsito municipal",
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), user_id: "seed", infraccion: "Luz roja", monto: 65000,
    fecha: "2026-07-05", vehiculo: "MN012OP", conductor: "Ana Martínez",
    estado: "Apelada" as const, observaciones: "Intersección Av. Siempre Viva",
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), user_id: "seed", infraccion: "Falta de cinturón", monto: 35000,
    fecha: "2026-07-08", vehiculo: "AB123CD", conductor: "Carlos Mendoza",
    estado: "Pendiente" as const, observaciones: "Control sorpresa en acceso planta",
    created_at: new Date().toISOString(),
  },
];

export function seedSampleData() {
  const existingVehicles = readLocal(LOCAL_VEHICLES_KEY);
  const existingFines = readLocal(LOCAL_FINES_KEY);

  if (existingVehicles.length === 0) {
    writeLocal(LOCAL_VEHICLES_KEY, sampleVehicles);
  }
  if (existingFines.length === 0) {
    writeLocal(LOCAL_FINES_KEY, sampleFines);
  }

  return {
    vehicles: existingVehicles.length === 0 ? sampleVehicles.length : 0,
    fines: existingFines.length === 0 ? sampleFines.length : 0,
  };
}
