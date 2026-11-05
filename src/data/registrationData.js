export const initialPersonalInfo = {
  profilePhotoUri: '',
  fullName: '',
  documentId: '',
  phoneNumber: '',
  birthDate: '', // YYYY-MM-DD
  gender: '',
  email: '',
};

export const initialVehicleInfo = {
  category: '',
  licensePlate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  passengerCapacity: '',
  vehiclePhotoUri: '',
};

export const initialDocumentsInfo = {
  driverLicenseNumber: '',
  driverLicensePhotoUri: '',
  driverLicenseExpiryDate: '', // YYYY-MM-DD
  soatPhotoUri: '',
  soatExpiryDate: '', // YYYY-MM-DD
  mechanicalInspectionPhotoUri: '',
  mechanicalInspectionExpiryDate: '', // YYYY-MM-DD
  mercadoPagoEmail: '',
  termsAccepted: false,
};

export const PERSONAL_INFO_FIELDS = Object.keys(initialPersonalInfo);
export const VEHICLE_INFO_FIELDS = Object.keys(initialVehicleInfo);
export const DOCUMENTS_INFO_FIELDS = Object.keys(initialDocumentsInfo);
