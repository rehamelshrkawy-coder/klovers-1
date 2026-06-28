const STORAGE_KEY = "klovers-onboarding-done";

export const markOnboardingDone = () => localStorage.setItem(STORAGE_KEY, "1");
export const isOnboardingDone = () => Boolean(localStorage.getItem(STORAGE_KEY));
