export type SpotStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
export type SpotType   = 'STANDARD' | 'COMPACT' | 'LARGE' | 'EV_ONLY' | 'HANDICAPPED';

export interface ParkingSpot {
  spotId: number;
  lotId: number;
  spotNumber: string;
  floor: number;
  spotType: SpotType;
  status: SpotStatus;
  pricePerHour: number;
  ev: boolean;
  handicapped: boolean;
  active: boolean;
  createdAt: string;
}

export interface ParkingLot {
  lotId: number;
  managerId: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  status: string;
  totalSpots: number;
  maxCapacity?: number;
  availableSpots: number;
  createdAt: string;
}

export interface LotAvailability {
  lotId: number;
  availableSpots: number;
  isAvailable: boolean;
}

export interface DashboardStats {
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  reservedSpots: number;
  occupancyRate: number;
}

export interface Booking {
  bookingId: number;
  driverId: number;
  spotId: number;
  lotId: number;
  spotNumber: string;
  bookingType: string;
  status: string;
  startTime: string;
  endTime: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  pricePerHour: number;
  totalFare: number | null;
  vehiclePlate: string;
  createdAt: string;
}

export interface Payment {
  paymentId: number;
  bookingId: number;
  userId: number;
  lotId: number;
  amount: number;
  status: string;
  mode: string;
  transactionId: string;
  currency: string;
  paidAt: string;
}

export interface RevenueReport {
  lotId: number;
  totalRevenue: number;
  totalTransactions: number;
  fromDate: string;
  toDate: string;
  currency: string;
}

export interface HourlyTraffic {
  hour: number;
  bookingCount: number;
}

export interface UtilisationStats {
  lotId: number;
  from: string;
  to: string;
  preBookingCount: number;
  walkInCount: number;
  total: number;
  preBookingPct: number;
  walkInPct: number;
}

export interface Vehicle {
  id: number;
  userId: number;
  plate: string;
  vehicleType: 'SEDAN' | 'SUV' | 'MOTORCYCLE' | 'TRUCK' | 'VAN' | 'OTHER';
  ev: boolean;
  nickname: string;
  createdAt: string;
}

export interface Notification {
  notificationId: number;
  recipientId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
}
