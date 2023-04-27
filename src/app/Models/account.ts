export interface Account {
  id: number;
  group_id: number;
  service: string | null;
  account: string | null;
  icon: string | null;
  otp_type: string | null;
  digits: number | null;
  algorithm: string | null;
  period: number | null;
  counter: number | null;
}
