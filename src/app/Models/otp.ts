export interface Otp {
  password: string;
  otp_type: string;
  generated_at: number;
  period: number | null;
}
