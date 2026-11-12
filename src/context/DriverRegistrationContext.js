import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { DOCUMENTS_INFO_FIELDS, initialDocumentsInfo, initialPersonalInfo, initialVehicleInfo, 
  PERSONAL_INFO_FIELDS, VEHICLE_INFO_FIELDS,} from '../data/registrationData';
import { REGISTRATION_STATUS } from '../data/registrationOptions';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { USE_FIREBASE_STORAGE } from '../config/appConfig';
import { PLATFORM_COMMISSION_RATE } from '../config/pricing';
import { validatePersonalInfo } from '../utils/registration/validatePersonalInfo';
import { validateVehicleInfo } from '../utils/registration/validateVehicleInfo';
import { validateDocumentsInfo } from '../utils/registration/validateDocumentsInfo';
import { findDriverByLicensePlate, getDriver, removeDriver, saveDriver,
  subscribeToDriver } from '../services/driverService';
import { getDriverImagePath, uploadImage } from '../services/imageStorageService';
import { getData, removeData, saveData } from '../services/localStorageService';

export const DriverRegistrationContext = createContext(null);

const buildDriverPayload = (personalInfo, vehicleInfo, documentsInfo) => ({
  personalInfo: {
    ...personalInfo,
    fullName: (personalInfo.fullName || '').trim().replace(/\s+/g, ' '),
    email: (personalInfo.email || '').trim().toLowerCase(),
  },
  vehicleInfo: {
    ...vehicleInfo,
    licensePlate: (vehicleInfo.licensePlate || '').trim().toUpperCase(),
    brand: (vehicleInfo.brand || '').trim(),
    model: (vehicleInfo.model || '').trim(),
    year: Number(vehicleInfo.year),
    passengerCapacity: Number(vehicleInfo.passengerCapacity),
  },
  documentsInfo: {
    ...documentsInfo,
    driverLicenseNumber: (documentsInfo.driverLicenseNumber || '').trim(),
    mercadoPagoEmail: (documentsInfo.mercadoPagoEmail || '').trim().toLowerCase(),
    termsAccepted: Boolean(documentsInfo.termsAccepted),
    acceptedCommissionRate: PLATFORM_COMMISSION_RATE,
  },
});

const mapDriverToForms = (driver) => ({
  personalInfo: { ...initialPersonalInfo, ...driver.personalInfo },
  vehicleInfo: {
    ...initialVehicleInfo,
    ...driver.vehicleInfo,
    year: driver.vehicleInfo?.year ? String(driver.vehicleInfo.year) : '',
    passengerCapacity: driver.vehicleInfo?.passengerCapacity
      ? String(driver.vehicleInfo.passengerCapacity)
      : '',
  },
  documentsInfo: {
    ...initialDocumentsInfo,
    ...driver.documentsInfo,
    termsAccepted: Boolean(driver.documentsInfo?.termsAccepted),
  },
});

