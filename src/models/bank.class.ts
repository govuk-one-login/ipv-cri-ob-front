export interface BankData {
  bank_id: string
  friendly_name: string
  is_sandbox: boolean
  service_status: boolean
}

type BankStatus = 'Offline' | 'Online'

export class Bank {
  bankID: string
  friendlyName: string
  sandbox: boolean
  status: BankStatus

  constructor(
    bank_id: string,
    friendly_name: string,
    is_sandbox: boolean,
    service_status: boolean
  ) {
    this.bankID = bank_id
    this.friendlyName = friendly_name
    this.sandbox = is_sandbox
    this.status = service_status ? 'Online' : 'Offline'
  }

  static fromData(data: BankData) {
    return new Bank(data.bank_id, data.bank_id, data.is_sandbox, data.service_status)
  }
}
