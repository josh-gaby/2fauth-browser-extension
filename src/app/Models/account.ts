export interface Account {
  encoded_icon: string | Blob | null;
  test: string | null;
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

export class AccountClass implements Account {
  encoded_icon: string | Blob | null = null;
  test: string | null = null;
  id: number = -1;
  group_id: number = -1;
  service: string | null = null;
  account: string | null = null;
  icon: string | null = null;
  otp_type: string | null = null;
  digits: number | null = null;
  algorithm: string | null = null;
  period: number | null = null;
  counter: number | null = null;
}