export function DriverRegistrationProvider({ children }) {
  // 1. Form state of the three tabs
  const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo);
  const [vehicleInfo, setVehicleInfo] = useState(initialVehicleInfo);
  const [documentsInfo, setDocumentsInfo] = useState(initialDocumentsInfo);

  // 2. Fields the user already interacted with (errors are shown only for these)
  const [touchedFields, setTouchedFields] = useState({});

  // 3. Session / Firebase state
  const [driverId, setDriverId] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [savingAction, setSavingAction] = useState(null); // 'draft' | 'submit' | null
  const [saveError, setSaveError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const applyDriver = useCallback((driver) => {
    const forms = mapDriverToForms(driver);
    setPersonalInfo(forms.personalInfo);
    setVehicleInfo(forms.vehicleInfo);
    setDocumentsInfo(forms.documentsInfo);
    setDriverId(driver.id);
    setRegistrationStatus(driver.status ?? null);
  }, []);

  // 4. Restore the saved session (AsyncStorage only keeps the driverId)
  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      try {
        const session = await getData(STORAGE_KEYS.DRIVER_SESSION);
        if (!session?.driverId) return;

        const driver = await getDriver(session.driverId);
        if (!isActive) return;

        if (driver) {
          applyDriver(driver);
        } else {
          await removeData(STORAGE_KEYS.DRIVER_SESSION);
        }
      } catch (error) {
        console.log('Error loading driver session:', error);
      } finally {
        if (isActive) setIsLoadingSession(false);
      }
    };

    loadSession();
    return () => {
      isActive = false;
    };
  }, [applyDriver]);

  // 5. Real-time status updates once the registration was submitted (onSnapshot with cleanup)
  const isSubmitted =
    Boolean(registrationStatus) && registrationStatus !== REGISTRATION_STATUS.DRAFT;

  useEffect(() => {
    if (!driverId || !isSubmitted) return undefined;

    const unsubscribe = subscribeToDriver(
      driverId,
      (driver) => {
        if (driver?.status) setRegistrationStatus(driver.status);
      },
      (error) => console.log('Error listening to driver status:', error)
    );

    return () => unsubscribe();
  }, [driverId, isSubmitted]);

  // 6. Updaters (useCallback)
  const updatePersonalInfo = useCallback((field, value) => {
    setPersonalInfo((previous) => ({ ...previous, [field]: value }));
    setSaveError('');
  }, []);

  const updateVehicleInfo = useCallback((field, value) => {
    setVehicleInfo((previous) => ({ ...previous, [field]: value }));
    setSaveError('');
  }, []);

  const updateDocumentsInfo = useCallback((field, value) => {
    setDocumentsInfo((previous) => ({ ...previous, [field]: value }));
    setSaveError('');
  }, []);

  const touchField = useCallback((field) => {
    setTouchedFields((previous) =>
      previous[field] ? previous : { ...previous, [field]: true }
    );
  }, []);

  const touchFields = useCallback((fields) => {
    setTouchedFields((previous) => {
      const next = { ...previous };
      fields.forEach((field) => {
        next[field] = true;
      });
      return next;
    });
  }, []);

  // 7. Validation (useMemo: recalculated only when tab data changes)
  const personalInfoValidation = useMemo(
    () => validatePersonalInfo(personalInfo),
    [personalInfo]
  );
  const vehicleInfoValidation = useMemo(
    () => validateVehicleInfo(vehicleInfo),
    [vehicleInfo]
  );
  const documentsInfoValidation = useMemo(
    () => validateDocumentsInfo(documentsInfo, vehicleInfo),
    [documentsInfo, vehicleInfo]
  );

  const isPersonalInfoValid = personalInfoValidation.isValid;
  const isVehicleInfoValid = vehicleInfoValidation.isValid;
  const isDocumentsInfoValid = documentsInfoValidation.isValid;
  const requiresMechanicalInspection = documentsInfoValidation.requiresMechanicalInspection;

  // Global validity: true ONLY when all 3 tabs are complete and valid
  const isRegistrationValid =
    isPersonalInfoValid && isVehicleInfoValid && isDocumentsInfoValid;
  const canSaveDraft = isPersonalInfoValid && isVehicleInfoValid;

  // 8. Persist in Firestore (shared by "Guardar avance" and "Enviar registro")
  const persistRegistration = useCallback(
    async (status) => {
      const newDriverId = personalInfo.documentId.trim();
      const payload = buildDriverPayload(personalInfo, vehicleInfo, documentsInfo);

      const existingDriver = await getDriver(newDriverId);
      if (existingDriver && existingDriver.id !== driverId) {
        return {
          ok: false,
          message: 'Ya existe un registro con este documento de identidad.',
        };
      }

      // b) The plate cannot be registered by another driver
      const plateOwner = await findDriverByLicensePlate(
        payload.vehicleInfo.licensePlate,
        newDriverId
      );
      if (plateOwner) {
        return {
          ok: false,
          message: 'Ya existe un conductor registrado con esta placa.',
        };
      }

      // c) Optional upload to Firebase Storage if enabled
      if (USE_FIREBASE_STORAGE) {
        payload.personalInfo.profilePhotoUri = await uploadImage(
          payload.personalInfo.profilePhotoUri,
          getDriverImagePath(newDriverId, 'profile')
        );
        payload.vehicleInfo.vehiclePhotoUri = await uploadImage(
          payload.vehicleInfo.vehiclePhotoUri,
          getDriverImagePath(newDriverId, 'vehicle')
        );
        if (payload.documentsInfo.driverLicensePhotoUri) {
          payload.documentsInfo.driverLicensePhotoUri = await uploadImage(
            payload.documentsInfo.driverLicensePhotoUri,
            getDriverImagePath(newDriverId, 'driver_license')
          );
        }
        if (payload.documentsInfo.soatPhotoUri) {
          payload.documentsInfo.soatPhotoUri = await uploadImage(
            payload.documentsInfo.soatPhotoUri,
            getDriverImagePath(newDriverId, 'soat')
          );
        }
        if (payload.documentsInfo.mechanicalInspectionPhotoUri) {
          payload.documentsInfo.mechanicalInspectionPhotoUri = await uploadImage(
            payload.documentsInfo.mechanicalInspectionPhotoUri,
            getDriverImagePath(newDriverId, 'mechanical_inspection')
          );
        }
      }

      // d) Save driver document in Firestore (`drivers/{documentId}`)
      await saveDriver(newDriverId, {
        ...payload,
        status,
        isAvailable: false,
      });

      // e) If the document number changed while in draft, remove the previous draft
      if (driverId && driverId !== newDriverId) {
        await removeDriver(driverId);
      }

      await saveData(STORAGE_KEYS.DRIVER_SESSION, { driverId: newDriverId });
      setPersonalInfo((previous) => ({
        ...previous,
        profilePhotoUri: payload.personalInfo.profilePhotoUri,
      }));
      setVehicleInfo((previous) => ({
        ...previous,
        vehiclePhotoUri: payload.vehicleInfo.vehiclePhotoUri,
      }));
      setDocumentsInfo((previous) => ({
        ...previous,
        driverLicensePhotoUri: payload.documentsInfo.driverLicensePhotoUri,
        soatPhotoUri: payload.documentsInfo.soatPhotoUri,
        mechanicalInspectionPhotoUri: payload.documentsInfo.mechanicalInspectionPhotoUri,
      }));
      setDriverId(newDriverId);
      return { ok: true };
    },
    [personalInfo, vehicleInfo, documentsInfo, driverId]
  );

  const runSave = useCallback(
    async (action, status) => {
      setSavingAction(action);
      setSaveError('');
      try {
        const result = await persistRegistration(status);
        if (!result.ok) {
          setSaveError(result.message);
          return result;
        }
        setRegistrationStatus(status);
        setLastSavedAt(new Date());
        return result;
      } catch (error) {
        console.log('Error saving registration:', error);
        const message =
          'No fue posible guardar en Firebase. Revisa tu conexión e intenta de nuevo.';
        setSaveError(message);
        return { ok: false, message };
      } finally {
        setSavingAction(null);
      }
    },
    [persistRegistration]
  );

  // 9. Save draft (tabs 1 and 2 valid)
  const saveDraft = useCallback(async () => {
    touchFields([...PERSONAL_INFO_FIELDS, ...VEHICLE_INFO_FIELDS]);
    if (!canSaveDraft) {
      return {
        ok: false,
        message: 'Completa correctamente las pestañas 1 y 2 para guardar un borrador.',
      };
    }
    return runSave('draft', REGISTRATION_STATUS.DRAFT);
  }, [canSaveDraft, runSave, touchFields]);

  // 10. Submit registration (all three tabs valid) -> pending_approval
  const submitRegistration = useCallback(async () => {
    touchFields([
      ...PERSONAL_INFO_FIELDS,
      ...VEHICLE_INFO_FIELDS,
      ...DOCUMENTS_INFO_FIELDS,
    ]);
    if (!isRegistrationValid) {
      return {
        ok: false,
        message: 'Completa y valida las 3 pestañas antes de enviar.',
      };
    }
    return runSave('submit', REGISTRATION_STATUS.PENDING_APPROVAL);
  }, [isRegistrationValid, runSave, touchFields]);

  const updateApprovedProfile = useCallback(async () => {
    touchFields([
      ...PERSONAL_INFO_FIELDS,
      ...VEHICLE_INFO_FIELDS,
      ...DOCUMENTS_INFO_FIELDS,
    ]);
    if (!isRegistrationValid) {
      return {
        ok: false,
        message: 'Revisa los campos marcados en rojo antes de guardar los cambios.',
      };
    }
    return runSave('profile', registrationStatus || REGISTRATION_STATUS.APPROVED);
  }, [isRegistrationValid, registrationStatus, runSave, touchFields]);

  // 11. Reset local session (Firestore document remains intact)
  const resetRegistration = useCallback(async () => {
    await removeData(STORAGE_KEYS.DRIVER_SESSION);
    setPersonalInfo(initialPersonalInfo);
    setVehicleInfo(initialVehicleInfo);
    setDocumentsInfo(initialDocumentsInfo);
    setTouchedFields({});
    setDriverId(null);
    setRegistrationStatus(null);
    setSaveError('');
    setLastSavedAt(null);
  }, []);

  // 12. Quick demo login / approval for testing Phase 2-5
  const loginAsApprovedDemoDriver = useCallback(async () => {
    setSavingAction('submit');
    setSaveError('');
    try {
      const targetId = (personalInfo.documentId || '').trim() || '1000123456';
      const demoDriver = {
        id: targetId,
        personalInfo: {
          fullName: personalInfo.fullName || 'Santiago Salazar',
          documentId: targetId,
          phoneNumber: personalInfo.phoneNumber || '3001234567',
          birthDate: personalInfo.birthDate || '1999-05-15',
          gender: personalInfo.gender || 'male',
          email: personalInfo.email || 'santiago@uberclone.com',
          profilePhotoUri: personalInfo.profilePhotoUri || 'file:///demo/profile.jpg',
        },
        vehicleInfo: {
          category: vehicleInfo.category || 'economy',
          licensePlate: vehicleInfo.licensePlate || 'ABC123',
          brand: vehicleInfo.brand || 'Chevrolet',
          model: vehicleInfo.model || 'Onix',
          year: Number(vehicleInfo.year) || 2023,
          color: vehicleInfo.color || 'white',
          passengerCapacity: Number(vehicleInfo.passengerCapacity) || 4,
          vehiclePhotoUri: vehicleInfo.vehiclePhotoUri || 'file:///demo/vehicle.jpg',
        },
        documentsInfo: {
          driverLicenseNumber: documentsInfo.driverLicenseNumber || targetId,
          driverLicensePhotoUri: documentsInfo.driverLicensePhotoUri || 'file:///demo/license.jpg',
          driverLicenseExpiryDate: documentsInfo.driverLicenseExpiryDate || '2028-12-31',
          soatPhotoUri: documentsInfo.soatPhotoUri || 'file:///demo/soat.jpg',
          soatExpiryDate: documentsInfo.soatExpiryDate || '2027-12-31',
          mechanicalInspectionPhotoUri: documentsInfo.mechanicalInspectionPhotoUri || '',
          mechanicalInspectionExpiryDate: documentsInfo.mechanicalInspectionExpiryDate || '',
          mercadoPagoEmail: documentsInfo.mercadoPagoEmail || 'santiago.mp@correo.com',
          termsAccepted: true,
          acceptedCommissionRate: PLATFORM_COMMISSION_RATE,
        },
        status: REGISTRATION_STATUS.APPROVED,
        isAvailable: false,
      };

      await saveDriver(targetId, demoDriver);
      await saveData(STORAGE_KEYS.DRIVER_SESSION, { driverId: targetId });
      applyDriver(demoDriver);
      return { ok: true };
    } catch (error) {
      console.log('Error activating demo driver:', error);
      setSaveError('No se pudo activar el conductor de prueba. Verifica tu conexión.');
      return { ok: false };
    } finally {
      setSavingAction(null);
    }
  }, [personalInfo, vehicleInfo, documentsInfo, applyDriver]);

  const value = useMemo(
    () => ({
      // State
      personalInfo,
      vehicleInfo,
      documentsInfo,
      touchedFields,
      driverId,
      registrationStatus,
      isLoadingSession,
      isSubmitted,
      isSaving: savingAction !== null,
      savingAction,
      saveError,
      lastSavedAt,
      // Errors
      personalInfoErrors: personalInfoValidation.errors,
      vehicleInfoErrors: vehicleInfoValidation.errors,
      documentsInfoErrors: documentsInfoValidation.errors,
      // Validity
      isPersonalInfoValid,
      isVehicleInfoValid,
      isDocumentsInfoValid,
      requiresMechanicalInspection,
      isRegistrationValid,
      canSaveDraft,
      // Actions
      updatePersonalInfo,
      updateVehicleInfo,
      updateDocumentsInfo,
      touchField,
      touchFields,
      saveDraft,
      submitRegistration,
      updateApprovedProfile,
      resetRegistration,
      loginAsApprovedDemoDriver,
    }),
    [
      personalInfo,
      vehicleInfo,
      documentsInfo,
      touchedFields,
      driverId,
      registrationStatus,
      isLoadingSession,
      isSubmitted,
      savingAction,
      saveError,
      lastSavedAt,
      personalInfoValidation,
      vehicleInfoValidation,
      documentsInfoValidation,
      isPersonalInfoValid,
      isVehicleInfoValid,
      isDocumentsInfoValid,
      requiresMechanicalInspection,
      isRegistrationValid,
      canSaveDraft,
      updatePersonalInfo,
      updateVehicleInfo,
      updateDocumentsInfo,
      touchField,
      touchFields,
      saveDraft,
      submitRegistration,
      updateApprovedProfile,
      resetRegistration,
      loginAsApprovedDemoDriver,
    ]
  );

  return (
    <DriverRegistrationContext.Provider value={value}>
      {children}
    </DriverRegistrationContext.Provider>
  );
}
