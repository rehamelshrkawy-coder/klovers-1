-- Add trial_days column to track how many trial days admin grants on confirm
alter table trial_bookings
  add column if not exists trial_days integer;
