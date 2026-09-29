import { collection, doc, setDoc, type FieldValue } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { db, storage, serverTimestamp } from '../lib/firebase';

// ----------- Validation constants -----------
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MiB

/**
 * Validates the payment screenshot file.
 * Throws an Error with a user‑friendly message if validation fails.
 */
export function validatePaymentFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload JPG, PNG or WebP.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image size exceeds 2 MiB limit. Please choose a smaller file.');
  }
}

/**
 * Uploads the payment screenshot to Firebase Storage.
 * Returns the download URL, storage path, original filename, and upload timestamp.
 */
export async function uploadPaymentScreenshot(
  registrationId: string,
  file: File
): Promise<{
  screenshotUrl: string;
  screenshotPath: string;
  originalFileName: string;
  uploadedAt: FieldValue;
}> {
  // Generate a safe unique filename – preserve original extension only.
  const ext = file.name.split('.').pop() ?? 'jpg';
  const safeName = `payment-proof-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}.${ext}`;
  const path = `payment-screenshots/${registrationId}/${safeName}`;
  const fileRef = storageRef(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, file);
    uploadTask.on(
      'state_changed',
      () => {}, // no UI progress needed
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            screenshotUrl: url,
            screenshotPath: path,
            originalFileName: file.name,
            uploadedAt: serverTimestamp(),
          });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

/**
 * Submits a full registration.
 * Steps:
 *   1️⃣ Create a Firestore document with an auto‑generated ID.
 *   2️⃣ Validate and upload the payment screenshot.
 *   3️⃣ Write the complete payload (including event metadata).
 *   4️⃣ If any step fails, clean up the uploaded screenshot to avoid orphaned storage objects.
 */
export async function submitRegistration(formData: {
  teamName: string;
  paymentScreenshot: string | null; // retained for backward compatibility (unused)
  paymentScreenshotName: string;
  members: [
    {
      name: string;
      collegeGmail?: string;
      phone: string;
      regNo: string;
      year?: string;
      department?: string;
      hostelName: string;
      roomNo: string;
      wardenName: string;
      wardenPhone: string;
    },
    {
      name: string;
      collegeGmail?: string;
      phone: string;
      regNo: string;
      year?: string;
      department?: string;
      hostelName: string;
      roomNo: string;
      wardenName: string;
      wardenPhone: string;
    },
    {
      name: string;
      collegeGmail?: string;
      phone: string;
      regNo: string;
      year?: string;
      department?: string;
      hostelName: string;
      roomNo: string;
      wardenName: string;
      wardenPhone: string;
    },
    {
      name: string;
      collegeGmail?: string;
      phone: string;
      regNo: string;
      year?: string;
      department?: string;
      hostelName: string;
      roomNo: string;
      wardenName: string;
      wardenPhone: string;
    }
  ];
  paymentFile: File;
}) {
  // 1️⃣ Create a new document reference (auto‑ID)
  const registrationsCol = collection(db, 'registrations');
  const newDocRef = doc(registrationsCol);
  const registrationId = newDocRef.id;

  // Guard: payment file must be provided
  if (!formData.paymentFile) {
    throw new Error('Payment screenshot file is missing.');
  }
  // Validate file before upload
  validatePaymentFile(formData.paymentFile);

  // 2️⃣ Upload screenshot
  let uploadResult: {
    screenshotUrl: string;
    screenshotPath: string;
    originalFileName: string;
    uploadedAt: FieldValue;
  };
  try {
    uploadResult = await uploadPaymentScreenshot(registrationId, formData.paymentFile);
  } catch {
    throw new Error('Payment screenshot upload failed. Please try again.');
  }

  // 3️⃣ Build the registration payload with event metadata
  const payload = {
    registrationId,
    eventId: 'kheprix-2k26',
    eventName: 'KHEPRIX 2K26',
    eventDate: '2026-10-02',
    eventTime: '09:00-17:00',
    venue: '8 Block',
    teamName: formData.teamName.trim(),
    teamSize: 4,
    totalAmount: 1200,
    amountPerParticipant: 300,
    members: formData.members.map((m, idx) => ({
      memberNumber: idx + 1,
      name: m.name.trim(),
      collegeGmail: (m.collegeGmail || '').trim(),
      phone: m.phone.trim(),
      regNo: m.regNo.trim(),
      year: (m.year || '').trim(),
      department: (m.department || '').trim(),
      hostelName: m.hostelName.trim(),
      roomNo: m.roomNo.trim(),
      wardenName: m.wardenName.trim(),
      wardenPhone: m.wardenPhone.trim(),
    })),
    payment: {
      screenshotUrl: uploadResult.screenshotUrl,
      screenshotPath: uploadResult.screenshotPath,
      originalFileName: uploadResult.originalFileName,
      uploadedAt: uploadResult.uploadedAt,
      status: 'pending' as const,
    },
    status: 'submitted' as const,
    paymentStatus: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 4️⃣ Persist to Firestore; on failure clean up storage
  try {
    await setDoc(newDocRef, payload);
    return registrationId;
  } catch {
    // Cleanup orphaned screenshot
    try {
      if (uploadResult?.screenshotPath) {
        await deleteObject(storageRef(storage, uploadResult.screenshotPath));
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up orphaned screenshot:', cleanupErr);
    }
    throw new Error('Registration could not be completed. Please try again.');
  }
}
